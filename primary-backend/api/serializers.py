from rest_framework import serializers
from .models import User
from django.contrib.auth.hashers import make_password
from django.contrib.auth.hashers import check_password
from .models import Songs, Playlists

class UserSignupSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["email", "name", "password", "joined_at"]
        extra_kwargs = {"password": {"write_only": True}}

    password = serializers.CharField(write_only=True, min_length=8)

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError(
                "Password must be at least 8 characters long."
            )
        return value

    def create(self, validated_data):
        validated_data["password"] = make_password(validated_data["password"])
        return super().create(validated_data)


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get("email")
        password = data.get("password")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                {"email": "User with this email does not exist."}
            )

        if not check_password(password, user.password):
            raise serializers.ValidationError({"password": "Incorrect password."})
        return user
        # return {
        #     "id": user.id,
        #     "email": user.email,
        #     "name": user.name,
        #     "joined_at": user.joined_at,
        # }


class SongSerializer(serializers.ModelSerializer):
    class Meta:
        model = Songs
        fields = '__all__'


class PlaylistSerializer(serializers.ModelSerializer):
    songs = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Songs.objects.all(), required=False
    )
    admin = serializers.HiddenField(default=serializers.CurrentUserDefault())
    joined_users = serializers.PrimaryKeyRelatedField(
        many=True, queryset=User.objects.all(), required=False
    )

    class Meta:
        model = Playlists
        fields = ['id', 'playlistName', 'admin', 'joined_users', 'songs', 'created_at']

    def create(self, validated_data):
        songs = validated_data.pop('songs', [])
        joined_users = validated_data.pop('joined_users', [])
        playlist = Playlists.objects.create(**validated_data)

        if songs:
            playlist.songs.set(songs)
        if joined_users:
            playlist.joined_users.set(joined_users)

        return playlist


class PlaylistDetailSerializer(serializers.ModelSerializer):
    songs = SongSerializer(many=True, read_only=True)
    joined_users = UserSignupSerializer(many=True, read_only=True)
    admin = UserSignupSerializer(read_only=True)

    class Meta:
        model = Playlists
        fields = ['id', 'playlistName', 'admin', 'joined_users', 'songs', 'created_at']
