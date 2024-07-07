from rest_framework import serializers
from .models import Assignment, Submission, GradingCycle, AgentAction, KnowledgeBaseItem, KnowledgeBaseItemVersion


class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = ['id', 'title', 'description', 'rubric', 'created_at']
        extra_kwargs = {'rubric': {'required': False}}

class SubmissionSerializer(serializers.ModelSerializer):
    latest_grade = serializers.SerializerMethodField()

class SubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = ['id', 'assignment', 'student_name', 'content', 'file', 'submitted_at', 'status', 'overall_score',
                  'category_scores', 'grading_critique', 'graded_at']
    def get_latest_grade(self, obj):
        latest_cycle = obj.grading_cycles.order_by('-completed_at').first()
        if latest_cycle and latest_cycle.agent_actions.filter(action_type='critique_and_revision').exists():
            revision_action = latest_cycle.agent_actions.get(action_type='critique_and_revision')
            return revision_action.output_data['revised_grade']
        return None

class AgentActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentAction
        fields = ['action_type', 'input_data', 'output_data', 'started_at', 'completed_at']

class GradingCycleSerializer(serializers.ModelSerializer):
    agent_actions = AgentActionSerializer(many=True, read_only=True)

    class Meta:
        model = GradingCycle
        fields = ['id', 'submission', 'started_at', 'completed_at', 'status', 'agent_actions']

class KnowledgeBaseItemSerializer(serializers.ModelSerializer):
    human_approved = serializers.BooleanField(source='content.human_approved', default=False)

    class Meta:
        model = KnowledgeBaseItem
        fields = ['id', 'item_type', 'content', 'status', 'created_at', 'updated_at', 'approved_by', 'approved_at']
        read_only_fields = ['approved_by', 'approved_at']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['human_approved'] = instance.content.get('human_approved', False)
        return representation

    def to_internal_value(self, data):
        internal_value = super().to_internal_value(data)
        human_approved = internal_value.pop('human_approved', False)
        if 'content' not in internal_value:
            internal_value['content'] = {}
        internal_value['content']['human_approved'] = human_approved
        return internal_value


class KnowledgeBaseItemVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeBaseItemVersion
        fields = ['id', 'item', 'content', 'created_at', 'created_by']
        read_only_fields = ['created_at', 'created_by']


class KnowledgeBaseItemDetailSerializer(serializers.ModelSerializer):
    versions = KnowledgeBaseItemVersionSerializer(many=True, read_only=True)

    class Meta:
        model = KnowledgeBaseItem
        fields = ['id', 'item_type', 'content', 'status', 'created_at', 'updated_at', 'approved_by', 'approved_at',
                  'versions']
        read_only_fields = ['approved_by', 'approved_at']