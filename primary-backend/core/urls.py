from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .utils import create_response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def health_check(request):
    return Response(
        create_response(status=True, message="Backend is up and running...", data=None),
        status=status.HTTP_200_OK,
    )


from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health_check, name="health_check"),
    path("api/v1/", include("api.urls")),
    path("api/auth/", include("custom_auth.urls")),
]
