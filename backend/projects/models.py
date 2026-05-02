from django.conf import settings
from django.db import models


class Project(models.Model):
    """A project that contains tasks and team members."""
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True, default="")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_projects",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class ProjectMember(models.Model):
    """Membership linking users to projects with a role."""
    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("member", "Member"),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="members",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_memberships",
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="member")
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("project", "user")
        ordering = ["-joined_at"]

    def __str__(self):
        return f"{self.user.username} - {self.project.name} ({self.role})"
