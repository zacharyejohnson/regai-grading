from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Assignment, Submission, Critique, Grade, Rubric, SCORMData, Course, Syllabus
from .pipelines.process_syllabus import parse_file_text

User = get_user_model()

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
        fields = ['id', 'course', 'title', 'description', 'rubric', 'created_at', 'last_viewed']
        read_only_fields = ['id', 'created_at', 'last_viewed']
    def get_submission_count(self, obj):
        return Submission.objects.filter(assignment=obj).count()

class SubmissionSerializer(serializers.ModelSerializer):
    grades = GradeSerializer(many=True, read_only=True)
    critiques = CritiqueSerializer(many=True, read_only=True)

    class Meta:
        model = Submission
        fields = ['id', 'assignment', 'student_name', 'content', 'file', 'submitted_at', 'status', 'overall_score',
                  'category_scores', 'grading_critique', 'graded_at', 'grades', 'critiques']


class SyllabusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Syllabus
        fields = '__all__'


class CourseSerializer(serializers.ModelSerializer):
    syllabus = SyllabusSerializer(read_only=True)
    assignments = AssignmentSerializer(many=True, read_only=True)
    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'instructor', 'created_at', 'updated_at', 'syllabus', 'assignments']
        read_only_fields = ['id', 'instructor', 'created_at', 'updated_at']

    def create(self, validated_data):
        syllabus_file = validated_data.pop('syllabus', None)
        course = Course.objects.create(**validated_data)
        if syllabus_file:
            # Process syllabus file
            syllabus_text = parse_file_text(syllabus_file)
            syllabus = Syllabus.objects.create(
                file=syllabus_file,
                full_text=syllabus_text
            )
            course.syllabus = syllabus
            course.save()
        return course


from rest_framework import serializers
from .models import SCORMData, Submission


class SCORMSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = ['id', 'student_name', 'content', 'submitted_at', 'status']


class SCORMDataSerializer(serializers.ModelSerializer):
    submission = SubmissionSerializer(read_only=True)

    class Meta:
        model = SCORMData
        fields = [
            'id', 'submission',
            'cmi_core_student_id', 'cmi_core_student_name',
            'cmi_core_lesson_location', 'cmi_core_credit',
            'cmi_core_lesson_status', 'cmi_core_entry',
            'cmi_core_score_raw', 'cmi_core_score_min',
            'cmi_core_score_max', 'cmi_core_total_time',
            'cmi_core_lesson_mode', 'cmi_core_exit',
            'cmi_core_session_time', 'cmi_suspend_data',
            'cmi_launch_data', 'cmi_comments',
            'cmi_comments_from_lms', 'cmi_objectives',
            'cmi_student_data_mastery_score', 'cmi_student_data_max_time_allowed',
            'cmi_student_data_time_limit_action'
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        # Convert objectives and interactions to more readable format
        if instance.cmi_objectives:
            representation['cmi_objectives'] = [
                {
                    'id': obj.get('id'),
                    'score': obj.get('score'),
                    'status': obj.get('status')
                } for obj in instance.cmi_objectives
            ]

        if instance.cmi_interactions:
            representation['cmi_interactions'] = [
                {
                    'id': inter.get('id'),
                    'type': inter.get('type'),
                    'time': inter.get('time'),
                    'correct_responses': inter.get('correct_responses'),
                    'weighting': inter.get('weighting'),
                    'student_response': inter.get('student_response'),
                    'result': inter.get('result'),
                    'latency': inter.get('latency')
                } for inter in instance.cmi_interactions
            ]

        return representation


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

