from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model with email as a required unique field."""
    email = models.EmailField(unique=True, blank=False)
    
    class Meta:
        ordering = ["username"]
    
    def __str__(self):
        return f"{self.get_full_name() or self.username}"
