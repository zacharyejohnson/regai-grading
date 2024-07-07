import asyncio

from django.contrib.sessions.backends.db import SessionStore
from django.contrib.sessions.models import Session
from django.core.paginator import Paginator
from django.db import transaction
from django.shortcuts import render, get_object_or_404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Assignment, Submission, GradingCycle, AgentAction, KnowledgeBaseItem, GradingResult, \
    AssignmentAgent, KnowledgeBaseItemVersion
from .pipelines.grading import GradingPipeline
from .serializers import AssignmentSerializer, SubmissionSerializer, GradingCycleSerializer, \
    KnowledgeBaseItemSerializer, KnowledgeBaseItemDetailSerializer
from .agents.rubric_creator import RubricCreator
from .agents.grader import Grader
from .agents.critic import Critic
from celery import shared_task
import os
import dotenv
dotenv.load_dotenv()

import logging
logger = logging.getLogger(__name__)

class SessionMixin:
    def get_session(self, request):
        if not request.session.session_key:
            request.session.create()
        # logger.debug(f"Session key: {request.session.session_key}")
        return request.session

    def set_session_data(self, request, key, value):
        session = self.get_session(request)
        session[key] = value
        session.save()
        # logger.debug(f"Set session data: {key} = {value}")

    def get_session_data(self, request, key, default=None):
        session = self.get_session(request)
        value = session.get(key, default)
        # logger.debug(f"Get session data: {key} = {value}")
        return value

class AssignmentViewSet(SessionMixin, viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        self.set_session_data(request, 'current_assignment_id', instance.id)
        # logger.info(f"Retrieved assignment {instance.id} and set session data")
        return Response(serializer.data)

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        # Clear the current_assignment_id when listing assignments
        self.set_session_data(request, 'current_assignment_id', None)
        return response

    @action(detail=True, methods=['GET'])
    def knowledge_base_items(self, request, pk=None):
        assignment = self.get_object()
        items = assignment.knowledge_base_items.all()
        serializer = KnowledgeBaseItemSerializer(items, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)

        assignment = serializer.instance
        rubric_creator = RubricCreator(openai_api_key=os.environ.get('OPENAI_API_KEY'))
        result = rubric_creator.run(assignment_description=assignment.description)
        assignment.rubric = result['rubric']
        assignment.save()

        self.set_session_data(request, 'current_assignment_id', assignment.id)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['POST'])
    def generate_rubric(self, request, pk=None):
        assignment = self.get_object()
        rubric_creator = RubricCreator(openai_api_key=os.environ.get('OPENAI_API_KEY'))
        result = rubric_creator.run(assignment_description=assignment.description)
        assignment.rubric = result['rubric']
        assignment.save()
        return Response({"rubric": result['rubric'], "similar_rubrics": result['similar_rubrics']})

    @action(detail=True, methods=['POST'])
    def approve_rubric(self, request, pk=None):
        assignment = self.get_object()
        if assignment.rubric:
            assignment.rubric['human_approved'] = True
            assignment.save()
            return Response({"status": "rubric approved"})
        return Response({"status": "no rubric found"}, status=status.HTTP_400_BAD_REQUEST)

class SubmissionViewSet(SessionMixin, viewsets.ModelViewSet):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['assignment']

    def get_queryset(self):
        return Submission.objects.filter(assignment_id=self.request.query_params.get('assignment'))

    def create(self, request, *args, **kwargs):
        try:
            assignment_id = self.get_session_data(request, 'current_assignment_id')
            if not assignment_id:
                 return Response({'error': 'No current assignment selected'}, status=status.HTTP_400_BAD_REQUEST)

            data = request.data.copy()
            data["student_name"] = "Anonymous Student"
            data['assignment'] = assignment_id
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            print(e)
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @shared_task
    def grade_submission(submission_id):
        submission = Submission.objects.get(id=submission_id)
        assignment = submission.assignment

        # Initialize the grading pipeline
        grading_pipeline = GradingPipeline(
            assignment=assignment,
            openai_api_key=os.environ.get('OPENAI_API_KEY')
        )

        # Run the grading pipeline
        grading_result = grading_pipeline.run(submission)

        return grading_result

    @transaction.atomic
    def perform_create(self, serializer):
        submission = serializer.save(status='queued')
        GradingCycle.objects.create(submission=submission, status='queued')
        transaction.on_commit(lambda: self.grade_submission(submission.id))

    @action(detail=False, methods=['POST'])
    def submit_text(self, request):
        assignment_id = self.get_session_data(request, 'current_assignment_id')
        if not assignment_id:
            assignment_id = request.data.get('assignment')
            if not assignment_id:
                return Response({'error': 'No assignment ID provided'}, status=status.HTTP_400_BAD_REQUEST)
            self.set_session_data(request, 'current_assignment_id', assignment_id)

        serializer = self.get_serializer(data={
            'assignment': assignment_id,
            'content': request.data.get('text', ''),
            'student_name': request.data.get('student_name', 'Anonymous')
        })

        if serializer.is_valid():
            submission = serializer.save(status='queued')
            GradingCycle.objects.create(submission=submission, status='queued')
            transaction.on_commit(lambda: self.grade_submission(submission.id))
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['POST'])
    def upload_file(self, request):
        assignment_id = self.get_session_data(request, 'current_assignment_id')
        if not assignment_id:
            return Response({'error': 'No current assignment selected'}, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data={
            'assignment': assignment_id,
            'file': file,
            'student_name': request.data.get('student_name', 'Anonymous')
        })
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class KnowledgeBaseViewSet(viewsets.ModelViewSet):
    queryset = KnowledgeBaseItem.objects.all()
    serializer_class = KnowledgeBaseItemSerializer

    def get_queryset(self):
        queryset = KnowledgeBaseItem.objects.all()
        item_type = self.request.query_params.get('item_type', None)
        status = self.request.query_params.get('status', None)
        if item_type:
            queryset = queryset.filter(item_type=item_type)
        if status:
            queryset = queryset.filter(status=status)
        return queryset

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return KnowledgeBaseItemDetailSerializer
        return KnowledgeBaseItemSerializer

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        item = self.get_object()
        if item.status == 'approved':
            return Response({"detail": "Item is already approved."}, status=status.HTTP_400_BAD_REQUEST)

        item.status = 'approved'
        item.approved_by = request.user
        item.approved_at = timezone.now()
        item.save()

        return Response(KnowledgeBaseItemSerializer(item).data)

    @action(detail=True, methods=['post'])
    def edit(self, request, pk=None):
        item = self.get_object()
        serializer = KnowledgeBaseItemSerializer(data=request.data, partial=True)

        if serializer.is_valid():
            # Create a new version
            KnowledgeBaseItemVersion.objects.create(
                item=item,
                content=item.content,
                created_by=request.user
            )

            # Update the item
            for attr, value in serializer.validated_data.items():
                setattr(item, attr, value)
            item.save()

            return Response(KnowledgeBaseItemSerializer(item).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '')
        items = KnowledgeBaseItem.objects.filter(content__icontains=query)
        serializer = KnowledgeBaseItemSerializer(items, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        content = serializer.validated_data.get('content', {})
        content['human_approved'] = False  # Set to False by default when created
        serializer.save(content=content)


# def regai_interface(request):
#     assignments = Assignment.objects.all().order_by('-id')
#     paginator = Paginator(assignments, 9)
#     page_number = request.GET.get('page')
#     page_obj = paginator.get_page(page_number)
#     return render(request, 'regai_interface.html', {'page_obj': page_obj})
#
# def assignment_view(request, assignment_id):
#     assignment = get_object_or_404(Assignment, id=assignment_id)
#     session = SessionStore(session_key=request.session.session_key)
#     session['current_assignment_id'] = assignment_id
#     session.save()
#     return render(request, 'assignment_view.html', {'assignment': assignment})

def assignment_view(request, assignment_id):
    assignment = get_object_or_404(Assignment, id=assignment_id)
    request.session['current_assignment_id'] = assignment_id
    request.session.save()
    # logger.info(f"Set current_assignment_id in session: {assignment_id}")
    return render(request, 'assignment_view.html', {'assignment': assignment})