# Generated by Django 5.0.4 on 2024-07-04 15:14

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Assignment",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField()),
                ("rubric", models.JSONField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name="GradingCycle",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("started_at", models.DateTimeField(auto_now_add=True)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                ("status", models.CharField(default="in_progress", max_length=20)),
            ],
        ),
        migrations.CreateModel(
            name="AssignmentAgent",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "agent_type",
                    models.CharField(
                        choices=[
                            ("rubric_creator", "Rubric Creator"),
                            ("grader", "Grader"),
                            ("critic", "Critic"),
                            ("reviser", "Reviser"),
                        ],
                        max_length=20,
                    ),
                ),
                ("configuration", models.JSONField()),
                (
                    "assignment",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="agents",
                        to="regai.assignment",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="AgentAction",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "action_type",
                    models.CharField(
                        choices=[
                            ("rubric_creation", "Rubric Creation"),
                            ("grading", "Grading"),
                            ("critique", "Critique"),
                            ("revision", "Revision"),
                        ],
                        max_length=20,
                    ),
                ),
                ("input_data", models.JSONField()),
                ("output_data", models.JSONField()),
                ("started_at", models.DateTimeField(auto_now_add=True)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                (
                    "agent",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="regai.assignmentagent",
                    ),
                ),
                (
                    "grading_cycle",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="agent_actions",
                        to="regai.gradingcycle",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="GradingResult",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("overall_score", models.FloatField()),
                ("category_scores", models.JSONField()),
                ("justification", models.TextField()),
                (
                    "grading_cycle",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="result",
                        to="regai.gradingcycle",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="KnowledgeBaseItem",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "item_type",
                    models.CharField(
                        choices=[
                            ("rubric", "Rubric"),
                            ("grade", "Grade"),
                            ("critique", "Critique"),
                        ],
                        max_length=10,
                    ),
                ),
                ("content", models.JSONField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "assignment",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="knowledge_base_items",
                        to="regai.assignment",
                    ),
                ),
            ],
            options={
                "ordering": ["-updated_at"],
            },
        ),
        migrations.CreateModel(
            name="Submission",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("student_name", models.CharField(max_length=255)),
                ("content", models.TextField()),
                (
                    "file",
                    models.FileField(blank=True, null=True, upload_to="submissions/"),
                ),
                ("submitted_at", models.DateTimeField(auto_now_add=True)),
                ("status", models.CharField(default="pending", max_length=20)),
                (
                    "assignment",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="submissions",
                        to="regai.assignment",
                    ),
                ),
            ],
        ),
        migrations.AddField(
            model_name="gradingcycle",
            name="submission",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="grading_cycles",
                to="regai.submission",
            ),
        ),
    ]
