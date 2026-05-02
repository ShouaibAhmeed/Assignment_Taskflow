from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Project, ProjectMember
from .permissions import IsProjectAdmin, IsProjectAdminOrReadOnly
from .serializers import (
    AddMemberSerializer,
    ProjectCreateSerializer,
    ProjectMemberSerializer,
    ProjectSerializer,
)

User = get_user_model()


class ProjectListCreateView(generics.ListCreateAPIView):
    """
    GET  - List all projects the current user is a member of.
    POST - Create a new project (user becomes admin).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ProjectCreateSerializer
        return ProjectSerializer

    def get_queryset(self):
        return Project.objects.filter(
            members__user=self.request.user
        ).distinct()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = serializer.save()
        # Return full project data
        return Response(
            ProjectSerializer(project, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    - Retrieve project detail (any member).
    PUT    - Update project (admin only).
    DELETE - Delete project (admin only).
    """
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated, IsProjectAdminOrReadOnly]

    def get_queryset(self):
        return Project.objects.filter(
            members__user=self.request.user
        ).distinct()


class ProjectMemberListView(APIView):
    """
    GET  - List all members of a project.
    POST - Add a member to the project (admin only).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, project_id):
        project = self._get_project(project_id, request.user)
        if not project:
            return Response(
                {"detail": "Project not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        members = ProjectMember.objects.filter(project=project).select_related("user")
        serializer = ProjectMemberSerializer(members, many=True)
        return Response(serializer.data)

    def post(self, request, project_id):
        project = self._get_project(project_id, request.user)
        if not project:
            return Response(
                {"detail": "Project not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check admin permission
        if not ProjectMember.objects.filter(
            project=project, user=request.user, role="admin"
        ).exists():
            return Response(
                {"detail": "Only project admins can add members."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AddMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_id = serializer.validated_data["user_id"]
        role = serializer.validated_data["role"]

        # Check if already a member
        if ProjectMember.objects.filter(project=project, user_id=user_id).exists():
            return Response(
                {"detail": "User is already a member of this project."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        member = ProjectMember.objects.create(
            project=project, user_id=user_id, role=role
        )
        return Response(
            ProjectMemberSerializer(member).data,
            status=status.HTTP_201_CREATED,
        )

    def _get_project(self, project_id, user):
        try:
            project = Project.objects.get(id=project_id)
            if not ProjectMember.objects.filter(project=project, user=user).exists():
                return None
            return project
        except Project.DoesNotExist:
            return None


class ProjectMemberRemoveView(APIView):
    """Remove a member from a project (admin only)."""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, project_id, user_id):
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response(
                {"detail": "Project not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check admin permission
        if not ProjectMember.objects.filter(
            project=project, user=request.user, role="admin"
        ).exists():
            return Response(
                {"detail": "Only project admins can remove members."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Cannot remove yourself if you're the only admin
        admin_count = ProjectMember.objects.filter(
            project=project, role="admin"
        ).count()
        if int(user_id) == request.user.id and admin_count <= 1:
            return Response(
                {"detail": "Cannot remove the only admin from the project."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        membership = ProjectMember.objects.filter(
            project=project, user_id=user_id
        ).first()
        if not membership:
            return Response(
                {"detail": "User is not a member of this project."},
                status=status.HTTP_404_NOT_FOUND,
            )

        membership.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
