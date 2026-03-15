from rest_framework import serializers
from .models import User, Songs, Playlists, PlayHistory, PlaylistMembership
from django.contrib.auth.hashers import make_password, check_password


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


class UserProfileSerializer(serializers.ModelSerializer):
    playlists_count = serializers.SerializerMethodField()
    total_plays = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["email", "name", "avatar_url", "bio", "joined_at", "playlists_count", "total_plays"]
        read_only_fields = ["email", "joined_at", "playlists_count", "total_plays"]

    def get_playlists_count(self, obj):
        from django.db.models import Q
        return Playlists.objects.filter(Q(admin=obj) | Q(joined_users=obj)).distinct().count()

    def get_total_plays(self, obj):
        return PlayHistory.objects.filter(user=obj).count()


class SongSerializer(serializers.ModelSerializer):
    class Meta:
        model = Songs
        fields = '__all__'


class PlayHistorySerializer(serializers.ModelSerializer):
    song = SongSerializer(read_only=True)

    class Meta:
        model = PlayHistory
        fields = ["id", "song", "played_at", "duration_listened", "completed"]


class RecordPlaySerializer(serializers.Serializer):
    song_id = serializers.CharField(max_length=100)
    duration_listened = serializers.IntegerField(default=0, min_value=0)
    completed = serializers.BooleanField(default=False)
    song_data = serializers.JSONField(required=False, default=None)


class UserSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["email", "name", "avatar_url"]


class PlaylistMemberSerializer(serializers.ModelSerializer):
    user = UserSignupSerializer(read_only=True)

    class Meta:
        model = PlaylistMembership
        fields = ["id", "user", "role", "joined_at"]


class PlaylistSerializer(serializers.ModelSerializer):
    admin = serializers.HiddenField(default=serializers.CurrentUserDefault())
    isGlobal = serializers.BooleanField(default=False)
    joined_users = serializers.PrimaryKeyRelatedField(
        many=True, queryset=User.objects.all(), required=False
    )
    songs = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Songs.objects.all(), required=False, write_only=True
    )

    class Meta:
        model = Playlists
        fields = ['id', 'playlistName', 'admin', 'joined_users', 'songs', 'created_at', "isGlobal"]

    def create(self, validated_data):
        songs = validated_data.pop('songs', [])
        joined_users = validated_data.pop('joined_users', [])
        playlist = Playlists.objects.create(**validated_data)

        if songs:
            playlist.songs.set(songs)
        if joined_users:
            playlist.joined_users.set(joined_users)

        return playlist


class PlaylistMiniDetailsSerializer(serializers.ModelSerializer):
    songs = serializers.SerializerMethodField()
    joined_users = UserSignupSerializer(many=True, read_only=True)
    admin = UserSignupSerializer(read_only=True)
    members = serializers.SerializerMethodField()

    class Meta:
        model = Playlists
        fields = ['id', 'playlistName', 'admin', 'joined_users', 'songs', 'created_at', "isGlobal", "members"]

    def get_songs(self, obj):
        top_songs = obj.songs.all()[:4]
        return SongSerializer(top_songs, many=True).data

    def get_members(self, obj):
        memberships = PlaylistMembership.objects.filter(playlist=obj).select_related("user")
        return PlaylistMemberSerializer(memberships, many=True).data


class PlaylistDetailSerializer(serializers.ModelSerializer):
    songs = SongSerializer(many=True, read_only=True)
    joined_users = UserSignupSerializer(many=True, read_only=True)
    admin = UserSignupSerializer(read_only=True)
    members = serializers.SerializerMethodField()

    class Meta:
        model = Playlists
        fields = ['id', 'playlistName', 'admin', 'joined_users', 'songs', 'created_at', "isGlobal", "members"]

    def get_members(self, obj):
        memberships = PlaylistMembership.objects.filter(playlist=obj).select_related("user")
        return PlaylistMemberSerializer(memberships, many=True).data
