from rest_framework import permissions

from projects.models import ProjectMember


class IsTaskProjectAdmin(permissions.BasePermission):
    """Allow full access only to project admins for task mutations."""

    def has_object_permission(self, request, view, obj):
        # Read access for any project member
        if request.method in permissions.SAFE_METHODS:
            return ProjectMember.objects.filter(
                project=obj.project, user=request.user
            ).exists()

        # Write access only for admins
        return ProjectMember.objects.filter(
            project=obj.project, user=request.user, role="admin"
        ).exists()


class CanUpdateTaskStatus(permissions.BasePermission):
    """Allow members to update only the status of tasks assigned to them."""

    def has_object_permission(self, request, view, obj):
        # Admins can do everything
        if ProjectMember.objects.filter(
            project=obj.project, user=request.user, role="admin"
        ).exists():
            return True

        # Members can only PATCH status on tasks assigned to them
        if request.method == "PATCH":
            membership = ProjectMember.objects.filter(
                project=obj.project, user=request.user
            ).exists()
            if not membership:
                return False

            # Only allow status field updates for non-admins
            allowed_fields = {"status"}
            update_fields = set(request.data.keys())
            return update_fields.issubset(allowed_fields)

        # Read access for any member
        if request.method in permissions.SAFE_METHODS:
            return ProjectMember.objects.filter(
                project=obj.project, user=request.user
            ).exists()

        return False
