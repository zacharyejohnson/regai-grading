import os

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import Assignment, Submission, SCORMData, Rubric
from ..pipelines.grading import GradingPipeline
from ..serializers import AssignmentSerializer, SubmissionSerializer, SCORMDataSerializer, SCORMSubmissionSerializer


class SCORMAssignmentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.AllowAny]

    def get_object(self):
        return self.queryset.get(id=self.kwargs['pk'])

    @action(detail=True, methods=['POST'])
    def submit(self, request, pk=None):
        print(request.data)
        assignment = self.get_object()
        serializer = SCORMSubmissionSerializer(data=request.data)
        if serializer.is_valid():
            submission = serializer.save(assignment=assignment, status='queued')
            SCORMData.objects.create(
                submission=submission,
                cmi_core_lesson_status='incomplete',
                cmi_core_entry='ab-initio',
                cmi_core_score_raw=0,
                cmi_core_score_min=0,
                cmi_core_score_max=100,
                cmi_core_total_time='0000:00:00'
            )

            # Grade the submission
            rubric = Rubric.objects.get(assignment_id=assignment.id)
            grading_pipeline = GradingPipeline(
                assignment=assignment,
                rubric=rubric,
                openai_api_key=os.environ.get('OPENAI_API_KEY'),
                llm_name='gpt-4o-mini'
            )
            result = grading_pipeline.run(submission)

            # Update SCORM data based on grading result
            scorm_data = SCORMData.objects.get(submission=submission)
            scorm_data.cmi_core_score_raw = result.get('overall_score', 0)
            scorm_data.cmi_core_lesson_status = 'completed'
            scorm_data.save()

            return Response(SubmissionSerializer(submission).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['GET', 'POST'])
    def scorm_data(self, request, pk=None):
        assignment = self.get_object()
        if request.method == 'GET':
            scorm_data, created = SCORMData.objects.get_or_create(submission__assignment=assignment)
            serializer = SCORMDataSerializer(scorm_data)
            return Response(serializer.data)
        elif request.method == 'POST':
            scorm_data, created = SCORMData.objects.get_or_create(submission__assignment=assignment)
            serializer = SCORMDataSerializer(scorm_data, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)