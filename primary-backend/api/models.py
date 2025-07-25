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
    published_time = models.CharField(max_length=100)
    duration = models.CharField(max_length=50)
    view_count = models.BigIntegerField()
    link = models.URLField()
    thumbnails = models.JSONField()
    rich_thumbnail = models.JSONField(null=True, blank=True)
    channel = models.JSONField()
    accessibility = models.JSONField()

    def __str__(self):
        return self.title

class Playlists(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    playlistName = models.CharField(max_length=255)
    
    admin = models.ForeignKey(User, related_name="admin_playlists", on_delete=models.CASCADE)

    joined_users = models.ManyToManyField(User, related_name="joined_playlists", blank=True)

    songs = models.ManyToManyField(Songs, related_name="playlists", blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name



    

