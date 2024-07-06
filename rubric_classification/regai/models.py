from django.db import models

class Assignment(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    rubric = models.JSONField(blank=True, default=dict)
    description_file = models.FileField(upload_to='assignment_descriptions/', null=True, blank=True)

    def __str__(self):
        return self.title

class Submission(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student_name = models.CharField(max_length=255, null=True, blank=True)
    file = models.FileField(upload_to='submissions/')
    submitted_at = models.DateTimeField(auto_now_add=True)
    grade = models.FloatField(null=True, blank=True)
    category_scores = models.JSONField(blank=True, default=dict)
    overall_justification = models.JSONField(blank=True, default=dict)
    feedback = models.JSONField(blank=True, default=dict)