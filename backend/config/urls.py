"""
URL configuration for Team Task Manager project.
"""

from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include


def api_root(request):
    """Root endpoint returning API status and available endpoints."""
    return JsonResponse({
        "name": "TaskFlow API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "auth": "/api/auth/",
            "projects": "/api/projects/",
            "dashboard": "/api/dashboard/",
            "admin": "/admin/",
        }
    })


urlpatterns = [
    path("", api_root, name="api_root"),
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("projects.urls")),
    path("api/", include("tasks.urls")),
]

