from rest_framework import serializers

from accounts.serializers import UserMinimalSerializer
from projects.models import ProjectMember
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    """Full task serializer with user info and computed fields."""
    assigned_to_detail = UserMinimalSerializer(source="assigned_to", read_only=True)
    created_by_detail = UserMinimalSerializer(source="created_by", read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)

    class Meta:
        model = Task
        fields = [
            "id", "title", "description", "project", "project_name",
            "assigned_to", "assigned_to_detail",
            "created_by", "created_by_detail",
            "status", "priority", "due_date",
            "is_overdue", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]


class TaskCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating tasks with validation."""

    class Meta:
        model = Task
        fields = [
            "id", "title", "description", "assigned_to",
            "status", "priority", "due_date",
        ]

    def validate_assigned_to(self, value):
        if value is None:
            return value
        project = self.context.get("project")
        if project and not ProjectMember.objects.filter(
            project=project, user=value
        ).exists():
            raise serializers.ValidationError(
                "Assigned user must be a member of this project."
            )
        return value

    def create(self, validated_data):
        validated_data["project"] = self.context["project"]
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class TaskStatusUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating task status only."""

    class Meta:
        model = Task
        fields = ["status"]
