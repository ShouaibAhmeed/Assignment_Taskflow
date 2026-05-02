from rest_framework import permissions

from .models import ProjectMember


class IsProjectAdmin(permissions.BasePermission):
    """Allow access only to project admins."""

    def has_object_permission(self, request, view, obj):
        # obj can be a Project or ProjectMember
        project = obj if hasattr(obj, "members") else obj.project
        return ProjectMember.objects.filter(
            project=project, user=request.user, role="admin"
        ).exists()


class IsProjectMember(permissions.BasePermission):
    """Allow access to any project member (admin or member)."""

    def has_object_permission(self, request, view, obj):
        project = obj if hasattr(obj, "members") else obj.project
        return ProjectMember.objects.filter(
            project=project, user=request.user
        ).exists()


class IsProjectAdminOrReadOnly(permissions.BasePermission):
    """Admin can do anything; members can only read."""

    def has_object_permission(self, request, view, obj):
        project = obj if hasattr(obj, "members") else obj.project

        # Check membership first
        membership = ProjectMember.objects.filter(
            project=project, user=request.user
        ).first()

        if not membership:
            return False

        # Read-only for non-admins
        if request.method in permissions.SAFE_METHODS:
            return True

        return membership.role == "admin"
