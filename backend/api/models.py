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
