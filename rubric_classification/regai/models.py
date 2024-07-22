from django.db import models
import json
from django.contrib.auth.models import User
from django.utils import timezone

class BaseKnowledgeItem(models.Model):
    assignment = models.ForeignKey('Assignment', on_delete=models.CASCADE, related_name='%(class)s_items')
    submission = models.ForeignKey('Submission', on_delete=models.CASCADE, related_name='%(class)s_items', null=True, blank=True)
    content = models.JSONField()
    human_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True



class Grade(BaseKnowledgeItem):
    TYPE_CHOICES = (
        ('initial', 'Initial'),
        ('revision', 'Revision'),
        ('final', 'Final'),
    )
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)

class Critique(BaseKnowledgeItem):
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE, related_name='critiques')


class Assignment(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    rubric = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_viewed = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.title

class Rubric(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='rubrics')
    content = models.JSONField()
    human_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)


class Submission(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student_name = models.CharField(max_length=255)
    content = models.TextField()
    file = models.FileField(upload_to='submissions/', null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='pending')
    overall_score = models.FloatField(null=True, blank=True)
    category_scores = models.JSONField(null=True, blank=True)
    grading_critique = models.JSONField(null=True, blank=True)
    graded_at = models.DateTimeField(null=True, blank=True)
    grades = models.ManyToManyField(Grade, related_name='submissions', blank=True)

    def __str__(self):
        return f"Submission by {self.student_name} for {self.assignment}"


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


