from django.db import models
from django.contrib.auth.models import User

class LakawonClass(models.Model):
    CLASS_TYPE_CHOICES = [
        ('regular', 'Regular'),
        ('demo', 'Demo'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lakawon_classes')
    date = models.DateField()
    time = models.TimeField()
    class_type = models.CharField(max_length=10, choices=CLASS_TYPE_CHOICES, default='regular')
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=5.00)  # $5 for regular, $3 for demo
    cancelled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-time']
        unique_together = ['user', 'date', 'time']  # Prevent duplicate classes at same time
    
    def __str__(self):
        return f"{self.user.username} - {self.date} {self.time} ({self.class_type})"
    
    def save(self, *args, **kwargs):
        # Automatically set amount based on class type
        if self.class_type == 'demo':
            self.amount = 3.00
        else:
            self.amount = 5.00
        super().save(*args, **kwargs)


class LakawonDeduction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lakawon_deductions')
    date = models.DateField()
    time = models.TimeField()
    student_name = models.CharField(max_length=200)
    reason = models.TextField()
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=5.00)  # Default $5 deduction
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-time']
    
    def __str__(self):
        return f"{self.user.username} - {self.date} {self.time} - {self.student_name} (${self.amount})"


class Income(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='incomes')
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.description} ({self.currency} {self.amount})"


class Expense(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expenses')
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.description} ({self.currency} {self.amount})"


class Debt(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='debts')
    person = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    date = models.DateField()
    returned = models.BooleanField(default=False)
    returnedDate = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.person} ({self.currency} {self.amount})"


class Loan(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='loans')
    person = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    date = models.DateField()
    returned = models.BooleanField(default=False)
    returnedDate = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.person} ({self.currency} {self.amount})"


class Savings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='savings')
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.amount}"


# Productivity Models
class Task(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    
    RECURRENCE_CHOICES = [
        ('once', 'One-time'),
        ('daily', 'Daily'),
        ('weekdays', 'Weekdays'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=500)
    scheduled_time = models.TimeField(null=True, blank=True)
    date = models.DateField()
    completed = models.BooleanField(default=False)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    recurrence = models.CharField(max_length=10, choices=RECURRENCE_CHOICES, default='once')
    is_template = models.BooleanField(default=False)  # True if this is the recurring template
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['date', 'scheduled_time']
        indexes = [
            models.Index(fields=['user', 'date']),
            models.Index(fields=['user', 'completed']),
            models.Index(fields=['user', 'is_template']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.date}"


class YearlyPlan(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='yearly_plans')
    title = models.TextField()
    year = models.IntegerField()
    completed = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order', '-created_at']
        indexes = [
            models.Index(fields=['user', 'year']),
        ]
    
    def __str__(self):
        return f"{self.year} - {self.title}"


class MonthlyPlan(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='monthly_plans')
    title = models.TextField()
    year = models.IntegerField()
    month = models.IntegerField()
    completed = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order', '-created_at']
        indexes = [
            models.Index(fields=['user', 'year', 'month']),
        ]
    
    def __str__(self):
        return f"{self.year}-{self.month:02d} - {self.title}"


# Nutrition & Calories Models
class NutritionProfile(models.Model):
    SEX_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
    ]

    ACTIVITY_LEVEL_CHOICES = [
        ('sedentary', 'Sedentary (little/no exercise)'),
        ('light', 'Light (1-3 days/week)'),
        ('moderate', 'Moderate (3-5 days/week)'),
        ('active', 'Active (6-7 days/week)'),
        ('athlete', 'Athlete (very intense / 2x per day)'),
        ('custom', 'Custom multiplier'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='nutrition_profile')
    sex = models.CharField(max_length=10, choices=SEX_CHOICES)
    # Either birth_date or age_years must be provided
    birth_date = models.DateField(null=True, blank=True)
    age_years = models.PositiveSmallIntegerField(null=True, blank=True)

    height_cm = models.DecimalField(max_digits=5, decimal_places=1)  # e.g. 175.0
    weight_kg = models.DecimalField(max_digits=5, decimal_places=1)  # e.g. 80.5
    activity_level = models.CharField(max_length=12, choices=ACTIVITY_LEVEL_CHOICES, default='moderate')
    activity_multiplier = models.DecimalField(max_digits=4, decimal_places=3, null=True, blank=True)  # for custom

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} nutrition profile"


class NutritionGoal(models.Model):
    GOAL_TYPE_CHOICES = [
        ('fat_loss', 'Fat loss'),
        ('maintenance', 'Maintenance'),
        ('recomp', 'Recomposition'),
        ('lean_bulk', 'Lean bulk'),
        ('bulk', 'Bulk'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='nutrition_goal')
    goal_type = models.CharField(max_length=12, choices=GOAL_TYPE_CHOICES, default='maintenance')
    # Negative = deficit, positive = surplus, 0 = maintenance
    calorie_adjustment_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    # Macro rules (grams per kg bodyweight)
    protein_g_per_kg = models.DecimalField(max_digits=4, decimal_places=2, default=1.80)
    fat_g_per_kg = models.DecimalField(max_digits=4, decimal_places=2, default=0.80)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} nutrition goal ({self.goal_type})"


class DailyMacroTarget(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='daily_macro_targets')
    date = models.DateField()

    calories = models.PositiveIntegerField()
    protein_g = models.PositiveIntegerField()
    carbs_g = models.PositiveIntegerField()
    fat_g = models.PositiveIntegerField()

    # Diagnostics (nice to show in UI)
    bmr = models.PositiveIntegerField()
    tdee = models.PositiveIntegerField()
    algorithm_version = models.CharField(max_length=32, default='mifflin_v1')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'date']
        indexes = [
            models.Index(fields=['user', 'date']),
        ]

    def __str__(self):
        return f"{self.user.username} targets {self.date}"


# Food logging (Nutrition)
class FoodItem(models.Model):
    """User-defined food catalog item (per-serving macros)."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='food_items')
    name = models.CharField(max_length=200)

    calories_kcal = models.PositiveIntegerField()
    protein_g = models.DecimalField(max_digits=6, decimal_places=1, default=0)
    carbs_g = models.DecimalField(max_digits=6, decimal_places=1, default=0)
    fat_g = models.DecimalField(max_digits=6, decimal_places=1, default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name', '-created_at']
        indexes = [
            models.Index(fields=['user', 'name']),
        ]

    def __str__(self):
        return f"{self.user.username} food: {self.name}"


class FoodLogEntry(models.Model):
    """A logged consumption of a FoodItem on a given day."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='food_log_entries')
    date = models.DateField()
    food = models.ForeignKey(FoodItem, on_delete=models.CASCADE, related_name='log_entries')
    servings = models.DecimalField(max_digits=6, decimal_places=2, default=1)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'date']),
        ]

    def __str__(self):
        return f"{self.user.username} ate {self.food.name} ({self.servings}) on {self.date}"


class WeightCheckIn(models.Model):
    """Bodyweight check-in, typically weekly."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='weight_checkins')
    date = models.DateField()
    weight_kg = models.DecimalField(max_digits=5, decimal_places=1)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'date']
        ordering = ['-date']
        indexes = [
            models.Index(fields=['user', 'date']),
        ]

    def __str__(self):
        return f"{self.user.username} weigh-in {self.date}: {self.weight_kg}kg"
