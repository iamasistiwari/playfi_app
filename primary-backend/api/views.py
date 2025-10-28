from time import time
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
import json
import uuid
import re
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .utils import youtubeSearch, is_valid_url, fetch_320kbps, getVideoDetails,get_high_image_url, check_valid_youtubeId, get_redis_client, check_url_song_mismatch, getRelatedSong
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
import time

@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def playSong(request):

    try:

        songId = request.GET.get("songId", "").replace(" ", "").strip('"')
        if not songId :
            return Response(
                create_response(False, "Query parameter 'songId' is required"),
                status=status.HTTP_404_NOT_FOUND,
            )

        if not check_valid_youtubeId(songId) :
            return Response(
                create_response(False, "Youtube video id is not valid"),
                status=status.HTTP_404_NOT_FOUND,
            )
        

        high_image_url = get_high_image_url(songId)

        temp_cache_key = f"song_url:{songId}"
        permenant_cache_key  = f"permenant_url:{songId}"
        related_songs_key = f"related_songs:{songId}"
        
        redis_client = get_redis_client()

        permenant_cached_data = redis_client.get(permenant_cache_key)

        isGetRelatedSongs = str(request.GET.get("isGetRelatedSongs", "")).strip().strip('"')
        related_songs = None
        if isGetRelatedSongs in ["1", "true", "True"]:
            cached_related_songs = redis_client.get(related_songs_key)
            if cached_related_songs:
                related_songs = json.loads(cached_related_songs)
            else:
                related_songs = getRelatedSong(songId)
                song_ids = []
                if related_songs:
                    redis_client.set(related_songs_key, json.dumps(related_songs), ex=60 * 60)
                    for song in related_songs:
                        song_ids.append(song["id"])
                redis_client.lpush("songs_queue", json.dumps(song_ids))

        if permenant_cached_data:
            return Response(
                create_response(True, "Feteched from permenant cached data", {"url":permenant_cached_data, "image_url":high_image_url, "related_songs":related_songs}), status=status.HTTP_200_OK
            )

        temp_cached_data = redis_client.get(temp_cache_key)

        if temp_cached_data:
            return Response(
                create_response(True, "Feteched from temp cached data", {"url":temp_cached_data, "image_url":high_image_url, "related_songs":related_songs}), status=status.HTTP_200_OK    
            )
    except Exception as e:
        print(f"Error fetching temp cached data: {e}")
        return Response(
            create_response(False, "An error occurred while fetching temp cached data"),
            status=status.HTTP_404_NOT_FOUND,
        )

    
    
    try:
        redis_client.lpush("song_tasks", songId)  
        time.sleep(2)
        c = 0
        while c < 10:
            cached_data = redis_client.get(temp_cache_key)
            if cached_data:
                return Response(
                    create_response(True, "Fetched Realtime", {"url":cached_data, "image_url":high_image_url, "related_songs":related_songs}), status=status.HTTP_200_OK
                )
            time.sleep(1)
            c += 1
        return Response(
            create_response(False, "An error occurred while fetching data after loop 10 times"),
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
        cache.set(cache_key, results, timeout=60 * 60 * 1)  # Cache for 1 hour
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
    playlist_id = request.data.get("playlist_id")

    if not playlist_id:
        return Response(create_response(False, "playlist_id is required"), status=status.HTTP_400_BAD_REQUEST)
    
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

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def makePlaylistPrivate(request):
    playlist_id = request.data.get("playlist_id")

    if not playlist_id:
        return Response(create_response(False, "playlist_id is required"), status=status.HTTP_400_BAD_REQUEST)
    
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
        if not playlist.isGlobal:
            return Response(create_response(False, "Playlist is already private"), status=status.HTTP_400_BAD_REQUEST)
        if playlist.admin != request.user:
            return Response(create_response(False, "Only admins can make playlist private"), status=status.HTTP_403_FORBIDDEN)
        playlist.isGlobal = False
        playlist.save()
        return Response(create_response(True, "Playlist made private successfully", {
            "playlist_id": playlist.id,
            "isGlobal": playlist.isGlobal
        }), status=status.HTTP_200_OK)
    except Playlists.DoesNotExist:
        return Response(create_response(False, "playlist_id not found"), status=status.HTTP_404_NOT_FOUND)

@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def globalPlaylists(_):
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
def updateSongTitle(request):
    song_id = request.data.get("song_id")
    title = request.data.get("title")

    if not request.user.is_superuser:
            return Response(
                {"success": False, "message": "Only superusers are allowed"},
                status=status.HTTP_403_FORBIDDEN,
            )

    if not song_id or not title:
        return Response(create_response(False, "playlist_id, song_id and title are required"), status=status.HTTP_400_BAD_REQUEST)
        
    if not check_valid_youtubeId(song_id) :
        return Response(
            create_response(False, "Youtube video id is not valid"),
            status=status.HTTP_404_NOT_FOUND,
        )
    
    try:
        song = Songs.objects.get(id=song_id)
        song.title = title
        song.save()
        return Response(create_response(True, "Song title updated successfully"), status=status.HTTP_200_OK)
    except Songs.DoesNotExist:
        return Response(create_response(False, "song_id not found"), status=status.HTTP_404_NOT_FOUND)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def makeUserAdmin(request):
    if not request.user.is_superuser:
        return Response(create_response(False, "Only superusers can promote users"), status=status.HTTP_403_FORBIDDEN)

    user_id = request.data.get("user_id")
    try:
        user = User.objects.get(id=user_id)
        user.is_staff = True
        user.is_superuser = True
        user.save()
        return Response(create_response(True, f"User {user.username} is now an admin."), status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response(create_response(False, "User not found."), status=status.HTTP_404_NOT_FOUND)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def addPermanentSongFromSiteUrl(request):
    if not request.user.is_superuser:
        return Response(create_response(False, "Only superusers can add urls"), status=status.HTTP_403_FORBIDDEN)
    video_id = request.data.get("video_id")
    site_url = request.data.get("site_url")
    update = request.data.get("update")

    if not video_id or not site_url:
        return Response(create_response(False, "video_id & site_url are required"), status=status.HTTP_404_NOT_FOUND)
    
    if not is_valid_url(site_url):
        return Response(create_response(False, "site_url must be valid"), status=status.HTTP_404_NOT_FOUND)

    if not check_valid_youtubeId(video_id) :
        return Response(
            create_response(False, "Youtube video id is not valid"),
            status=status.HTTP_404_NOT_FOUND,
        )

    redis = get_redis_client()
    key = f"permenant_url:{video_id}"

    video_image_url = get_high_image_url(video_id)
    video_details= getVideoDetails(video_id)
    if video_details:  # Make sure it's not None
        song_title = (
            video_details
            .get("responseStatus", {})
            .get("message", {})
            .get("videoDetails", {})
            .get("title", "")
        )
    else:
        song_title = ""
        print("⚠️ getVideoDetails returned None")

    isAlready = redis.get(key)
    if isAlready and not update:
        return Response(create_response(False, f"Already present!!", {
            "query":"",
            "site_url":site_url,
            "song_url":isAlready,
            "song_title":song_title,
            "video_id":video_id,
            "image_url":video_image_url
        }), status=status.HTTP_208_ALREADY_REPORTED)
    song_url = fetch_320kbps(site_url)
    if not song_url:
        return Response(create_response(False, f"Could not fetch 320kbps song from site_url: {site_url}"), status=status.HTTP_404_NOT_FOUND)
    redis.set(key, song_url) 
    return Response(create_response(True, f"Ok", {
        "query":"",
        "site_url":site_url,
        "song_url":song_url,
        "song_title":song_title,
        "video_id":video_id,
        "image_url":video_image_url
    }), status=status.HTTP_200_OK)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def addPermanentSongFromSiteUrlWithQuery(request):
    if not request.user.is_superuser:
        return Response(create_response(False, "Only superusers can add urls"), status=status.HTTP_403_FORBIDDEN)
    
    query = request.data.get("query")
    site_url = request.data.get("site_url")
    update = request.data.get("update")

    if not query or not site_url:
        return Response(create_response(False, "query & site_url are required"), status=status.HTTP_404_NOT_FOUND)
    
    if not is_valid_url(site_url):
        return Response(create_response(False, "site_url must be valid"), status=status.HTTP_404_NOT_FOUND)

    try:
        song_search = youtubeSearch(query)
        song = song_search[0]
        song_title = song.get("title")
        video_id = song["id"]

        if not video_id:
            return Response(create_response(False, f"Could not fetch video_id from query: {query}"), status=status.HTTP_404_NOT_FOUND)

        video_image_url = get_high_image_url(video_id)
        redis = get_redis_client()
        key = f"permenant_url:{video_id}"
        isAlready = redis.get(key)
        if isAlready and not update:
            return Response(create_response(False, f"Already present!! try update to be true to update the link", {
                "query":query,
                "site_url":site_url,
                "song_url":isAlready,
                "song_title":song_title,
                "video_id":video_id,
                "image_url":video_image_url
            }), status=status.HTTP_208_ALREADY_REPORTED)
    except Exception as e:
        return Response(create_response(False, f"Could not fetch video_id from query: {query}"), status=status.HTTP_404_NOT_FOUND)
    try:
        song_url = fetch_320kbps(site_url)
        print("song url", song_url)
        if not song_url:
            return Response(create_response(False, f"Could not fetch 320kbps song from site_url: {site_url}"), status=status.HTTP_404_NOT_FOUND)

        if check_url_song_mismatch(song_title, song_url):
            return Response(create_response(False, f"Song info mismatch", {
                "query":query,
                "site_url":site_url,
                "song_url":isAlready,
                "song_title":song_title,
                "video_id":video_id,
                "image_url":video_image_url
            }), status=status.HTTP_404_NOT_FOUND)
            
        redis.set(key, song_url) 
        return Response(create_response(True, f"Ok", {
             "query":query,
            "site_url":site_url,
            "song_url":song_url,
            "song_title":song_title,
            "video_id":video_id,
            "image_url":video_image_url
        }), status=status.HTTP_200_OK)
    except Exception as e:
        return Response(create_response(False, f"Could not fetch 320kbps song from site_url: {site_url}"), status=status.HTTP_404_NOT_FOUND)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def addPermanentSongUrl(request):
    if not request.user.is_superuser:
        return Response(create_response(False, "Only superusers can add urls"), status=status.HTTP_403_FORBIDDEN)
    video_id = request.data.get("video_id")
    song_url = request.data.get("song_url")
    update = request.data.get("update")

    if not video_id or not song_url:
        return Response(create_response(False, "video_id & song_url are required"), status=status.HTTP_404_NOT_FOUND)
    
    if not is_valid_url(song_url):
        return Response(create_response(False, "song_url must be valid"), status=status.HTTP_404_NOT_FOUND)

    if not check_valid_youtubeId(video_id) :
        return Response(
            create_response(False, "Youtube video id is not valid"),
            status=status.HTTP_404_NOT_FOUND,
        )
    try:
        redis = get_redis_client()

        video_image_url = get_high_image_url(video_id)
        video_details= getVideoDetails(video_id)
        if video_details:  # Make sure it's not None
            song_title = (
                video_details
                .get("responseStatus", {})
                .get("message", {})
                .get("videoDetails", {})
                .get("title", "")
            )
        else:
            song_title = ""
            print("⚠️ getVideoDetails returned None")


        key = f"permenant_url:{video_id}"
        isAlready = redis.get(key)
        if isAlready and not update:
            return Response(create_response(False, f"Already present!!", {
                "query":"",
                "site_url":"",
                "song_url":isAlready,
                "song_title":song_title,
                "video_id":video_id,
                "image_url":video_image_url
            }), status=status.HTTP_208_ALREADY_REPORTED)

        redis.set(key, song_url) 
        return Response(create_response(True, f"Ok", {
            "query":"",
            "site_url":"",
            "song_url":song_url,
            "song_title":song_title,
            "video_id":video_id,
            "image_url":video_image_url
        }), status=status.HTTP_200_OK)
    except Exception as e:
        print("here is exception", e)
        return Response(create_response(False, f"Could not fetch video details"), status=status.HTTP_404_NOT_FOUND)

    


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def fetchVideoDetails(request):
    songId = request.GET.get("songId", "").replace(" ", "").strip('"')
    if not songId :
        return Response(
            create_response(False, "Query parameter 'songId' is required"),
            status=status.HTTP_404_NOT_FOUND,
        )
    if not check_valid_youtubeId(songId) :
        return Response(
            create_response(False, "Youtube video id is not valid"),
            status=status.HTTP_404_NOT_FOUND,
        )
    video_details = getVideoDetails(songId)
    
    if not video_details:
        return Response(
            create_response(False, "Could not fetch video details"),
            status=status.HTTP_404_NOT_FOUND,
        )
    return Response(create_response(True, video_details), status=status.HTTP_200_OK)

@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def checkIsAdmin(request):
    admin = {request.user.is_staff or request.user.is_superuser}
    if admin:
        return Response(create_response(True, "you are superuser"), status=status.HTTP_200_OK)
    return Response(create_response(False, "you are not superuser"), status=status.HTTP_200_OK)

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
        try:
            user = request.user
            if not pk:
                return Response(create_response(False, "Playlist ID is required in URL"), status=status.HTTP_400_BAD_REQUEST)

            playlist = Playlists.objects.get(pk=pk)

            if playlist.admin != user:
                return Response(create_response(False, "Only admin can delete playlist"), status=status.HTTP_403_FORBIDDEN)
            playlist.delete()
            return Response(create_response(True, f"{pk} deleted"), status=status.HTTP_200_OK)
        except Playlists.DoesNotExist:
            return Response(create_response(False, f"Playlist with ID {pk} does not exist"), status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(create_response(False, f"Error deleting playlist: {str(e)}"), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
