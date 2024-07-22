import json
import os
from django.db import transaction
from django.db.models import Prefetch
from django.utils import timezone
from django.contrib.auth.models import User
from django.forms.models import model_to_dict
from haystack.document_stores.errors import DuplicateDocumentError
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from celery import shared_task

from .models import Assignment, Submission, Critique, Rubric, Grade
from .serializers import AssignmentSerializer, SubmissionSerializer, CritiqueSerializer, RubricSerializer, GradeSerializer
from .pipelines.rubric_generation import RubricGenerationPipeline
from .pipelines.grading import GradingPipeline
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

import logging

logger = logging.getLogger(__name__)

from haystack.dataclasses import Document
from haystack.document_stores.in_memory import InMemoryDocumentStore
from haystack.components.retrievers import InMemoryEmbeddingRetriever
from haystack.components.embedders import SentenceTransformersTextEmbedder

# Initialize document store and retriever
document_store = InMemoryDocumentStore(embedding_similarity_function="cosine")
embedder = SentenceTransformersTextEmbedder()
retriever = InMemoryEmbeddingRetriever(document_store=document_store)
embedder.warm_up()


class BaseKnowledgeItemViewSet(viewsets.ModelViewSet):
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        # Update only the content field
        instance.content = serializer.validated_data.get('content', instance.content)
        if isinstance(instance.content, dict) and 'content' in instance.content.keys():
            instance.content = instance.content['content']

        instance.human_approved = True
        if request.user.is_authenticated:
            instance.approved_by = request.user
        instance.approved_at = timezone.now()

        instance.save()

        return Response(self.get_serializer(instance).data)

class RubricViewSet(BaseKnowledgeItemViewSet):
    queryset = Rubric.objects.all()
    serializer_class = RubricSerializer

    def get_queryset(self):
        queryset = Rubric.objects.all()
        assignment_id = self.request.query_params.get('assignment', None)
        if assignment_id:
            print("fetching rubric for assignment with id = {}".format(assignment_id))
            queryset = queryset.filter(assignment_id=assignment_id)
        return queryset

class GradeViewSet(BaseKnowledgeItemViewSet):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer


class CritiqueViewSet(BaseKnowledgeItemViewSet):
    queryset = Critique.objects.all()
    serializer_class = CritiqueSerializer

    # def update(self, request, *args, **kwargs):
    #     partial = kwargs.pop('partial', False)
    #     instance = self.get_object()
    #     serializer = self.get_serializer(instance, data=request.data, partial=partial)
    #     serializer.is_valid(raise_exception=True)
    #
    #     # Update the content field
    #     instance.content = serializer.validated_data.get('content', instance.content)
    #
    #     # Set human_approved to True
    #     instance.human_approved = True
    #
    #     # Set approved_by if the user is authenticated
    #     if request.user.is_authenticated:
    #         instance.approved_by = request.user
    #
    #     # Set approved_at to the current time
    #     instance.approved_at = timezone.now()
    #
    #     instance.save()
    #
    #     # Update the document in the document store
    #     doc = Document(
    #         content=json.dumps(instance.content),
    #         meta={"type": "critique", "id": str(instance.id)}
    #     )
    #     embedded_doc = embedder.run(text=doc.content)
    #     doc.embedding = embedded_doc['embedding']
    #     try:
    #         document_store.write_documents([doc])
    #     except DuplicateDocumentError as e:
    #         return Response({f"Document already approved!"}, status=403)
    #
    #     return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=['POST'])
    def approve(self, request, pk=None):
        critique = self.get_object()
        critique.human_approved = True
        if request.user.is_authenticated:
            critique.approved_by = request.user
        critique.approved_at = timezone.now()
        critique.save()
        return Response({"status": "critique approved"})


class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all().order_by('-created_at')
    serializer_class = AssignmentSerializer

    def create(self, request, *args, **kwargs):
        logger.info(f"Received data for new assignment: {request.data}")
        try:
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                logger.info("Serializer is valid")
                self.perform_create(serializer)
                headers = self.get_success_headers(serializer.data)

                assignment = serializer.instance
                logger.info(f"Assignment created with ID: {assignment.id}")

                # Generate rubric using the RubricGenerationPipeline
                rubric_pipeline = RubricGenerationPipeline(
                    assignment=assignment,
                    openai_api_key=os.environ.get("OPENAI_API_KEY")
                )
                result = rubric_pipeline.run()

                # Update the serializer data with the generated rubric
                serializer_data = serializer.data
                serializer_data['rubric'] = result['rubric']

                return Response(serializer_data, status=status.HTTP_201_CREATED, headers=headers)
            else:
                logger.error(f"Serializer errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception(f"Error creating assignment: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.last_viewed = timezone.now()
        # rubric = Rubric.objects.get(assignment_id=instance.id)
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=['GET'])
    def status(self, request, pk=None):
        assignment = self.get_object()
        is_complete = assignment.rubric is not None
        return Response({'status': 'complete' if is_complete else 'in_progress'})

    @action(detail=True, methods=['POST'])
    def approve_rubric(self, request, pk=None):
        assignment = self.get_object()
        rubric = Rubric.objects.get(assignment_id=assignment.id, human_approved=False)
        if rubric:
            rubric.human_approved = True
            if request.user:
                rubric.approved_by = request.user
            rubric.approved_at = timezone.now()
            rubric.save()
            return Response({"status": "rubric approved"})
        return Response({"status": "no unapproved rubric found"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['POST'])
    def generate_rubric(self, request, pk=None):
        assignment = self.get_object()
        rubric_pipeline = RubricGenerationPipeline(
            assignment=assignment,
            openai_api_key=os.environ.get("OPENAI_API_KEY")
        )
        result = rubric_pipeline.run()
        return Response({"rubric": result['rubric'], "similar_rubrics": result['similar_rubrics']})


def grade_submission(submission_id):
    submission = Submission.objects.get(id=submission_id)
    assignment = submission.assignment
    grading_pipeline = GradingPipeline(
        assignment=assignment,
        rubric=Rubric.objects.filter(assignment_id=assignment.id).first(),
        openai_api_key=os.environ.get('OPENAI_API_KEY'),
        llm_name='llama3'
    )
    grading_result = grading_pipeline.run(submission)
    return grading_result


class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.all().order_by('-submitted_at')
    serializer_class = SubmissionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['assignment']

    def get_queryset(self):
        queryset = super().get_queryset()
        assignment_id = self.request.query_params.get('assignment')
        if assignment_id:
            queryset = queryset.filter(assignment_id=assignment_id)
        return queryset

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        submission = serializer.save(status='queued')
        transaction.on_commit(lambda: grade_submission(submission_id=submission.id))
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=['POST'])
    def submit_text(self, request):
        data = {
            'assignment': request.data.get('assignment'),
            'content': request.data.get('text', ''),
            'student_name': request.data.get('student_name', 'Anonymous')
        }
        return self.create(request, data=data)

    @action(detail=False, methods=['POST'])
    def upload_file(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        data = {
            'assignment': request.data.get('assignment'),
            'file': file,
            'student_name': request.data.get('student_name', 'Anonymous')
        }
        return self.create(request, data=data)

    @action(detail=False, methods=['GET'])
    def with_knowledge_base_items(self, request):
        assignment_id = request.query_params.get('assignment')
        if not assignment_id:
            print("here is the issue")
            return Response({"error": "Assignment ID is required"}, status=400)

        submissions = self.get_queryset().filter(assignment_id=assignment_id).prefetch_related(
            Prefetch('grades', queryset=Grade.objects.filter(type__in=['initial', 'final']), to_attr='related_grades'),
            # Prefetch('grades__critiques', queryset=Critique.objects.all(), to_attr='related_critiques'),
            Prefetch('assignment__rubrics', queryset=Rubric.objects.all(), to_attr='related_rubrics')
        )

        data = []
        for submission in submissions:
            if submission.status == 'graded':
                rubric = RubricSerializer(Rubric.objects.filter(assignment_id=assignment_id).first()).data
                print("rubric", rubric)
                initial_grade = GradeSerializer(Grade.objects.get(type='initial', submission_id=submission.id)).data
                print("initial grade: ", initial_grade)
                critique = CritiqueSerializer(Critique.objects.get(grade_id=initial_grade['id'])).data
                print("critique: ", critique)
                final_grade = GradeSerializer(Grade.objects.get(type='final', submission_id=submission.id)).data
                print(final_grade)
                submission_data = SubmissionSerializer(submission).data
                submission_data['knowledge_base_items'] = {
                    'rubric': rubric,
                    'initial_grade': initial_grade,
                    'critique': critique,
                    'final_grade': final_grade
                }
                data.append(submission_data)

        return Response(data)
