# Generated by Django 5.0.4 on 2024-07-05 13:02

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("regai", "0003_alter_assignmentagent_configuration"),
    ]

    operations = [
        migrations.AlterField(
            model_name="agentaction",
            name="output_data",
            field=models.JSONField(blank=True, null=True),
        ),
    ]
