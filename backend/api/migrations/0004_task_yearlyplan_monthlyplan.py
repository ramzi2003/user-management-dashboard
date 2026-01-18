# Generated migration for Productivity models

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('api', '0003_debt_expense_income_loan_savings'),
    ]

    operations = [
        migrations.CreateModel(
            name='Task',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=500)),
                ('scheduled_time', models.TimeField()),
                ('date', models.DateField()),
                ('completed', models.BooleanField(default=False)),
                ('priority', models.CharField(choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')], default='medium', max_length=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tasks', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['date', 'scheduled_time'],
            },
        ),
        migrations.CreateModel(
            name='YearlyPlan',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.TextField()),
                ('year', models.IntegerField()),
                ('completed', models.BooleanField(default=False)),
                ('order', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='yearly_plans', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['order', '-created_at'],
            },
        ),
        migrations.CreateModel(
            name='MonthlyPlan',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.TextField()),
                ('year', models.IntegerField()),
                ('month', models.IntegerField()),
                ('completed', models.BooleanField(default=False)),
                ('order', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='monthly_plans', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['order', '-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='task',
            index=models.Index(fields=['user', 'date'], name='api_task_user_id_date_idx'),
        ),
        migrations.AddIndex(
            model_name='task',
            index=models.Index(fields=['user', 'completed'], name='api_task_user_id_completed_idx'),
        ),
        migrations.AddIndex(
            model_name='yearlyplan',
            index=models.Index(fields=['user', 'year'], name='api_yearlyplan_user_id_year_idx'),
        ),
        migrations.AddIndex(
            model_name='monthlyplan',
            index=models.Index(fields=['user', 'year', 'month'], name='api_monthlyplan_user_id_year_month_idx'),
        ),
    ]
