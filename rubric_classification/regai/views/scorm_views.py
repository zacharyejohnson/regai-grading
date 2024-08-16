import json
from datetime import timedelta

from django.db.models import Avg, ExpressionWrapper, F, Sum
from django.db import models
from rest_framework import viewsets, status, fields
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from ..models import SCORMData, Assignment, Submission, Rubric, Grade, Critique
from ..serializers import SCORMDataSerializer, AssignmentSerializer, SubmissionSerializer, RubricSerializer, GradeSerializer, CritiqueSerializer
from ..pipelines.rubric_generation import RubricGenerationPipeline
from ..pipelines.grading import GradingPipeline
from ..pipelines.grade_override import GradeOverridePipeline
import os
import logging

logger = logging.getLogger(__name__)

class SCORMDataViewSet(viewsets.ModelViewSet):
    queryset = SCORMData.objects.all()
    serializer_class = SCORMDataSerializer

    @action(detail=False, methods=['POST'])
    def initialize(self, request):
        assignment_id = request.data.get('assignment_id')
        submission_id = request.data.get('submission_id')
        scorm_data, created = SCORMData.objects.get_or_create(
            assignment_id=assignment_id,
            submission_id=submission_id
        )
        return Response(SCORMDataSerializer(scorm_data).data)

    @action(detail=False, methods=['POST'])
    def set_value(self, request):
        assignment_id = request.data.get('assignment_id')
        submission_id = request.data.get('submission_id')
        key = request.data.get('key')
        value = request.data.get('value')
        scorm_data = SCORMData.objects.get(assignment_id=assignment_id, submission_id=submission_id)
        if key.startswith('cmi.'):
            setattr(scorm_data, key.replace('.', '_'), value)
        elif key == 'cmi.interactions':
            scorm_data.cmi_interactions.append(value)
        scorm_data.save()
        return Response({'status': 'success'})

    @action(detail=False, methods=['GET'])
    def get_value(self, request):
        assignment_id = request.query_params.get('assignment_id')
        submission_id = request.query_params.get('submission_id')
        key = request.query_params.get('key')
        scorm_data = SCORMData.objects.get(assignment_id=assignment_id, submission_id=submission_id)
        if key.startswith('cmi.'):
            value = getattr(scorm_data, key.replace('.', '_'))
        elif key == 'cmi.interactions':
            value = scorm_data.cmi_interactions
        return Response({key: value})

    @action(detail=False, methods=['POST'])
    def commit(self, request):
        assignment_id = request.data.get('assignment_id')
        submission_id = request.data.get('submission_id')
        scorm_data = SCORMData.objects.get(assignment_id=assignment_id, submission_id=submission_id)
        scorm_data.save()
        return Response({'status': 'success'})

    @action(detail=False, methods=['POST'])
    def finish(self, request):
        assignment_id = request.data.get('assignment_id')
        submission_id = request.data.get('submission_id')
        scorm_data = SCORMData.objects.get(assignment_id=assignment_id, submission_id=submission_id)
        scorm_data.cmi_core_lesson_status = 'completed'
        scorm_data.save()
        return Response({'status': 'success'})

class SCORMAPIViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['POST'])
    def LMSInitialize(self, request):
        assignment_id = request.data.get('assignment_id')
        submission_id = request.data.get('submission_id')
        scorm_data, created = SCORMData.objects.get_or_create(
            assignment_id=assignment_id,
            submission_id=submission_id
        )
        return Response({"result": "true"})

    @action(detail=False, methods=['POST'])
    def LMSFinish(self, request):
        assignment_id = request.data.get('assignment_id')
        submission_id = request.data.get('submission_id')
        scorm_data = get_object_or_404(SCORMData, assignment_id=assignment_id, submission_id=submission_id)
        scorm_data.cmi_core_lesson_status = 'completed'
        scorm_data.save()
        return Response({"result": "true"})

    @action(detail=False, methods=['POST'])
    def LMSGetValue(self, request):
        assignment_id = request.data.get('assignment_id')
        submission_id = request.data.get('submission_id')
        element = request.data.get('element')
        scorm_data = get_object_or_404(SCORMData, assignment_id=assignment_id, submission_id=submission_id)
        value = getattr(scorm_data, element.replace('.', '_'), '')
        return Response({"result": str(value)})

    @action(detail=False, methods=['POST'])
    def LMSSetValue(self, request):
        assignment_id = request.data.get('assignment_id')
        submission_id = request.data.get('submission_id')
        element = request.data.get('element')
        value = request.data.get('value')
        scorm_data = get_object_or_404(SCORMData, assignment_id=assignment_id, submission_id=submission_id)
        setattr(scorm_data, element.replace('.', '_'), value)
        scorm_data.save()
        return Response({"result": "true"})

    @action(detail=False, methods=['POST'])
    def LMSCommit(self, request):
        assignment_id = request.data.get('assignment_id')
        submission_id = request.data.get('submission_id')
        scorm_data = get_object_or_404(SCORMData, assignment_id=assignment_id, submission_id=submission_id)
        scorm_data.save()
        return Response({"result": "true"})

    @action(detail=False, methods=['POST'])
    def LMSGetLastError(self, request):
        return Response({"result": "0"})

    @action(detail=False, methods=['POST'])
    def LMSGetErrorString(self, request):
        return Response({"result": "No error"})

    @action(detail=False, methods=['POST'])
    def LMSGetDiagnostic(self, request):
        return Response({"result": "No error"})

    @action(detail=False, methods=['POST'])
    def LMSGetVersion(self, request):
        return Response({"result": "1.2"})

    @action(detail=False, methods=['POST'])
    def LMSSetStatus(self, request):
        assignment_id = request.data.get('assignment_id')
        submission_id = request.data.get('submission_id')
        status = request.data.get('status')
        scorm_data = get_object_or_404(SCORMData, assignment_id=assignment_id, submission_id=submission_id)
        scorm_data.cmi_core_lesson_status = status
        scorm_data.save()
        return Response({"result": "true"})

    @action(detail=False, methods=['POST'])
    def LMSGetEntry(self, request):
        assignment_id = request.data.get('assignment_id')
        submission_id = request.data.get('submission_id')
        scorm_data = get_object_or_404(SCORMData, assignment_id=assignment_id, submission_id=submission_id)
        entry = "ab-initio" if scorm_data.cmi_core_lesson_status == "not attempted" else "resume"
        return Response({"result": entry})

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

class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.all().order_by('-submitted_at')
    serializer_class = SubmissionSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        submission = serializer.save(status='queued')

        SCORMData.objects.create(
            assignment=submission.assignment,
            submission=submission,
            cmi_core_lesson_status='incomplete'
        )

        assignment = submission.assignment
        rubric = Rubric.objects.get(assignment_id=assignment.id)
        grading_pipeline = GradingPipeline(
            assignment=assignment,
            rubric=rubric,
            openai_api_key=os.environ.get('OPENAI_API_KEY'),
            llm_name='gpt-4o-mini'
        )

        transaction.on_commit(lambda: grading_pipeline.run(submission))
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['GET'])
    def scorm_data(self, request, pk=None):
        submission = self.get_object()
        scorm_data = SCORMData.objects.get(submission=submission)
        return Response(SCORMDataSerializer(scorm_data).data)

    @action(detail=True, methods=['POST'])
    def update_scorm_data(self, request, pk=None):
        submission = self.get_object()
        scorm_data = SCORMData.objects.get(submission=submission)
        serializer = SCORMDataSerializer(scorm_data, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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

class RubricViewSet(viewsets.ModelViewSet):
    queryset = Rubric.objects.all()
    serializer_class = RubricSerializer

    def get_queryset(self):
        queryset = Rubric.objects.all()
        assignment_id = self.request.query_params.get('assignment', None)
        if assignment_id:
            queryset = queryset.filter(assignment_id=assignment_id)
        return queryset

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        if 'content' in serializer.validated_data and 'categories' in serializer.validated_data['content']:
            for category in serializer.validated_data['content']['categories']:
                if 'weight' in category:
                    category['weight'] = float(category['weight'])

        self.perform_update(serializer)
        return Response(serializer.data)


class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer

    @action(detail=True, methods=['POST'])
    def override(self, request, pk=None):
        grade = self.get_object()
        rubric = Rubric.objects.get(assignment_id=grade.assignment_id)
        serializer = GradeSerializer(grade, data=request.data, partial=True)

        if serializer.is_valid():
            overridden_grade = serializer.validated_data

            pipeline = GradeOverridePipeline(
                assignment=grade.assignment,
                original_grade=grade,
                overridden_grade_content=overridden_grade['content'],
                rubric=rubric,
            )
            new_critique_content, new_grade_content = pipeline.run()

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

            # Update SCORM data
            scorm_data = SCORMData.objects.get(submission_id=grade.submission_id)
            scorm_data.cmi_core_score_raw = new_grade_content.get('overall_score', 0)
            scorm_data.cmi_core_lesson_status = 'completed'
            scorm_data.save()

            return Response({
                'grade': GradeSerializer(new_grade_obj).data,
                'critique': CritiqueSerializer(new_critique_obj).data,
                'scorm_data': SCORMDataSerializer(scorm_data).data
            })

        return Response(serializer.errors, status=400)

    @action(detail=True, methods=['GET'])
    def scorm_data(self, request, pk=None):
        grade = self.get_object()
        scorm_data = SCORMData.objects.get(submission_id=grade.submission_id)
        return Response(SCORMDataSerializer(scorm_data).data)


class CritiqueViewSet(viewsets.ModelViewSet):
    queryset = Critique.objects.all()
    serializer_class = CritiqueSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        instance.content = serializer.validated_data.get('content', instance.content)
        instance.human_approved = True
        if request.user.is_authenticated:
            instance.approved_by = request.user
        instance.approved_at = timezone.now()

        instance.save()

        # Update SCORM data
        scorm_data = SCORMData.objects.get(submission_id=instance.grade.submission_id)
        scorm_data.cmi_suspend_data = json.dumps({
            'critique_id': instance.id,
            'revision_status': instance.revision_status
        })
        scorm_data.save()

        return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=['POST'])
    def approve(self, request, pk=None):
        critique = self.get_object()
        critique.human_approved = True
        if request.user.is_authenticated:
            critique.approved_by = request.user
        critique.approved_at = timezone.now()
        critique.save()

        # Update SCORM data
        scorm_data = SCORMData.objects.get(submission_id=critique.grade.submission_id)
        scorm_data.cmi_core_lesson_status = 'completed'
        scorm_data.save()

        return Response({"status": "critique approved"})

    @action(detail=True, methods=['GET'])
    def scorm_data(self, request, pk=None):
        critique = self.get_object()
        scorm_data = SCORMData.objects.get(submission_id=critique.grade.submission_id)
        return Response(SCORMDataSerializer(scorm_data).data)


# Additional helper functions

def update_scorm_interactions(scorm_data, interaction_data):
    """
    Update SCORM interactions data.
    """
    interactions = scorm_data.cmi_interactions or []
    interactions.append(interaction_data)
    scorm_data.cmi_interactions = interactions
    scorm_data.save()


def calculate_total_time(scorm_data):
    """
    Calculate and update total time spent on the assignment.
    """
    # Convert cmi_core_total_time from string format to timedelta
    time_parts = scorm_data.cmi_core_total_time.split(':')
    hours, minutes, seconds = map(float, time_parts)
    total_time = timedelta(hours=hours, minutes=minutes, seconds=seconds)

    # Get the current session time
    session_start = scorm_data.session_start_time
    if session_start:
        current_session_time = timezone.now() - session_start
        total_time += current_session_time

    # Convert back to SCORM time format (HH:MM:SS.SS)
    total_seconds = total_time.total_seconds()
    hours, remainder = divmod(total_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)

    scorm_data.cmi_core_total_time = f"{int(hours):02d}:{int(minutes):02d}:{seconds:05.2f}"
    scorm_data.save()


def update_scorm_interactions(scorm_data, interaction_data):
    """
    Update SCORM interactions data.
    """
    interactions = scorm_data.cmi_interactions or []

    # Ensure the interaction has a unique ID
    interaction_id = len(interactions)
    interaction_data['id'] = interaction_id

    # Add timestamp to the interaction
    interaction_data['timestamp'] = timezone.now().isoformat()

    interactions.append(interaction_data)
    scorm_data.cmi_interactions = interactions
    scorm_data.save()


class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.all().order_by('-submitted_at')
    serializer_class = SubmissionSerializer

    @action(detail=True, methods=['POST'])
    def record_interaction(self, request, pk=None):
        submission = self.get_object()
        scorm_data, created = SCORMData.objects.get_or_create(submission=submission)
        interaction_data = request.data.get('interaction')

        if interaction_data:
            update_scorm_interactions(scorm_data, interaction_data)
            calculate_total_time(scorm_data)

        # Update lesson status if not already completed
        if scorm_data.cmi_core_lesson_status != 'completed':
            scorm_data.cmi_core_lesson_status = 'incomplete'

        # Update score if provided
        if 'score' in interaction_data:
            scorm_data.cmi_core_score_raw = interaction_data['score']

        scorm_data.save()

        return Response(SCORMDataSerializer(scorm_data).data)

    @action(detail=True, methods=['POST'])
    def start_session(self, request, pk=None):
        submission = self.get_object()
        scorm_data, created = SCORMData.objects.get_or_create(submission=submission)

        scorm_data.session_start_time = timezone.now()
        scorm_data.save()

        return Response({'status': 'Session started'})

    @action(detail=True, methods=['POST'])
    def end_session(self, request, pk=None):
        submission = self.get_object()
        scorm_data = get_object_or_404(SCORMData, submission=submission)

        if scorm_data.session_start_time:
            calculate_total_time(scorm_data)
            scorm_data.session_start_time = None
            scorm_data.save()

        return Response({'status': 'Session ended', 'total_time': scorm_data.cmi_core_total_time})

    @action(detail=True, methods=['GET'])
    def scorm_data(self, request, pk=None):
        submission = self.get_object()
        scorm_data, created = SCORMData.objects.get_or_create(submission=submission)
        return Response(SCORMDataSerializer(scorm_data).data)


class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all().order_by('-created_at')
    serializer_class = AssignmentSerializer

    @action(detail=True, methods=['GET'])
    def scorm_summary(self, request, pk=None):
        assignment = self.get_object()
        scorm_data_list = SCORMData.objects.filter(submission__assignment=assignment)

        # Calculate average time spent
        avg_time = scorm_data_list.aggregate(
            avg_time=Avg(
                ExpressionWrapper(
                    F('cmi_core_total_time'),
                    output_field=fields.DurationField()
                )
            )
        )['avg_time']

        summary = {
            'total_submissions': scorm_data_list.count(),
            'completed_submissions': scorm_data_list.filter(cmi_core_lesson_status='completed').count(),
            'average_score': scorm_data_list.aggregate(Avg('cmi_core_score_raw'))['cmi_core_score_raw__avg'],
            'average_time_spent': str(avg_time) if avg_time else "00:00:00",
            'total_interactions': scorm_data_list.aggregate(Sum(models.functions.Length('cmi_interactions')))[
                                      'cmi_interactions__length__sum'] or 0,
        }

        return Response(summary)

    @action(detail=True, methods=['GET'])
    def scorm_detailed_report(self, request, pk=None):
        assignment = self.get_object()
        scorm_data_list = SCORMData.objects.filter(submission__assignment=assignment)

        detailed_report = []
        for scorm_data in scorm_data_list:
            report_entry = {
                'submission_id': scorm_data.submission.id,
                'student_name': scorm_data.submission.student_name,
                'lesson_status': scorm_data.cmi_core_lesson_status,
                'score': scorm_data.cmi_core_score_raw,
                'total_time': scorm_data.cmi_core_total_time,
                'interaction_count': len(scorm_data.cmi_interactions),
                'last_accessed': scorm_data.submission.submitted_at,
            }
            detailed_report.append(report_entry)

        return Response(detailed_report)

# Ensure to import necessary modules and update your urls.py to include these new endpoints