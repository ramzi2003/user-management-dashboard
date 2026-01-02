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
