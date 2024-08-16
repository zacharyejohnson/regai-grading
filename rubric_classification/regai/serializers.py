from rest_framework import serializers
from .models import Assignment, Submission, Critique, Grade, Rubric, SCORMData



class BaseKnowledgeItemSerializer(serializers.ModelSerializer):
    class Meta:
        abstract = True
        fields = ['id', 'assignment',  'content', 'human_approved', 'created_at', 'approved_by', 'approved_at']
        read_only_fields = ('created_at',)

class RubricSerializer(BaseKnowledgeItemSerializer):
    class Meta(BaseKnowledgeItemSerializer.Meta):
        model = Rubric

class GradeSerializer(BaseKnowledgeItemSerializer):
    class Meta(BaseKnowledgeItemSerializer.Meta):
        model = Grade
        fields = BaseKnowledgeItemSerializer.Meta.fields + ['type', 'submission']

class CritiqueSerializer(BaseKnowledgeItemSerializer):
    grade = GradeSerializer()
    class Meta(BaseKnowledgeItemSerializer.Meta):
        model = Critique
        fields = BaseKnowledgeItemSerializer.Meta.fields + ['grade', 'submission', 'revision_status']

class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = ['id', 'title', 'description', 'rubric', 'created_at', 'last_viewed']
        read_only_fields = ['id', 'created_at', 'last_viewed']

class SubmissionSerializer(serializers.ModelSerializer):
    grades = GradeSerializer(many=True, read_only=True)
    critiques = CritiqueSerializer(many=True, read_only=True)

    class Meta:
        model = Submission
        fields = ['id', 'assignment', 'student_name', 'content', 'file', 'submitted_at', 'status', 'overall_score',
                  'category_scores', 'grading_critique', 'graded_at', 'grades', 'critiques']


class SCORMDataSerializer:
    submission = SubmissionSerializer(read_only=True)
    class Meta:
        model = SCORMData
        fields = '__all__'
