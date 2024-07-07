from django.db import models
import json

class Assignment(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    rubric = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class AssignmentAgent(models.Model):
    AGENT_TYPES = [
        ('rubric_creator', 'Rubric Creator'),
        ('grader', 'Grader'),
        ('critic', 'Critic'),
        ('reviser', 'Reviser'),
    ]
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='agents')
    agent_type = models.CharField(max_length=20, choices=AGENT_TYPES)
    configuration = models.JSONField(null=True, blank=True)

class Submission(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student_name = models.CharField(max_length=255)
    content = models.TextField()
    file = models.FileField(upload_to='submissions/', null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='pending')
    overall_score = models.FloatField(null=True, blank=True)
    category_scores = models.JSONField(null=True, blank=True)
    grading_critique = models.TextField(null=True, blank=True)
    graded_at = models.DateTimeField(null=True, blank=True)

class GradingCycle(models.Model):
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name='grading_cycles')
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, default='in_progress')

class AgentAction(models.Model):
    ACTION_TYPES = [
        ('rubric_creation', 'Rubric Creation'),
        ('grading', 'Grading'),
        ('critique', 'Critique'),
        ('revision', 'Revision'),
    ]
    grading_cycle = models.ForeignKey(GradingCycle, on_delete=models.CASCADE, related_name='agent_actions')
    agent = models.ForeignKey(AssignmentAgent, on_delete=models.CASCADE)
    action_type = models.CharField(max_length=20, choices=ACTION_TYPES)
    input_data = models.JSONField()
    output_data = models.JSONField(null=True, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

class GradingResult(models.Model):
    grading_cycle = models.OneToOneField(GradingCycle, on_delete=models.CASCADE, related_name='result')
    overall_score = models.FloatField()
    category_scores = models.JSONField()
    justification = models.TextField()


from django.db import models
from django.contrib.auth.models import User


class KnowledgeBaseItem(models.Model):
    ITEM_TYPES = (
        ('rubric', 'Rubric'),
        ('grade', 'Grade'),
        ('critique', 'Critique'),
    )
    STATUS_CHOICES = (
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
    )

    item_type = models.CharField(max_length=10, choices=ITEM_TYPES)
    content = models.JSONField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-updated_at']


class KnowledgeBaseItemVersion(models.Model):
    item = models.ForeignKey(KnowledgeBaseItem, on_delete=models.CASCADE, related_name='versions')
    content = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        ordering = ['-created_at']