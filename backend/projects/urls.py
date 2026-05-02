from django.urls import path
from . import views

urlpatterns = [
    path("projects/", views.ProjectListCreateView.as_view(), name="project_list_create"),
    path("projects/<int:pk>/", views.ProjectDetailView.as_view(), name="project_detail"),
    path("projects/<int:project_id>/members/", views.ProjectMemberListView.as_view(), name="project_members"),
    path("projects/<int:project_id>/members/<int:user_id>/", views.ProjectMemberRemoveView.as_view(), name="project_member_remove"),
]
