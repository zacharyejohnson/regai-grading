from datetime import timedelta

from django.core.validators import MinValueValidator, MaxValueValidator
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

# In models.py

class Critique(BaseKnowledgeItem):
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE, related_name='critiques')
    revision_status = models.CharField(max_length=20, choices=[
        ('PASS', 'Pass'),
        ('MINOR_REVISION', 'Minor Revision'),
        ('MAJOR_REVISION', 'Major Revision'),
    ], default='PASS')

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


class SCORMData(models.Model):
    submission = models.OneToOneField(Submission, on_delete=models.CASCADE, related_name='scorm_data')

    # Core SCORM 1.2 fields
    cmi_core_student_id = models.CharField(max_length=255, blank=True)
    cmi_core_student_name = models.CharField(max_length=255, blank=True)
    cmi_core_lesson_location = models.CharField(max_length=255, blank=True)
    cmi_core_credit = models.CharField(max_length=9, choices=[('credit', 'credit'), ('no-credit', 'no-credit')],
                                       default='credit')
    cmi_core_lesson_status = models.CharField(max_length=13, choices=[
        ('passed', 'passed'),
        ('completed', 'completed'),
        ('failed', 'failed'),
        ('incomplete', 'incomplete'),
        ('browsed', 'browsed'),
        ('not attempted', 'not attempted')
    ], default='not attempted')
    cmi_core_entry = models.CharField(max_length=9,
                                      choices=[('ab-initio', 'ab-initio'), ('resume', 'resume'), ('', '')], default='')
    cmi_core_score_raw = models.FloatField(null=True, blank=True,
                                           validators=[MinValueValidator(0), MaxValueValidator(100)])
    cmi_core_score_min = models.FloatField(default=0.0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    cmi_core_score_max = models.FloatField(default=100.0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    cmi_core_total_time = models.CharField(max_length=13, default='0000:00:00')  # Format: HHHH:MM:SS
    cmi_core_lesson_mode = models.CharField(max_length=6,
                                            choices=[('browse', 'browse'), ('normal', 'normal'), ('review', 'review')],
                                            default='normal')
    cmi_core_exit = models.CharField(max_length=8,
                                     choices=[('time-out', 'time-out'), ('suspend', 'suspend'), ('logout', 'logout'),
                                              ('', '')], default='')
    cmi_core_session_time = models.CharField(max_length=13, default='0000:00:00')  # Format: HHHH:MM:SS

    # Suspend data
    cmi_suspend_data = models.TextField(blank=True)

    # Interactions
    cmi_interactions_count = models.IntegerField(default=0)
    # We'll store interactions as a JSON field for flexibility
    cmi_interactions = models.JSONField(default=dict)

    # Launch data
    cmi_launch_data = models.TextField(blank=True)

    # Comments
    cmi_comments = models.TextField(blank=True)

    # Objectives
    cmi_objectives_count = models.IntegerField(default=0)
    cmi_objectives = models.JSONField(default=dict)

    # Student data
    cmi_student_data_mastery_score = models.FloatField(null=True, blank=True)
    cmi_student_data_max_time_allowed = models.CharField(max_length=13, blank=True)  # Format: HHHH:MM:SS
    cmi_student_data_time_limit_action = models.CharField(max_length=19, choices=[
        ('exit,message', 'exit,message'),
        ('exit,no message', 'exit,no message'),
        ('continue,message', 'continue,message'),
        ('continue,no message', 'continue,no message')
    ], blank=True)

    class Meta:
        verbose_name = "SCORM Data"
        verbose_name_plural = "SCORM Data"

    def __str__(self):
        return f"SCORM Data for Submission {self.submission_id}"