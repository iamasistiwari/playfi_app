from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.db import models
import uuid

class UserManager(BaseUserManager):
    def create_user(self, email, name, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, name=name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(primary_key=True, unique=True)
    name = models.CharField(max_length=255)
    password = models.CharField(max_length=128)
    joined_at = models.DateTimeField(auto_now_add=True)
    avatar_url = models.URLField(null=True, blank=True)
    bio = models.CharField(max_length=500, null=True, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    objects = UserManager()

    def __str__(self):
        return self.email


class Songs(models.Model):
    id = models.CharField(primary_key=True, max_length=100)
    type = models.CharField(max_length=50)
    title = models.CharField(max_length=255)
    publishedTime = models.CharField(max_length=100)
    duration = models.CharField(max_length=50)
    viewCount = models.JSONField()
    link = models.URLField()
    thumbnails = models.JSONField()
    richThumbnail = models.JSONField(null=True, blank=True)
    channel = models.JSONField()
    accessibility = models.JSONField()

    def __str__(self):
        return f"{self.id} - {self.title}"


class Playlists(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    playlistName = models.CharField(max_length=255)
    admin = models.ForeignKey(User, related_name="admin_playlists", on_delete=models.CASCADE)
    joined_users = models.ManyToManyField(User, related_name="joined_playlists", blank=True)
    isGlobal = models.BooleanField(default=False)
    songs = models.ManyToManyField(Songs, related_name="playlists", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.playlistName


class PlayHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, related_name="play_history", on_delete=models.CASCADE)
    song = models.ForeignKey(Songs, related_name="play_history", on_delete=models.CASCADE)
    played_at = models.DateTimeField(auto_now_add=True)
    duration_listened = models.IntegerField(default=0)  # seconds
    completed = models.BooleanField(default=False)  # listened >80%

    class Meta:
        ordering = ["-played_at"]
        indexes = [
            models.Index(fields=["user", "-played_at"]),
            models.Index(fields=["song", "-played_at"]),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.song.title}"


class PlaylistMembership(models.Model):
    ROLE_CHOICES = [
        ("editor", "Editor"),
        ("viewer", "Viewer"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, related_name="playlist_memberships", on_delete=models.CASCADE)
    playlist = models.ForeignKey(Playlists, related_name="memberships", on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="editor")
    joined_at = models.DateTimeField(auto_now_add=True)
    invited_by = models.ForeignKey(User, related_name="sent_invites", on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        unique_together = ("user", "playlist")

    def __str__(self):
        return f"{self.user.email} - {self.playlist.playlistName} ({self.role})"
