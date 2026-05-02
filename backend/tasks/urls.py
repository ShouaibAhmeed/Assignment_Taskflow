from django.urls import path
from . import views

urlpatterns = [
    path("projects/<int:project_id>/tasks/", views.ProjectTaskListCreateView.as_view(), name="project_tasks"),
    path("tasks/<int:pk>/", views.TaskDetailView.as_view(), name="task_detail"),
    path("dashboard/", views.DashboardView.as_view(), name="dashboard"),
]
