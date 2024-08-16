import json
import os
import re
from datetime import timedelta

from django.db import transaction
from django.db.models import Prefetch, Avg
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.contrib.auth.models import User
from django.forms.models import model_to_dict
from haystack.document_stores.errors import DuplicateDocumentError
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from celery import shared_task

from ..models import Assignment, Submission, Critique, Rubric, Grade
from ..pipelines.grade_override import GradeOverridePipeline
from ..serializers import AssignmentSerializer, SubmissionSerializer, CritiqueSerializer, RubricSerializer, GradeSerializer
from ..pipelines.rubric_generation import RubricGenerationPipeline
from ..pipelines.grading import GradingPipeline
from dotenv import load_dotenv, find_dotenv

from ..models import SCORMData
from ..serializers import SCORMDataSerializer

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
            queryset = queryset.filter(assignment_id=assignment_id)
        return queryset

    def get_object(self):
        queryset = self.get_queryset()
        assignment_id = self.request.query_params.get('assignment', None)
        if assignment_id:
            obj = get_object_or_404(queryset, assignment_id=assignment_id)
        else:
            obj = super().get_object()
        return obj

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        # Log the incoming data
        print("Incoming data for rubric update:", request.data)

        # Ensure weights are properly updated
        if 'content' in serializer.validated_data and 'categories' in serializer.validated_data['content']:
            for category in serializer.validated_data['content']['categories']:
                if 'weight' in category:
                    category['weight'] = float(category['weight'])

        self.perform_update(serializer)

        # Log the updated instance
        print("Updated rubric instance:", serializer.data)

        return Response(serializer.data)




class GradeViewSet(BaseKnowledgeItemViewSet):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer

    @action(detail=True, methods=['POST'])
    def override(self, request, pk=None):
        grade = self.get_object()
        rubric = Rubric.objects.get(assignment_id=grade.assignment_id)
        serializer = GradeSerializer(grade, data=request.data, partial=True)

        if serializer.is_valid():
            overridden_grade = serializer.validated_data

            # Generate critique using the GradeOverridePipeline
            pipeline = GradeOverridePipeline(
                assignment=grade.assignment,
                original_grade=grade,
                overridden_grade_content=overridden_grade['content'],
                rubric=rubric,
            )
            new_critique_content, new_grade_content = pipeline.run()

            # Create and save the new critique
            new_critique_obj = Critique.objects.create(
                assignment=grade.assignment,
                grade=grade,
                content=new_critique_content,
                revision_status=new_critique_content['revision_status'],
                human_approved=True
            )

            new_grade_obj = Grade.objects.create(
                assignment_id=grade.assignment_id,
                submission_id=grade.submission_id,
                content=new_grade_content,
                human_approved=True
            )

            scorm_data = SCORMData.objects.get(submission=new_grade_obj.submission)
            scorm_data.cmi_core_score_raw = new_grade_content.get('overall_score', 0)
            scorm_data.cmi_core_lesson_status = 'completed'
            scorm_data.save()

            return Response({
                'grade': GradeSerializer(new_grade_obj).data,
                'critique': CritiqueSerializer(new_critique_obj).data
            })

        return Response(serializer.errors, status=400)


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

                rubric_pipeline = RubricGenerationPipeline(
                    assignment=assignment,
                    openai_api_key=os.environ.get("OPENAI_API_KEY")
                )
                result = rubric_pipeline.run()

                serializer_data = serializer.data
                serializer_data['rubric'] = result['rubric']

                # # Initialize SCORM data for the assignment
                # SCORMData.objects.create(assignment=assignment)

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
        instance.save()
        serializer = self.get_serializer(instance)
        scorm_data = SCORMData.objects.get(assignment=instance)
        response_data = serializer.data
        response_data['scorm_data'] = SCORMDataSerializer(scorm_data).data
        return Response(response_data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Update SCORM data if necessary
        scorm_data = SCORMData.objects.get(assignment=instance)
        if 'scorm_data' in request.data:
            scorm_serializer = SCORMDataSerializer(scorm_data, data=request.data['scorm_data'], partial=True)
            if scorm_serializer.is_valid():
                scorm_serializer.save()

        return Response(serializer.data)

    @action(detail=True, methods=['GET'])
    def status(self, request, pk=None):
        assignment = self.get_object()
        is_complete = assignment.rubric is not None
        scorm_data = SCORMData.objects.get(assignment=assignment)
        return Response({
            'status': 'complete' if is_complete else 'in_progress',
            'scorm_status': scorm_data.cmi_core_lesson_status
        })

    @action(detail=True, methods=['POST'])
    def approve_rubric(self, request, pk=None):
        assignment = self.get_object()
        rubric = Rubric.objects.get(assignment_id=assignment.id, human_approved=False)
        if rubric:
            rubric.human_approved = True
            rubric.approved_at = timezone.now()
            rubric.save()
            # Update SCORM data
            # scorm_data = SCORMData.objects.get(assignment=assignment)
            # scorm_data.cmi_core_lesson_status = 'completed'
            # scorm_data.save()
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
        # Update SCORM data
        # scorm_data = SCORMData.objects.get(assignment=assignment)
        # scorm_data.cmi_core_lesson_status = 'incomplete'
        # scorm_data.save()
        return Response({"rubric": result['rubric'], "similar_rubrics": result['similar_rubrics']})

    @action(detail=True, methods=['GET'])
    def scorm_summary(self, request, pk=None):
        assignment = self.get_object()
        scorm_data_list = SCORMData.objects.filter(submission__assignment=assignment)
        summary = {
            'total_submissions': scorm_data_list.count(),
            'completed_submissions': scorm_data_list.filter(cmi_core_lesson_status='completed').count(),
            'average_score': scorm_data_list.aggregate(Avg('cmi_core_score_raw'))['cmi_core_score_raw__avg']
        }
        return Response(summary)


class GradingPipelineSingleton:
    _instance = None

    @classmethod
    def get_instance(cls, assignment, rubric, openai_api_key, llm_name):
        if cls._instance is None:
            cls._instance = GradingPipeline(
                assignment=assignment,
                rubric=rubric,
                openai_api_key=openai_api_key,
                llm_name=llm_name
            )
        return cls._instance

    @classmethod
    def reset_instance(cls):
        cls._instance = None

def grade_submission(submission):
    assignment = submission.assignment
    rubric = Rubric.objects.filter(assignment_id=assignment.id).first()
    grading_pipeline = GradingPipelineSingleton.get_instance(
        assignment=assignment,
        rubric=rubric,
        openai_api_key=os.environ.get('OPENAI_API_KEY'),
        llm_name='gpt-4o-mini-2024-07-18'
    )
    grading_pipeline.run(submission)


class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.all().order_by('-submitted_at')
    serializer_class = SubmissionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['assignment']

    def get_queryset(self, pk=None):
        queryset = super().get_queryset()
        assignment_id = self.request.query_params.get('assignment')
        if assignment_id:
            queryset = queryset.filter(assignment_id=pk)
        return queryset

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        submission = serializer.save(status='queued')

        # Initialize SCORM data for the submission
        SCORMData.objects.create(
            submission=submission,
            cmi_core_lesson_status='incomplete',
            cmi_core_entry='ab-initio',
            cmi_core_lesson_location='',
            cmi_core_score_raw=0,
            cmi_core_score_min=0,
            cmi_core_score_max=100,
            cmi_core_total_time='PT0H0M0S'
        )

        # Initialize GradingPipeline
        assignment = submission.assignment
        rubric = Rubric.objects.get(assignment_id=assignment.id)
        grading_pipeline = GradingPipeline(
            assignment=assignment,
            rubric=rubric,
            openai_api_key=os.environ.get('OPENAI_API_KEY'),
            llm_name='gpt-4o-mini'
        )

        transaction.on_commit(lambda: self.grade_submission(submission, grading_pipeline))
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def grade_submission(self, submission, grading_pipeline):
        result = grading_pipeline.run(submission)
        # Update SCORM data based on grading result
        scorm_data = SCORMData.objects.get(submission=submission)
        scorm_data.cmi_core_score_raw = result.get('overall_score', 0)
        scorm_data.cmi_core_lesson_status = 'completed'
        scorm_data.save()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        scorm_data = SCORMData.objects.get(submission=instance)
        response_data = serializer.data
        response_data['scorm_data'] = SCORMDataSerializer(scorm_data).data
        return Response(response_data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Update SCORM data if necessary
        scorm_data = SCORMData.objects.get(submission=instance)
        if 'scorm_data' in request.data:
            scorm_serializer = SCORMDataSerializer(scorm_data, data=request.data['scorm_data'], partial=True)
            if scorm_serializer.is_valid():
                scorm_serializer.save()

        return Response(serializer.data)

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
            return Response({"error": "Assignment ID is required"}, status=400)

        assignment = get_object_or_404(Assignment, id=assignment_id)
        submissions = Submission.objects.filter(assignment=assignment).order_by('-submitted_at')

        data = []
        for submission in submissions:
            if submission.status == 'graded':
                submission_data = SubmissionSerializer(submission).data
                try:
                    final_grade = Grade.objects.get(submission_id=submission.id, type='final')
                    critiques = Critique.objects.filter(submission_id=submission.id).order_by('created_at')
                    grade_ids = [critique.grade_id for critique in critiques]
                    non_final_grades = Grade.objects.filter(id__in=grade_ids).order_by('created_at')

                    submission_data['knowledge_base_items'] = {
                        'grades': GradeSerializer(non_final_grades, many=True).data if non_final_grades else [],
                        'critiques': CritiqueSerializer(critiques, many=True).data if critiques else [],
                        'final_grade': GradeSerializer(final_grade).data if final_grade else None,
                    }
                    scorm_data = SCORMData.objects.get(submission=submission)
                    submission_data['scorm_data'] = SCORMDataSerializer(scorm_data).data
                    data.append(submission_data)
                except Grade.DoesNotExist:
                    pass

        return Response(data)

    @action(detail=False, methods=['POST'])
    @transaction.atomic
    def bulk_submit(self, request):
        submissions_data = request.data.get('submissions', [])
        assignment_id = request.data.get('assignment')

        if not assignment_id:
            return Response({"error": "Assignment ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        assignment = get_object_or_404(Assignment, id=assignment_id)
        rubric = get_object_or_404(Rubric, assignment_id=assignment_id)

        grading_pipeline = GradingPipeline(
            assignment=assignment,
            rubric=rubric,
            openai_api_key=os.environ.get('OPENAI_API_KEY'),
            llm_name='gpt-4o-mini'
        )

        created_submissions = []
        for submission_data in submissions_data:
            serializer = self.get_serializer(data={
                'assignment': assignment_id,
                'content': submission_data.get('content', ''),
                'student_name': submission_data.get('student_name', 'Anonymous')
            })
            serializer.is_valid(raise_exception=True)
            submission = serializer.save(status='queued')
            SCORMData.objects.create(
                assignment=assignment,
                submission=submission,
                cmi_core_lesson_status='incomplete'
            )
            created_submissions.append(submission)

        with transaction.atomic():
            for submission in created_submissions:
                self.grade_submission(submission, grading_pipeline)

        return Response({
            "message": f"Successfully submitted and graded {len(created_submissions)} submissions",
            "submissions": SubmissionSerializer(created_submissions, many=True).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['POST'])
    def record_interaction(self, request, pk=None):
        submission = self.get_object()
        scorm_data = SCORMData.objects.get(submission=submission)
        interaction_data = request.data.get('interaction')

        if interaction_data:
            self.update_scorm_interactions(scorm_data, interaction_data)
            self.calculate_total_time(scorm_data)

        if 'score' in interaction_data:
            scorm_data.cmi_core_score_raw = interaction_data['score']

        scorm_data.save()

        return Response(SCORMDataSerializer(scorm_data).data)

    def add_time(self, total_time, session_duration):
        """
        Add session_duration to total_time in the format HHHH:MM:SS
        """
        # Parse the existing total_time
        match = re.match(r'(\d+):(\d+):(\d+)', total_time)
        if match:
            hours, minutes, seconds = map(int, match.groups())
            current_duration = timedelta(hours=hours, minutes=minutes, seconds=seconds)
        else:
            current_duration = timedelta()

        # Add the new session duration
        new_duration = current_duration + session_duration

        # Format the result back to HHHH:MM:SS
        total_seconds = int(new_duration.total_seconds())
        hours, remainder = divmod(total_seconds, 3600)
        minutes, seconds = divmod(remainder, 60)

        return f"{hours:04d}:{minutes:02d}:{seconds:02d}"

    def update_scorm_interactions(self, scorm_data, interaction_data):
        """
        Update SCORM interactions based on the provided data
        """
        # Get the current number of interactions
        current_interactions = scorm_data.cmi_interactions_count or 0

        # Update or add the new interaction
        interaction_id = interaction_data.get('id', current_interactions)

        # Update interaction fields
        setattr(scorm_data, f'cmi_interactions_{interaction_id}_id', interaction_data.get('id', ''))
        setattr(scorm_data, f'cmi_interactions_{interaction_id}_type', interaction_data.get('type', ''))
        setattr(scorm_data, f'cmi_interactions_{interaction_id}_time', interaction_data.get('time', ''))
        setattr(scorm_data, f'cmi_interactions_{interaction_id}_correct_responses',
                interaction_data.get('correct_responses', ''))
        setattr(scorm_data, f'cmi_interactions_{interaction_id}_weighting', interaction_data.get('weighting', ''))
        setattr(scorm_data, f'cmi_interactions_{interaction_id}_student_response',
                interaction_data.get('student_response', ''))
        setattr(scorm_data, f'cmi_interactions_{interaction_id}_result', interaction_data.get('result', ''))
        setattr(scorm_data, f'cmi_interactions_{interaction_id}_latency', interaction_data.get('latency', ''))

        # Update the interaction count if we've added a new interaction
        if interaction_id == current_interactions:
            scorm_data.cmi_interactions_count = current_interactions + 1

        scorm_data.save()

    def calculate_total_time(self, scorm_data):
        """
        Calculate and update the total time spent on the SCORM object
        """
        if scorm_data.session_start_time:
            current_time = timezone.now()
            session_duration = current_time - scorm_data.session_start_time

            # Convert session_duration to timedelta
            session_timedelta = timedelta(seconds=int(session_duration.total_seconds()))

            # Update total time
            scorm_data.cmi_core_total_time = self.add_time(scorm_data.cmi_core_total_time, session_timedelta)
            scorm_data.save()

    @action(detail=True, methods=['POST'])
    def record_interaction(self, request, pk=None):
        submission = self.get_object()
        scorm_data = SCORMData.objects.get(submission=submission)
        interaction_data = request.data.get('interaction')

        if interaction_data:
            self.update_scorm_interactions(scorm_data, interaction_data)
            self.calculate_total_time(scorm_data)

        if 'score' in interaction_data:
            scorm_data.cmi_core_score_raw = interaction_data['score']

        scorm_data.save()

        return Response(SCORMDataSerializer(scorm_data).data)

    @action(detail=True, methods=['POST'])
    def start_session(self, request, pk=None):
        submission = self.get_object()
        scorm_data = SCORMData.objects.get(submission=submission)

        scorm_data.session_start_time = timezone.now()
        scorm_data.cmi_core_entry = 'resume' if scorm_data.cmi_core_lesson_status == 'incomplete' else ''
        scorm_data.save()

        return Response({'status': 'Session started'})

    @action(detail=True, methods=['POST'])
    def end_session(self, request, pk=None):
        submission = self.get_object()
        scorm_data = SCORMData.objects.get(submission=submission)

        self.calculate_total_time(scorm_data)

        scorm_data.cmi_core_exit = request.data.get('exit', '')
        scorm_data.cmi_core_lesson_location = request.data.get('lesson_location', '')
        scorm_data.session_start_time = None  # Reset session start time

        scorm_data.save()

        return Response({'status': 'Session ended'})