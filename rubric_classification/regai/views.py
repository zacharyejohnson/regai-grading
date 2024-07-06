import os

from django.core.paginator import Paginator
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404, render

from .grading.submission_grader import SubmissionGrader
from .models import Assignment, Submission
from .serializers import AssignmentSerializer, SubmissionSerializer, RubricSerializer
from .rubric_manager.assignment_rubric_manager import generate_rubric, grade_submission

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 9
    page_size_query_param = 'page_size'
    max_page_size = 100

class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all().order_by('-id')
    serializer_class = AssignmentSerializer
    pagination_class = StandardResultsSetPagination

    def create(self, request, *args, **kwargs):
        print("Received data:", request.data)
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        assignment = serializer.save()
        rubric = generate_rubric(assignment.description)
        assignment.rubric = rubric
        assignment.save()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data

        # Add dummy rubric if it doesn't exist
        if not data.get('rubric'):
            data['rubric'] = [
                {
                    'category': f'Category {i + 1}',
                    'weight': 25,
                    'scoring_levels': [
                        {'name': f'Level {j + 1}', 'score': j, 'description': f'Description for Level {j + 1}'}
                        for j in range(5)
                    ]
                }
                for i in range(4)
            ]
            instance.rubric = data['rubric']
            instance.save()

        return Response(data)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        assignment = self.get_object()
        files = request.FILES.getlist('files')

        allowed_extensions = ['.pdf', '.docx', '.txt']

        for file in files:
            _, extension = os.path.splitext(file.name)
            if extension.lower() not in allowed_extensions:
                return Response({
                    'error': f'File type {extension} is not allowed. Please upload only PDF, DOCX, or TXT files.'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Create a submission for each file
            Submission.objects.create(
                assignment=assignment,
                file=file,
                student_name=file.name.split('.')[0]  # Assuming filename is student name
            )

        return Response({'status': 'Submissions uploaded successfully'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def submissions(self, request, pk=None):
        assignment = self.get_object()
        submissions = assignment.submissions.all()
        serializer = SubmissionSerializer(submissions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def upload_submissions(self, request, pk=None):
        assignment = self.get_object()
        files = request.FILES.getlist('files')
        for file in files:
            Submission.objects.create(assignment=assignment, file=file)
        return Response({'status': 'Submissions uploaded'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'])
    def update_rubric(self, request, pk=None):
        assignment = self.get_object()
        category_index = request.data.get('categoryIndex')
        level_index = request.data.get('levelIndex')
        updated_level = request.data.get('updatedLevel')

        if all(v is not None for v in [category_index, level_index, updated_level]):
            rubric = assignment.rubric
            rubric[category_index]['scoring_levels'][level_index] = updated_level
            assignment.rubric = rubric
            assignment.save()
            return Response({'status': 'Rubric updated'})
        return Response({'error': 'Invalid data'}, status=status.HTTP_400_BAD_REQUEST)

class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer

    @action(detail=True, methods=['post'])
    def grade_submission(self, request, pk=None):
        submission = self.get_object()
        assignment = submission.assignment
        grader = SubmissionGrader()
        evaluation = grader.evaluate_submission(submission.file.read().decode('utf-8'), assignment.rubric)

        # Calculate the percentage
        max_score = sum(category['weight'] for category in assignment.rubric)
        percentage = (evaluation['overall_score'] / max_score) * 100

        submission.grade = percentage / 100  # Store as a decimal
        submission.feedback = evaluation
        submission.save()
        return Response(self.get_serializer(submission).data)
def regai_interface(request):
    assignments = Assignment.objects.all().order_by('-id')
    paginator = Paginator(assignments, 9)  # Show 9 assignments per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    print(f"Number of assignments: {len(page_obj)}")  # Add this line
    return render(request, 'regai_interface.html', {'page_obj': page_obj})

def assignment_view(request, assignment_id):
    assignment = get_object_or_404(Assignment, id=assignment_id)
    return render(request, 'assignment_view.html', {'assignment': assignment})