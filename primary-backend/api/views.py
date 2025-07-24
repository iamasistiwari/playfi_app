from django.shortcuts import get_object_or_404
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .utils import youtubeSearch
from core.utils import create_response
from rest_framework import status
from django.core.cache import cache
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import Playlists, Songs, User
from django.db.models import Q
from .serializers import PlaylistSerializer, PlaylistDetailSerializer
from rest_framework.views import APIView

@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def searchSongs(request):
    q = request.GET.get("q", "")
    if not q:
        return Response(
            create_response("error", "Query parameter 'q' is required"),
            status=status.HTTP_404_NOT_FOUND,
        )

    cache_key = f"song_search:{q.lower().replace(' ', '_')}"
    cached_data = cache.get(cache_key)

    if cached_data:
        return Response(
            create_response(True, "Feteched", cached_data), status=status.HTTP_200_OK
        )

    try:
        results = youtubeSearch(q)
        cache.set(cache_key, results, timeout=60 * 60 * 24)  # Cache for 24 hours
        return Response(
            create_response(True, "Feteched", results), status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(
            create_response(False, "An error occurred while fetching data"),
            status=status.HTTP_404_NOT_FOUND,
        )




@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def addUserToPlaylist(request):
    playlist_id = request.data.get("playlist_id")
    user_email = request.data.get("user_email")
    user = request.user

    if not playlist_id or not user_email:
        return Response(create_response(False, "playlist_id and user_email are required"), status=status.HTTP_400_BAD_REQUEST)

    try:
        playlist = Playlists.objects.get(id=playlist_id)
    except Playlists.DoesNotExist:
        return Response(create_response(False, "playlist_id not found"), status=status.HTTP_404_NOT_FOUND)


    if playlist.admin != user:
        return Response(create_response(False, "Only admins can add user to playlist"), status=status.HTTP_403_FORBIDDEN)

    if(user.email == user_email):
        return Response(create_response(False, "Admins cannot add himself"), status=status.HTTP_403_FORBIDDEN)
    
    try:
        user_to_add = User.objects.get(email=user_email)
    except User.DoesNotExist:
        return Response(create_response(False, "User with provided email does not exist"), status=status.HTTP_404_NOT_FOUND)


    if user_to_add in playlist.joined_users.all():
        return Response(create_response(True, "User already in playlist"), status=status.HTTP_200_OK)

    playlist.joined_users.add(user_to_add)
    playlist.save()

    return Response(create_response(True, f"{user_email} added to playlist successfully"), status=status.HTTP_200_OK)



@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def addSongsToPlaylist(request):
    playlist_id = request.data.get("playlist_id")
    song_data = request.data.get("song_data")

    if not playlist_id or not song_data:
        return Response(create_response(False, "playlist_id and song_data are required"), status=status.HTTP_400_BAD_REQUEST)

    try:
        playlist = Playlists.objects.get(id=playlist_id)
    except Playlists.DoesNotExist:
        return Response(create_response(False, "playlist_id not found"), status=status.HTTP_404_NOT_FOUND)

    

    song_id = song_data.get("id")
    if not song_id:
        return Response(create_response(False, "Song ID is required in song_data"), status=status.HTTP_400_BAD_REQUEST)
    
    if playlist.songs.filter(id=song_id).exists():
        return Response(create_response(False, "Song already in playlist"), status=status.HTTP_208_ALREADY_REPORTED)


    # Try to get the song
    song, created = Songs.objects.get_or_create(
        id=song_id,
        defaults={
            "type": song_data.get("type", ""),
            "title": song_data.get("title", ""),
            "published_time": song_data.get("published_time", ""),
            "duration": song_data.get("duration", ""),
            "view_count": song_data.get("view_count", 0),
            "link": song_data.get("link", ""),
            "thumbnails": song_data.get("thumbnails", {}),
            "rich_thumbnail": song_data.get("rich_thumbnail", None),
            "channel": song_data.get("channel", {}),
            "accessibility": song_data.get("accessibility", {}),
        },
    )
    playlist.songs.add(song)
    return Response(create_response(True, f"{song.title} added in {playlist.playlistName}"), status=status.HTTP_200_OK)


class UserSinglePlaylistsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        user = request.user
        if not pk:
            return Response(create_response(False, "Playlist ID is required in URL"), status=status.HTTP_400_BAD_REQUEST)
        playlist = get_object_or_404(
            Playlists.objects.filter(Q(admin=user) | Q(joined_users=user)).distinct(),
            pk=pk
        )
        serializer = PlaylistDetailSerializer(playlist)
        return Response(create_response(True, f"{pk} fetched", serializer.data), status=status.HTTP_200_OK)

    def put(self, request, pk=None):
        user = request.user
        if not pk:
            return Response(create_response(False, "Playlist ID is required in URL"), status=status.HTTP_400_BAD_REQUEST)

        playlist = get_object_or_404(
            Playlists.objects.filter(Q(admin=user) | Q(joined_users=user)).distinct(),
            pk=pk
        )

        serializer = PlaylistSerializer(playlist, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(create_response(True, f"{playlist.name} updated", serializer.data), status=status.HTTP_200_OK)

        return Response(create_response(False, serializer.errors), status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk=None):
        user = request.user
        if not pk:
            return Response(create_response(False, "Playlist ID is required in URL"), status=status.HTTP_400_BAD_REQUEST)

        playlist = get_object_or_404(Playlists, pk=pk)

        if playlist.admin != user:
            return Response(create_response(False, "Only admin can delete playlist"), status=status.HTTP_403_FORBIDDEN)

        playlist.delete()
        return Response(create_response(True, f"{playlist.name} deleted"), status=status.HTTP_204_NO_CONTENT)


class UserPlaylistsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        playlists = Playlists.objects.filter(Q(admin=user) | Q(joined_users=user)).distinct()
        serializer = PlaylistSerializer(playlists, many=True)
        return Response(create_response(True, "Feteched", serializer.data), status=status.HTTP_200_OK)

    def post(self, request):
        serializer = PlaylistSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(create_response(True, "created", serializer.data), status=status.HTTP_201_CREATED)
        
        return Response(create_response(False, "Failed to create playlist", serializer.errors), status=status.HTTP_400_BAD_REQUEST)
