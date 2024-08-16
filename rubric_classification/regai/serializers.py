from rest_framework import serializers
<<<<<<< HEAD
from .models import Assignment, Submission, Critique, Grade, Rubric, SCORMData

=======
from .models import Assignment, Submission
>>>>>>> parent of fc22ff7 (for marsh)


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
    submission_count = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
<<<<<<< HEAD
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
=======
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
>>>>>>> parent of fc22ff7 (for marsh)
