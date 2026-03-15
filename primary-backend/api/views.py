import json
import uuid
import re
import threading
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q, Count, Sum
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.views import APIView
from django.core.cache import cache

from core.utils import create_response
from .models import Playlists, Songs, User, PlayHistory, PlaylistMembership
from .serializers import (
    PlaylistSerializer,
    PlaylistDetailSerializer,
    PlaylistMiniDetailsSerializer,
    UserProfileSerializer,
    UserSearchSerializer,
    PlayHistorySerializer,
    RecordPlaySerializer,
    PlaylistMemberSerializer,
)
from .utils import (
    youtubeSearch, is_valid_url, fetch_320kbps, getVideoDetails,
    get_high_image_url, check_valid_youtubeId, get_redis_client,
    check_url_song_mismatch, getRelatedSong, _precache_song_urls,
)
from .extraction import (
    getYoutubeMusicUrl,
    getExpiryTimeout,
)


# ---------------------------------------------------------------------------
# Song endpoints
# ---------------------------------------------------------------------------

@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def playSong(request):
    try:
        songId = request.GET.get("songId", "").replace(" ", "").strip('"')

        if not songId or not check_valid_youtubeId(songId):
            return Response(
                create_response(False, "Query parameter 'songId' is required and Youtube video id must be valid"),
                status=status.HTTP_404_NOT_FOUND,
            )

        redis_client = get_redis_client()

        # Check for related songs
        isGetRelatedSongs = str(request.GET.get("isGetRelatedSongs", "")).strip().strip('"')
        related_songs = None
        if isGetRelatedSongs in ["1", "true", "True"]:
            related_songs_key = f"related_songs:{songId}"
            cached_related_songs = redis_client.get(related_songs_key)
            if cached_related_songs:
                related_songs = json.loads(cached_related_songs)
            else:
                related_songs = getRelatedSong(songId)
                if related_songs:
                    redis_client.set(related_songs_key, json.dumps(related_songs), ex=60 * 60)
                    # Pre-cache related song URLs in background
                    song_ids = [s["id"] for s in related_songs]
                    t = threading.Thread(target=_precache_song_urls, args=(song_ids,), daemon=True)
                    t.start()

        # Check permanent cache
        permenant_cache_key = f"permenant_url:{songId}"
        permenant_cached_data = redis_client.get(permenant_cache_key)
        if permenant_cached_data:
            return Response(
                create_response(True, "Fetched from permanent cached data", {"url": permenant_cached_data, "related_songs": related_songs}),
                status=status.HTTP_200_OK,
            )

        # Check temp cache
        temp_cache_key = f"song_url:{songId}"
        temp_cached_data = redis_client.get(temp_cache_key)
        if temp_cached_data:
            return Response(
                create_response(True, "Fetched from temp cached data", {"url": temp_cached_data, "related_songs": related_songs}),
                status=status.HTTP_200_OK,
            )

        # Extract directly — no worker needed
        music_url = getYoutubeMusicUrl(songId)
        if music_url:
            ttl = getExpiryTimeout(music_url)
            redis_client.set(temp_cache_key, music_url, ex=ttl)
            return Response(
                create_response(True, "Fetched realtime", {"url": music_url, "related_songs": related_songs}),
                status=status.HTTP_200_OK,
            )

        return Response(
            create_response(False, "Could not extract audio URL"),
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        print(f"Error in playSong: {e}")
        return Response(
            create_response(False, "An error occurred while fetching song"),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def searchSongs(request):
    q = request.GET.get("q", "")
    q = re.sub(r"[^a-zA-Z0-9\s]", "", q)
    q = q.strip('"')

    if not q or len(q.strip()) <= 2:
        return Response(
            create_response(False, "Query parameter 'q' is required or Query at least 3 characters"),
            status=status.HTTP_404_NOT_FOUND,
        )

    cache_key = f"song_search:{q.lower().replace(' ', '_')}"
    cached_data = cache.get(cache_key)
    if cached_data:
        return Response(
            create_response(True, "Fetched from cache", cached_data), status=status.HTTP_200_OK
        )
    try:
        results = youtubeSearch(q)
        cache.set(cache_key, results, timeout=60 * 60 * 12)  # 12 hours
        return Response(
            create_response(True, "Fetched", results), status=status.HTTP_200_OK
        )
    except Exception as e:
        print("Error fetching songs:", e)
        return Response(
            create_response(False, "An error occurred while fetching data"),
            status=status.HTTP_404_NOT_FOUND,
        )


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def fetchVideoDetails(request):
    songId = request.GET.get("songId", "").replace(" ", "").strip('"')
    if not songId:
        return Response(
            create_response(False, "Query parameter 'songId' is required"),
            status=status.HTTP_404_NOT_FOUND,
        )
    if not check_valid_youtubeId(songId):
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


# ---------------------------------------------------------------------------
# Play tracking endpoints
# ---------------------------------------------------------------------------

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def recordPlay(request):
    serializer = RecordPlaySerializer(data=request.data)
    if not serializer.is_valid():
        return Response(create_response(False, "Invalid data", serializer.errors), status=status.HTTP_400_BAD_REQUEST)

    song_id = serializer.validated_data["song_id"]
    duration_listened = serializer.validated_data.get("duration_listened", 0)
    completed = serializer.validated_data.get("completed", False)
    song_data = serializer.validated_data.get("song_data")

    if song_data:
        song, _ = Songs.objects.get_or_create(
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
    else:
        try:
            song = Songs.objects.get(id=song_id)
        except Songs.DoesNotExist:
            return Response(create_response(False, "Song not found"), status=status.HTTP_404_NOT_FOUND)

    PlayHistory.objects.create(
        user=request.user,
        song=song,
        duration_listened=duration_listened,
        completed=completed,
    )
    return Response(create_response(True, "Play recorded"), status=status.HTTP_201_CREATED)


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def playHistory(request):
    page = int(request.GET.get("page", 1))
    page_size = int(request.GET.get("page_size", 20))
    offset = (page - 1) * page_size

    history = PlayHistory.objects.filter(user=request.user).select_related("song")[offset:offset + page_size]
    serializer = PlayHistorySerializer(history, many=True)
    return Response(create_response(True, "Fetched", serializer.data), status=status.HTTP_200_OK)


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def recentlyPlayed(request):
    limit = int(request.GET.get("limit", 20))
    # Distinct recently played songs
    history = (
        PlayHistory.objects.filter(user=request.user)
        .select_related("song")
        .order_by("-played_at")
    )
    seen = set()
    songs = []
    for h in history:
        if h.song.id not in seen:
            seen.add(h.song.id)
            from .serializers import SongSerializer
            songs.append(SongSerializer(h.song).data)
            if len(songs) >= limit:
                break
    return Response(create_response(True, "Fetched", songs), status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# User profile & stats
# ---------------------------------------------------------------------------

@api_view(["GET", "PUT"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def userProfile(request):
    if request.method == "GET":
        serializer = UserProfileSerializer(request.user)
        return Response(create_response(True, "Fetched", serializer.data), status=status.HTTP_200_OK)

    # PUT
    serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(create_response(True, "Updated", serializer.data), status=status.HTTP_200_OK)
    return Response(create_response(False, "Invalid data", serializer.errors), status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def userStats(request):
    user = request.user
    total_plays = PlayHistory.objects.filter(user=user).count()
    total_minutes = (PlayHistory.objects.filter(user=user).aggregate(total=Sum("duration_listened"))["total"] or 0) // 60
    playlists_count = Playlists.objects.filter(Q(admin=user) | Q(joined_users=user)).distinct().count()

    # Top 5 songs
    from django.db.models import Count as DjCount
    top_songs_qs = (
        PlayHistory.objects.filter(user=user)
        .values("song__id")
        .annotate(play_count=DjCount("id"))
        .order_by("-play_count")[:5]
    )
    top_song_ids = [s["song__id"] for s in top_songs_qs]
    top_songs = Songs.objects.filter(id__in=top_song_ids)
    from .serializers import SongSerializer
    top_songs_data = SongSerializer(top_songs, many=True).data

    return Response(create_response(True, "Fetched", {
        "total_plays": total_plays,
        "total_minutes": total_minutes,
        "playlists_count": playlists_count,
        "top_songs": top_songs_data,
    }), status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Trending & recommendations
# ---------------------------------------------------------------------------

@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def trending(request):
    days = int(request.GET.get("days", 7))
    limit = int(request.GET.get("limit", 20))
    since = timezone.now() - timedelta(days=days)

    trending_qs = (
        PlayHistory.objects.filter(played_at__gte=since)
        .values("song__id")
        .annotate(play_count=Count("id"))
        .order_by("-play_count")[:limit]
    )
    song_ids = [s["song__id"] for s in trending_qs]
    songs = Songs.objects.filter(id__in=song_ids)
    from .serializers import SongSerializer
    songs_data = SongSerializer(songs, many=True).data
    # Preserve trending order from aggregation
    id_order = {sid: i for i, sid in enumerate(song_ids)}
    songs_data.sort(key=lambda s: id_order.get(s["id"], 999))
    return Response(create_response(True, "Fetched", songs_data), status=status.HTTP_200_OK)


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def searchSuggestions(request):
    """Return top 5 song titles matching a prefix, ordered by play count."""
    q = request.GET.get("q", "").strip()
    if len(q) < 2:
        return Response(create_response(True, "Fetched", []), status=status.HTTP_200_OK)

    cache_key = f"search_suggestions:{q.lower()}"
    cached = cache.get(cache_key)
    if cached is not None:
        return Response(create_response(True, "Fetched", cached), status=status.HTTP_200_OK)

    from .models import Songs
    suggestions = (
        Songs.objects.filter(title__icontains=q)
        .annotate(play_count=Count("playhistory"))
        .order_by("-play_count")
        .values_list("title", flat=True)[:5]
    )
    result = list(suggestions)
    cache.set(cache_key, result, timeout=60 * 60)  # 1 hour
    return Response(create_response(True, "Fetched", result), status=status.HTTP_200_OK)


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def recommendations(request):
    """Based on last played song's related songs."""
    last_play = PlayHistory.objects.filter(user=request.user).select_related("song").first()
    if not last_play:
        return Response(create_response(True, "No history", []), status=status.HTTP_200_OK)

    redis_client = get_redis_client()
    related_key = f"related_songs:{last_play.song.id}"
    cached = redis_client.get(related_key)
    if cached:
        return Response(create_response(True, "Fetched", json.loads(cached)), status=status.HTTP_200_OK)

    related = getRelatedSong(last_play.song.id)
    if related:
        redis_client.set(related_key, json.dumps(related), ex=60 * 60)
    return Response(create_response(True, "Fetched", related or []), status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Playlist endpoints
# ---------------------------------------------------------------------------

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def makePlaylistGlobal(request):
    playlist_id = request.data.get("playlist_id")
    if not playlist_id:
        return Response(create_response(False, "playlist_id is required"), status=status.HTTP_400_BAD_REQUEST)
    try:
        _ = uuid.UUID(str(playlist_id))
    except (ValueError, TypeError):
        return Response(create_response(False, "Invalid playlist_id format"), status=status.HTTP_400_BAD_REQUEST)
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
    try:
        _ = uuid.UUID(str(playlist_id))
    except (ValueError, TypeError):
        return Response(create_response(False, "Invalid playlist_id format"), status=status.HTTP_400_BAD_REQUEST)
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
    return Response(create_response(True, "Fetched", serializer.data))


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
        _ = uuid.UUID(str(playlist_id))
    except (ValueError, TypeError):
        return Response(create_response(False, "Invalid playlist_id format"), status=status.HTTP_400_BAD_REQUEST)

    try:
        playlist = Playlists.objects.get(id=playlist_id)
    except Playlists.DoesNotExist:
        return Response(create_response(False, "playlist_id not found"), status=status.HTTP_404_NOT_FOUND)

    if playlist.admin != user:
        return Response(create_response(False, "Only admins can add user to playlist"), status=status.HTTP_403_FORBIDDEN)
    if user.email == user_email:
        return Response(create_response(False, "Admins cannot add himself"), status=status.HTTP_403_FORBIDDEN)

    try:
        user_to_add = User.objects.get(email=user_email)
    except User.DoesNotExist:
        return Response(create_response(False, "User with provided email does not exist"), status=status.HTTP_404_NOT_FOUND)

    if user_to_add in playlist.joined_users.all():
        return Response(create_response(True, "User already in playlist"), status=status.HTTP_200_OK)

    playlist.joined_users.add(user_to_add)
    playlist.save()

    # Create membership record
    PlaylistMembership.objects.get_or_create(
        user=user_to_add,
        playlist=playlist,
        defaults={"role": "editor", "invited_by": user},
    )

    return Response(create_response(True, f"{user_email} added to playlist successfully"), status=status.HTTP_200_OK)


@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def inviteToPlaylist(request):
    playlist_id = request.data.get("playlist_id")
    user_email = request.data.get("user_email")
    role = request.data.get("role", "editor")

    if not playlist_id or not user_email:
        return Response(create_response(False, "playlist_id and user_email are required"), status=status.HTTP_400_BAD_REQUEST)

    try:
        playlist = Playlists.objects.get(id=playlist_id)
    except Playlists.DoesNotExist:
        return Response(create_response(False, "Playlist not found"), status=status.HTTP_404_NOT_FOUND)

    if playlist.admin != request.user:
        return Response(create_response(False, "Only admin can invite users"), status=status.HTTP_403_FORBIDDEN)

    try:
        invitee = User.objects.get(email=user_email)
    except User.DoesNotExist:
        return Response(create_response(False, "User not found"), status=status.HTTP_404_NOT_FOUND)

    if invitee == request.user:
        return Response(create_response(False, "Cannot invite yourself"), status=status.HTTP_400_BAD_REQUEST)

    membership, created = PlaylistMembership.objects.get_or_create(
        user=invitee,
        playlist=playlist,
        defaults={"role": role, "invited_by": request.user},
    )
    if not created:
        return Response(create_response(False, "User already a member"), status=status.HTTP_400_BAD_REQUEST)

    playlist.joined_users.add(invitee)
    return Response(create_response(True, f"{user_email} invited successfully"), status=status.HTTP_200_OK)


@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def leavePlaylist(request):
    playlist_id = request.data.get("playlist_id")
    if not playlist_id:
        return Response(create_response(False, "playlist_id is required"), status=status.HTTP_400_BAD_REQUEST)

    try:
        playlist = Playlists.objects.get(id=playlist_id)
    except Playlists.DoesNotExist:
        return Response(create_response(False, "Playlist not found"), status=status.HTTP_404_NOT_FOUND)

    if playlist.admin == request.user:
        return Response(create_response(False, "Admin cannot leave their own playlist"), status=status.HTTP_400_BAD_REQUEST)

    playlist.joined_users.remove(request.user)
    PlaylistMembership.objects.filter(user=request.user, playlist=playlist).delete()
    return Response(create_response(True, "Left playlist successfully"), status=status.HTTP_200_OK)


@api_view(["POST", "DELETE"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def removeUserFromPlaylist(request):
    playlist_id = request.data.get("playlist_id")
    user_email = request.data.get("user_email")

    if not playlist_id or not user_email:
        return Response(create_response(False, "playlist_id and user_email are required"), status=status.HTTP_400_BAD_REQUEST)

    try:
        playlist = Playlists.objects.get(id=playlist_id)
    except Playlists.DoesNotExist:
        return Response(create_response(False, "Playlist not found"), status=status.HTTP_404_NOT_FOUND)

    if playlist.admin != request.user:
        return Response(create_response(False, "Only admin can remove users"), status=status.HTTP_403_FORBIDDEN)

    try:
        user_to_remove = User.objects.get(email=user_email)
    except User.DoesNotExist:
        return Response(create_response(False, "User not found"), status=status.HTTP_404_NOT_FOUND)

    playlist.joined_users.remove(user_to_remove)
    PlaylistMembership.objects.filter(user=user_to_remove, playlist=playlist).delete()
    return Response(create_response(True, f"{user_email} removed from playlist"), status=status.HTTP_200_OK)


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
        return Response(create_response(False, "song_id and title are required"), status=status.HTTP_400_BAD_REQUEST)

    if not check_valid_youtubeId(song_id):
        return Response(create_response(False, "Youtube video id is not valid"), status=status.HTTP_404_NOT_FOUND)

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
        user = User.objects.get(email=user_id)
        user.is_staff = True
        user.is_superuser = True
        user.save()
        return Response(create_response(True, f"User {user.email} is now an admin."), status=status.HTTP_200_OK)
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
    if not check_valid_youtubeId(video_id):
        return Response(create_response(False, "Youtube video id is not valid"), status=status.HTTP_404_NOT_FOUND)

    r = get_redis_client()
    key = f"permenant_url:{video_id}"

    video_image_url = get_high_image_url(video_id)
    video_details = getVideoDetails(video_id)
    song_title = ""
    if video_details:
        song_title = (
            video_details
            .get("videoDetails", {})
            .get("title", "")
        )

    isAlready = r.get(key)
    if isAlready and not update:
        return Response(create_response(False, "Already present!!", {
            "query": "", "site_url": site_url, "song_url": isAlready,
            "song_title": song_title, "video_id": video_id, "image_url": video_image_url
        }), status=status.HTTP_208_ALREADY_REPORTED)

    song_url = fetch_320kbps(site_url)
    if not song_url:
        return Response(create_response(False, f"Could not fetch 320kbps song from site_url: {site_url}"), status=status.HTTP_404_NOT_FOUND)
    r.set(key, song_url)
    return Response(create_response(True, "Ok", {
        "query": "", "site_url": site_url, "song_url": song_url,
        "song_title": song_title, "video_id": video_id, "image_url": video_image_url
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
        r = get_redis_client()
        key = f"permenant_url:{video_id}"
        isAlready = r.get(key)
        if isAlready and not update:
            return Response(create_response(False, "Already present!! try update to be true to update the link", {
                "query": query, "site_url": site_url, "song_url": isAlready,
                "song_title": song_title, "video_id": video_id, "image_url": video_image_url
            }), status=status.HTTP_208_ALREADY_REPORTED)
    except Exception:
        return Response(create_response(False, f"Could not fetch video_id from query: {query}"), status=status.HTTP_404_NOT_FOUND)

    try:
        song_url = fetch_320kbps(site_url)
        if not song_url:
            return Response(create_response(False, f"Could not fetch 320kbps song from site_url: {site_url}"), status=status.HTTP_404_NOT_FOUND)
        if check_url_song_mismatch(song_title, song_url):
            return Response(create_response(False, "Song info mismatch", {
                "query": query, "site_url": site_url, "song_url": isAlready,
                "song_title": song_title, "video_id": video_id, "image_url": video_image_url
            }), status=status.HTTP_404_NOT_FOUND)

        r.set(key, song_url)
        return Response(create_response(True, "Ok", {
            "query": query, "site_url": site_url, "song_url": song_url,
            "song_title": song_title, "video_id": video_id, "image_url": video_image_url
        }), status=status.HTTP_200_OK)
    except Exception:
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
    if not check_valid_youtubeId(video_id):
        return Response(create_response(False, "Youtube video id is not valid"), status=status.HTTP_404_NOT_FOUND)

    try:
        r = get_redis_client()
        video_image_url = get_high_image_url(video_id)
        video_details = getVideoDetails(video_id)
        song_title = ""
        if video_details:
            song_title = video_details.get("videoDetails", {}).get("title", "")

        key = f"permenant_url:{video_id}"
        isAlready = r.get(key)
        if isAlready and not update:
            return Response(create_response(False, "Already present!!", {
                "query": "", "site_url": "", "song_url": isAlready,
                "song_title": song_title, "video_id": video_id, "image_url": video_image_url
            }), status=status.HTTP_208_ALREADY_REPORTED)

        r.set(key, song_url)
        return Response(create_response(True, "Ok", {
            "query": "", "site_url": "", "song_url": song_url,
            "song_title": song_title, "video_id": video_id, "image_url": video_image_url
        }), status=status.HTTP_200_OK)
    except Exception as e:
        print("here is exception", e)
        return Response(create_response(False, "Could not fetch video details"), status=status.HTTP_404_NOT_FOUND)


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def checkIsAdmin(request):
    admin = request.user.is_staff or request.user.is_superuser
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
    try:
        _ = uuid.UUID(str(playlist_id))
    except (ValueError, TypeError):
        return Response(create_response(False, "Invalid playlist_id format"), status=status.HTTP_400_BAD_REQUEST)
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
    try:
        _ = uuid.UUID(str(playlist_id))
    except (ValueError, TypeError):
        return Response(create_response(False, "Invalid playlist_id format"), status=status.HTTP_400_BAD_REQUEST)

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


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def searchUsers(request):
    q = request.GET.get("q", "").strip()
    if len(q) < 2:
        return Response(create_response(True, "Fetched", []), status=status.HTTP_200_OK)

    users = User.objects.filter(
        Q(name__icontains=q) | Q(email__icontains=q)
    ).exclude(email=request.user.email)[:10]
    serializer = UserSearchSerializer(users, many=True)
    return Response(create_response(True, "Fetched", serializer.data), status=status.HTTP_200_OK)


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def searchGlobalPlaylists(request):
    q = request.GET.get("q", "").strip()
    if len(q) < 2:
        return Response(create_response(True, "Fetched", []), status=status.HTTP_200_OK)

    playlists = Playlists.objects.filter(isGlobal=True, playlistName__icontains=q)[:20]
    serializer = PlaylistMiniDetailsSerializer(playlists, many=True)
    return Response(create_response(True, "Fetched", serializer.data), status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Class-based views
# ---------------------------------------------------------------------------

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
            return Response(create_response(True, f"{playlist.playlistName} updated", serializer.data), status=status.HTTP_200_OK)

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
        return Response(create_response(True, "Fetched", serializer.data), status=status.HTTP_200_OK)

    def post(self, request):
        serializer = PlaylistSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(create_response(True, "created", serializer.data), status=status.HTTP_201_CREATED)

        return Response(create_response(False, "Failed to create playlist", serializer.errors), status=status.HTTP_400_BAD_REQUEST)
