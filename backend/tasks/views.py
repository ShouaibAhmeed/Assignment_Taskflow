from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.models import Project, ProjectMember
from .models import Task
from .permissions import CanUpdateTaskStatus
from .serializers import TaskCreateSerializer, TaskSerializer, TaskStatusUpdateSerializer


class ProjectTaskListCreateView(generics.ListCreateAPIView):
    """
    GET  - List all tasks in a project.
    POST - Create a task in a project (admin only).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return TaskCreateSerializer
        return TaskSerializer

    def get_queryset(self):
        project_id = self.kwargs["project_id"]
        qs = Task.objects.filter(
            project_id=project_id,
            project__members__user=self.request.user,
        ).select_related("assigned_to", "created_by", "project").distinct()

        # Filtering
        status_filter = self.request.query_params.get("status")
        priority_filter = self.request.query_params.get("priority")
        assigned_to = self.request.query_params.get("assigned_to")

        if status_filter:
            qs = qs.filter(status=status_filter)
        if priority_filter:
            qs = qs.filter(priority=priority_filter)
        if assigned_to:
            qs = qs.filter(assigned_to_id=assigned_to)

        return qs

    def create(self, request, *args, **kwargs):
        project_id = self.kwargs["project_id"]
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response(
                {"detail": "Project not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Only admins can create tasks
        if not ProjectMember.objects.filter(
            project=project, user=request.user, role="admin"
        ).exists():
            return Response(
                {"detail": "Only project admins can create tasks."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = TaskCreateSerializer(
            data=request.data,
            context={"request": request, "project": project},
        )
        serializer.is_valid(raise_exception=True)
        task = serializer.save()

        return Response(
            TaskSerializer(task).data,
            status=status.HTTP_201_CREATED,
        )


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    - Task detail (any member).
    PUT    - Full update (admin only).
    PATCH  - Status update (members can update assigned tasks).
    DELETE - Delete task (admin only).
    """
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated, CanUpdateTaskStatus]

    def get_queryset(self):
        return Task.objects.filter(
            project__members__user=self.request.user
        ).select_related("assigned_to", "created_by", "project").distinct()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()

        if partial:
            # PATCH - allow status updates for members
            serializer = TaskStatusUpdateSerializer(
                instance, data=request.data, partial=True
            )
        else:
            # PUT - full update, check admin
            if not ProjectMember.objects.filter(
                project=instance.project, user=request.user, role="admin"
            ).exists():
                return Response(
                    {"detail": "Only project admins can fully update tasks."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            serializer = TaskCreateSerializer(
                instance, data=request.data,
                context={"request": request, "project": instance.project},
            )

        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(TaskSerializer(instance).data)


class DashboardView(APIView):
    """Dashboard stats for the current user."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()

        # All tasks in user's projects
        user_tasks = Task.objects.filter(
            project__members__user=user
        ).distinct()

        # Tasks assigned to user
        my_tasks = user_tasks.filter(assigned_to=user)

        # Projects
        project_count = Project.objects.filter(
            members__user=user
        ).distinct().count()

        # Stats
        total_tasks = user_tasks.count()
        todo_count = user_tasks.filter(status="todo").count()
        in_progress_count = user_tasks.filter(status="in_progress").count()
        done_count = user_tasks.filter(status="done").count()
        overdue_count = user_tasks.filter(
            due_date__lt=today
        ).exclude(status="done").count()

        # My assigned tasks stats
        my_total = my_tasks.count()
        my_todo = my_tasks.filter(status="todo").count()
        my_in_progress = my_tasks.filter(status="in_progress").count()
        my_done = my_tasks.filter(status="done").count()
        my_overdue = my_tasks.filter(
            due_date__lt=today
        ).exclude(status="done").count()

        # Recent tasks (last 10)
        recent_tasks = TaskSerializer(
            user_tasks.order_by("-updated_at")[:10],
            many=True,
        ).data

        # Overdue tasks list
        overdue_tasks = TaskSerializer(
            user_tasks.filter(
                due_date__lt=today
            ).exclude(status="done").order_by("due_date")[:10],
            many=True,
        ).data

        return Response({
            "projects": {
                "total": project_count,
            },
            "all_tasks": {
                "total": total_tasks,
                "todo": todo_count,
                "in_progress": in_progress_count,
                "done": done_count,
                "overdue": overdue_count,
            },
            "my_tasks": {
                "total": my_total,
                "todo": my_todo,
                "in_progress": my_in_progress,
                "done": my_done,
                "overdue": my_overdue,
            },
            "recent_tasks": recent_tasks,
            "overdue_tasks": overdue_tasks,
        })
