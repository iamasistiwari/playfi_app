from rest_framework.decorators import api_view
from api.models import User
from api.serializers import UserSignupSerializer
from api.serializers import UserLoginSerializer
from rest_framework.response import Response
from core.utils import create_response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny
from rest_framework.decorators import permission_classes


@api_view(["POST"])
@permission_classes([AllowAny])
def handleSignup(request):
    try:
        serializer = UserSignupSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                create_response(True, "User created successfully"),
                status=status.HTTP_201_CREATED,
            )
        error_messages = {}
        for field, errors in serializer.errors.items():
            error_messages[field] = errors[0] if isinstance(errors, list) else errors
        return Response(
            create_response(False, "User not created successfully", error_messages),
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as err:
        return Response(
            create_response(False, "Something went wrong", str(err)),
            status=status.HTTP_417_EXPECTATION_FAILED,
        )

@api_view(["POST"])
@permission_classes([AllowAny])
def handleLogin(request):
    try:
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            
            return Response(
                create_response(
                    True,
                    "Login successfully",
                    {
                        "token": access_token,
                        "user": {
                            "name": user.name,
                            "email": user.email
                        }
                    },
                ),
                status=status.HTTP_200_OK,
            )

        # Extract field-specific errors for better readability
        error_messages = {}
        for field, errors in serializer.errors.items():
            error_messages[field] = errors[0] if isinstance(errors, list) else errors

        return Response(
            create_response(False, "Login failed", error_messages),
            status=status.HTTP_400_BAD_REQUEST,
        )

    except Exception as err:
        return Response(
            create_response(False, "Something went wrong", str(err)),
            status=status.HTTP_417_EXPECTATION_FAILED,
        )
