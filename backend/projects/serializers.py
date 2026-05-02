from django.contrib.auth import get_user_model
from rest_framework import serializers

from accounts.serializers import UserMinimalSerializer
from .models import Project, ProjectMember

User = get_user_model()


class ProjectMemberSerializer(serializers.ModelSerializer):
    """Serializer for project membership data."""
    user = UserMinimalSerializer(read_only=True)

    class Meta:
        model = ProjectMember
        fields = ["id", "user", "role", "joined_at"]
        read_only_fields = ["id", "joined_at"]


class AddMemberSerializer(serializers.Serializer):
    """Serializer for adding a member to a project."""
    user_id = serializers.IntegerField()
    role = serializers.ChoiceField(
        choices=ProjectMember.ROLE_CHOICES,
        default="member",
    )

    def validate_user_id(self, value):
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("User not found.")
        return value


class ProjectSerializer(serializers.ModelSerializer):
    """Full project serializer with member count and task stats."""
    created_by = UserMinimalSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()
    task_count = serializers.SerializerMethodField()
    my_role = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id", "name", "description", "created_by",
            "member_count", "task_count", "my_role",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]

    def get_member_count(self, obj):
        return obj.members.count()

    def get_task_count(self, obj):
        return obj.tasks.count() if hasattr(obj, "tasks") else 0

    def get_my_role(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            membership = obj.members.filter(user=request.user).first()
            return membership.role if membership else None
        return None


class ProjectCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new project."""

    class Meta:
        model = Project
        fields = ["id", "name", "description"]

    def create(self, validated_data):
        user = self.context["request"].user
        project = Project.objects.create(created_by=user, **validated_data)
        # Creator automatically becomes admin
        ProjectMember.objects.create(project=project, user=user, role="admin")
        return project
