import email
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
import uuid
import re
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .utils import youtubeSearch, getYoutubeMusicUrl, getExpiryTimeout, format_sentence
from core.utils import create_response
from rest_framework import status
from django.core.cache import cache
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import Playlists, Songs, User
from django.db.models import Q
from .serializers import PlaylistSerializer, PlaylistDetailSerializer, PlaylistMiniDetailsSerializer
from rest_framework.views import APIView

@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def playSong(request):
    songId = request.GET.get("songId", "").replace(" ", "").strip('"')
    if not songId :
        return Response(
            create_response(False, "Query parameter 'songId' is required"),
            status=status.HTTP_404_NOT_FOUND,
        )

    pattern = r'^[a-zA-Z0-9_-]{11}$'
    is_valid_id = bool(re.match(pattern, songId))
    
    if not is_valid_id :
        return Response(
            create_response(False, "Youtube video id is not valid"),
            status=status.HTTP_404_NOT_FOUND,
        )
    
    cache_key = f"song_url:{songId}"
    cached_data = cache.get(cache_key)
    if cached_data:
        return Response(
            create_response(True, "Feteched", {"url":cached_data}), status=status.HTTP_200_OK
        )
    try:
        musicUrl = getYoutubeMusicUrl(songId)
        if(musicUrl):
            timeout = getExpiryTimeout(musicUrl)
            cache.set(cache_key, musicUrl, timeout=timeout) 
            return Response(
                create_response(True, "Feteched", {"url": musicUrl}), status=status.HTTP_200_OK
            )
        else:
            return Response(
                create_response(False, "An error occurred while fetching data"),
                status=status.HTTP_404_NOT_FOUND,
            )
    except Exception as _:
        return Response(
            create_response(False, "An error occurred while fetching data"),
            status=status.HTTP_404_NOT_FOUND,
        )
    
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def searchSongs(request):
    q = request.GET.get("q", "")
    # clean query
    q = re.sub(r"[^a-zA-Z0-9\s]", "", q)
    q = q.strip('"')

    if not q:
        return Response(
            create_response(False, "Query parameter 'q' is required"),
            status=status.HTTP_404_NOT_FOUND,
        )
    
    if len(q) < 1:
        return Response(
            create_response(False, "Query atleast 3 characters"),
            status=status.HTTP_404_NOT_FOUND,
        )

    # cache search results
    cache_key = f"song_search:{q.lower().replace(' ', '_')}"
    cached_data = cache.get(cache_key)

    if cached_data:
        return Response(
            create_response(True, "Feteched from cache", cached_data), status=status.HTTP_200_OK
        )

    try:
        results = youtubeSearch(q)
        for result in results:
                result["title"] = format_sentence(result["title"])
        cache.set(cache_key, results, timeout=60 * 60 * 24 * 7)  # Cache for 1 week
        return Response(
            create_response(True, "Feteched", results), status=status.HTTP_200_OK
        )
    except Exception as e:
        print("Error fetching songs:", e)
        return Response(
            create_response(False, "An error occurred while fetching data"),
            status=status.HTTP_404_NOT_FOUND,
        )

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def makePlaylistGlobal(request):
    print(request.user)
    playlist_id = request.data.get("playlist_id")
    if not playlist_id:
        return Response(create_response(False, "playlist_id is required"), status=status.HTTP_400_BAD_REQUEST)
    try:
        playlist = Playlists.objects.get(id=playlist_id)
        if playlist.isGlobal:
            return Response(create_response(False, "Playlist is already global"), status=status.HTTP_400_BAD_REQUEST)
        if playlist.admin != request.user:
            return Response(create_response(False, "Only admins can make playlist global"), status=status.HTTP_403_FORBIDDEN)
        playlist.isGlobal = True
        playlist.save()
        return Response(create_response(True, "Playlist made global successfully", {
            "playlist_id": playlist.id,
            "isGlobal": playlist.isGlobal
        }), status=status.HTTP_200_OK)
    except Playlists.DoesNotExist:
        return Response(create_response(False, "playlist_id not found"), status=status.HTTP_404_NOT_FOUND)


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def globalPlaylists(request):
    playlists = Playlists.objects.filter(isGlobal=True)
    serializer = PlaylistMiniDetailsSerializer(playlists, many=True)
    return Response(create_response(True, "Feteched", serializer.data))


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
def removeSongFromPlaylist(request):
    playlist_id = request.data.get("playlist_id")
    song_id = request.data.get("song_id")

    if not playlist_id or not song_id:
        return Response(create_response(False, "playlist_id and song_id are required"), status=status.HTTP_400_BAD_REQUEST)

    # Validate UUID
    try:
        _ = uuid.UUID(str(playlist_id))
    except (ValueError, TypeError):
        return Response(
            create_response(False, "Invalid playlist_id format"),
            status=status.HTTP_400_BAD_REQUEST
        )
    try:
        playlist = Playlists.objects.get(id=playlist_id)
        song = Songs.objects.get(id=song_id)

        if not playlist.songs.filter(id=song_id).exists():
            return Response(create_response(False, "Song not found in playlist"), status=status.HTTP_404_NOT_FOUND)

        if playlist.admin != request.user and not playlist.joined_users.filter(email=request.user.email).exists():
            return Response(create_response(False, "Only admins or joined users can remove songs from playlist"), status=status.HTTP_403_FORBIDDEN)
        
        playlist.songs.remove(song)
        return Response(create_response(True, "Song removed from playlist successfully"), status=status.HTTP_200_OK)

    except Playlists.DoesNotExist:
        return Response(create_response(False, "playlist_id not found"), status=status.HTTP_404_NOT_FOUND)
        
    except Songs.DoesNotExist:
        return Response(create_response(False, "Song not found"), status=status.HTTP_404_NOT_FOUND)



@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def addSongsToPlaylist(request):
    playlist_id = request.data.get("playlist_id")
    song_data = request.data.get("song_data")

    if not playlist_id or not song_data:
        return Response(create_response(False, "playlist_id and song_data are required"), status=status.HTTP_400_BAD_REQUEST)

    # Validate UUID
    try:
        _ = uuid.UUID(str(playlist_id))
    except (ValueError, TypeError):
        return Response(
            create_response(False, "Invalid playlist_id format"),
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        playlist = Playlists.objects.get(id=playlist_id)
    except Playlists.DoesNotExist:
        return Response(create_response(False, "playlist_id not found"), status=status.HTTP_404_NOT_FOUND)

    song_id = song_data.get("id")

    if not song_id:
        return Response(create_response(False, "Song ID is required in song_data"), status=status.HTTP_400_BAD_REQUEST)

    if playlist.songs.filter(id=song_id).exists():
        return Response(create_response(False, "Song already in playlist"), status=status.HTTP_208_ALREADY_REPORTED)

    isJoined = playlist.joined_users.filter(email=request.user.email).exists()
    isAdmin = playlist.admin == request.user

    if not isAdmin and not isJoined:
        return Response(create_response(False, "Only admins or joined users can add songs to playlist"), status=status.HTTP_403_FORBIDDEN)

    # Try to get the song
    song, created = Songs.objects.get_or_create(
        id=song_id,
        defaults={
            "type": song_data.get("type", ""),
            "title": song_data.get("title", ""),
            "publishedTime": song_data.get("publishedTime", ""),
            "duration": song_data.get("duration", ""),
            "viewCount": song_data.get("viewCount", {}),
            "link": song_data.get("link", ""),
            "thumbnails": song_data.get("thumbnails", {}),
            "richThumbnail": song_data.get("richThumbnail", None),
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
            Playlists.objects.filter(Q(admin=user) | Q(joined_users=user) | Q(isGlobal=True)).distinct(),
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
        serializer = PlaylistMiniDetailsSerializer(playlists, many=True)
        return Response(create_response(True, "Feteched", serializer.data), status=status.HTTP_200_OK)

    def post(self, request):
        serializer = PlaylistSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(create_response(True, "created", serializer.data), status=status.HTTP_201_CREATED)
        
        return Response(create_response(False, "Failed to create playlist", serializer.errors), status=status.HTTP_400_BAD_REQUEST)
