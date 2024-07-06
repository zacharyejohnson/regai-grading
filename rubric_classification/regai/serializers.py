from rest_framework import serializers
from .models import Assignment, Submission

class AssignmentSerializer(serializers.ModelSerializer):
    submission_count = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = ['id', 'title', 'description', 'rubric', 'submission_count']

    def get_submission_count(self, obj):
        return obj.submissions.count()

class SubmissionSerializer(serializers.ModelSerializer):
    category_scores = serializers.JSONField()
    overall_justification = serializers.CharField()

    class Meta:
        model = Submission
        fields = ['id', 'student_name', 'grade', 'category_scores', 'feedback', 'overall_justification']
class RubricSerializer(serializers.Serializer):
    rubric = serializers.JSONField()