from .types import YoutubeVideoType, ViewCount, Thumbnail, Channel, Accessibility
from typing import Any, List
# from youtubesearchpython import VideosSearch
from ytmusicapi import YTMusic
import yt_dlp
from urllib.parse import urlparse, parse_qs
import time
import re
from typing import List, Optional
import subprocess
import sys
import requests
from bs4 import BeautifulSoup
import redis
import os
from dotenv import load_dotenv
import json

load_dotenv()

redis_client = None

def get_redis_client():
    global redis_client
    if redis_client is None:
        redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST"),
            port=os.getenv("REDIS_PORT"),
            db=1,
            password=os.getenv("REDIS_PASSWORD"),
            decode_responses=True
        )
    return redis_client

def fetch_320kbps(url: str) -> str:
    headers = {"User-Agent": "Mozilla/5.0"}
    res = requests.get(url, headers=headers)
    res.raise_for_status()

    soup = BeautifulSoup(res.text, "html.parser")

    for a in soup.select("a[href]"):
        href = a["href"]
        full_text = a.get_text(strip=True).lower()

        # Must mention 320 and end with .mp3
        if (("320" in full_text or "/320/" in href) and href.endswith(".mp3")):
            return href

    return None

def is_valid_url(url: str) -> bool:
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except ValueError:
        return False

ytmusic: Optional[YTMusic] = None
def getYTMusic() -> YTMusic:
    global ytmusic
    if ytmusic is None:
        ytmusic = YTMusic()
    return ytmusic

def format_title(title: str) -> str:
    if not title:
        return ""
    # Remove everything from '(' onwards
    title = title.split('(')[0]
    
    # Strip whitespace and apply title case
    title = title.strip().title()
    
    return title


def getExpiryTimeout(music_url: str) -> int:
    try:
        parsed_url = urlparse(music_url)
        query_params = parse_qs(parsed_url.query)
        expire_timestamp = int(query_params.get("expire", [0])[0])

        # Current time in UTC
        current_timestamp = int(time.time())

        # Timeout in seconds (minimum of 1 second to avoid 0)
        timeout = max(expire_timestamp - current_timestamp, 1)
        return timeout
    except Exception as e:
        print(f"Error extracting expiry: {e}")
        return 60 * 60 * 24  # fallback: 24 hours

def getRelatedSong(video_id: str) -> List[YoutubeVideoType]:
    try:
        yt = getYTMusic()
        watch_playlist = yt.get_watch_playlist(videoId=video_id)

        # Attempt to find the browseId
        browse_id = None
        if isinstance(watch_playlist, dict):
            # Some versions: watch_playlist["related"] might directly be a string (browseId) or nested
            related = watch_playlist.get("related")
            if isinstance(related, dict):
                browse_id = related.get("browseId")
            elif isinstance(related, str):
                browse_id = related

        if not browse_id:
            raise RuntimeError("Could not find a valid browseId in watch_playlist: " + str(watch_playlist))

        related_results = yt.get_song_related(browse_id)
        contents = None 
        if isinstance(related_results, list):
            for item in related_results:
                if item.get("title") == "You might also like":
                    contents = item.get("contents", [])
                    break
        recomended_videos = []
        if contents:
            for item in contents[:5]:
                rich_thumbnail = item["thumbnails"][-1] if item.get("thumbnails") else {}
                # Update richThumbnail dimensions if it exists
                if rich_thumbnail and rich_thumbnail.get("url"):
                    rich_thumbnail = {
                        "url": update_image_dimensions(rich_thumbnail["url"], 400, 400),
                        "width": 400,
                        "height": 400
                    }
                video = {
                    "type": "music",
                    "id": item.get("videoId", ""),
                    "title": format_title(item.get("title", "")),
                    "publishedTime": str(item.get("year") or ""),
                    "duration": item.get("duration", ""),
                    "viewCount": {"text": item.get("views", "0 views"), "short": None},
                    "thumbnails": item.get("thumbnails", []),
                    "richThumbnail":rich_thumbnail,
                    "channel": {
                        "name": format_title(item["artists"][0]["name"] if item.get("artists") else ""),
                        "id": item["artists"][0]["id"] if item.get("artists") else "",
                        "thumbnails": [],
                        "link": ""
                    },
                    "accessibility": {
                        "title": item.get("title", ""),
                        "duration": item.get("duration", "")
                    },
                    "link": f"https://music.youtube.com/watch?v={item.get('videoId','')}"
                }
                recomended_videos.append(video)
        return recomended_videos

    except Exception as e:
        print(f"Error extracting related songs: {e}")
        return None
    

def update_image_dimensions(url: str, width: int, height: int) -> str:
    pattern = r'w\d+-h\d+'
    replacement = f'w{width}-h{height}'
    
    # Replace the pattern with new dimensions
    updated_url = re.sub(pattern, replacement, url)
    
    return updated_url


def youtubeSearch(query: str) -> List[YoutubeVideoType]:
    results = getYTMusic().search(query, filter="songs")
    validated_videos: List[YoutubeVideoType] = []
    unique_videos = []
    redis_client = get_redis_client()

    for video in results[:6]:  
        try:
            rich_thumbnail = video["thumbnails"][-1] if video.get("thumbnails") else None

            # Update richThumbnail dimensions if it exists
            if rich_thumbnail and isinstance(rich_thumbnail, dict) and rich_thumbnail.get("url"):
                rich_thumbnail = {
                    "url": update_image_dimensions(rich_thumbnail["url"], 400, 400),
                    "width": 400,
                    "height": 400
                }

            mapped_video = {
                "type": video.get("videoType", ""),
                "id": video.get("videoId", ""),
                "title": format_title(video.get("title", "")),
                "publishedTime": str(video.get("year", "")),
                "duration": video.get("duration", ""),
                "viewCount": {"text": video.get("views", "0 views"), "short": None},
                "thumbnails": video.get("thumbnails", []),
                "richThumbnail": rich_thumbnail,
                "channel": {
                    "name": format_title(video["artists"][0]["name"] if video.get("artists") else ""),
                    "id": video["artists"][0]["id"] if video.get("artists") else "",
                    "thumbnails": [],
                    "link": ""
                },
                "accessibility": {
                    "title": video.get("title", ""),
                    "duration": video.get("duration", "")
                },
                "link": f"https://music.youtube.com/watch?v={video.get('videoId', '')}"
            }

            validated = YoutubeVideoType.model_validate(mapped_video)
            validated_videos.append(validated.model_dump()) 

        except Exception as e:
            print(f"Error processing video: {e}")
            continue
    
    # Deduplicate by video ID
    seen_ids: set[str] = set()
    for vid in validated_videos:
        if vid["id"] not in seen_ids:
            unique_videos.append(vid)
            seen_ids.add(vid["id"])
    
    # Store video IDs in Redis (convert set to list for JSON serialization)
    try:
        redis_client.lpush("songs_queue", json.dumps(list(seen_ids)))
    except Exception as e:
        print(f"Redis error: {e}")
    
    return unique_videos

def getVideoDetails(video_id: str) -> dict:
    try:
        redis_client = get_redis_client()
        key = f"video_details:{video_id}"
        video_details = redis_client.get(key)
        if video_details:
            return json.loads(video_details) 
        # put into redis queue
        print("put into redis queue")
        redis_client.lpush("video_details", video_id)  
        time.sleep(2)
        c = 0
        while c < 5:
            video_details = redis_client.get(key)
            if video_details:
                return json.loads(video_details)  
            c += 1
            time.sleep(2)
        return None
    except Exception as e:
        print(f"Error getting video details: {e}")
        return None

def get_high_image_url(video_id: dict) -> str:
    # check for image cache
    redis_client = get_redis_client()
    image_url = redis_client.get(f"image:{video_id}")
    if image_url:
        return image_url
    try:
        video_details = getVideoDetails(video_id)
        thumbnails = video_details.get("videoDetails", {}).get("thumbnail", {}).get("thumbnails", [])
        if not thumbnails:
            return None
        # Get the one with maximum width (safest approach)
        image_url = max(thumbnails, key=lambda t: t.get("width", 0)).get("url")
        redis_client.set(f"image:{video_id}", image_url)
        return image_url
    except:
        return None
    
def getYoutubeMusicUrl(videoId: str, max_attempts: int = 10) -> Optional[str]:
    
    for attempt in range(1, max_attempts + 1):
        try:
            if(attempt == 5):
                try:
                    print("📦 Attempting to upgrade yt-dlp...")
                    subprocess.check_call([sys.executable, "-m", "pip", "install", "-U", "yt-dlp"])
                    print("✅ yt-dlp upgraded successfully")
                except subprocess.CalledProcessError as e:
                    print(f"⚠️ Failed to upgrade yt-dlp: {e}")
    
            result = _extractAudioUrl(videoId, attempt)
            if result:
                print(f"✅ SUCCESS on attempt {attempt}!")
                return result
            else:
                print(f"❌ ATTEMPT {attempt} failed - No audio URL found")
        except Exception as e:
            print(f"❌ ATTEMPT {attempt} failed with error: {str(e)}")
        
        # Wait before retrying (exponential backoff)
        if attempt < max_attempts:
            wait_time = min(attempt * 2, 30)  # Cap at 30 seconds
            print(f"⏳ Waiting {wait_time} seconds before retry...")
            time.sleep(wait_time)
    
    print(f"\n❌ ALL {max_attempts} ATTEMPTS FAILED for video ID: {videoId}")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-U", "yt-dlp"])
    return None

def _extractAudioUrl(videoId: str, attempt_num: int) -> Optional[str]:

    youtube_url = f"https://www.youtube.com/watch?v={videoId}"

    # Configure yt-dlp for AUDIO-ONLY extraction
    ydl_opts = {
        'format': 'bestaudio[vcodec=none]/bestaudio',  # Force audio-only, fallback to best audio
        'quiet': attempt_num > 1,  # Be quiet on retry attempts to reduce noise
        'no_warnings': attempt_num > 1,  # Hide warnings on retries
        'extract_flat': False,
        'verbose': False,
        # Add retry options for yt-dlp itself
        'retries': 2,
        'socket_timeout': 30,
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(youtube_url, download=False)
        
        if not info:
            print(f"[Attempt {attempt_num}] Error: Could not extract video info")
            return None

        
        # Get all available formats
        formats = info.get('formats', [])
        if not formats:
            print(f"[Attempt {attempt_num}] Error: No formats available")
            return None
        
        # Filter for AUDIO-ONLY formats only
        audio_formats = []
        
        for f in formats:
            # Only accept audio-only formats (no video stream)
            if (f.get('url') and 
                f.get('acodec', 'none') != 'none' and 
                f.get('vcodec') == 'none'):  # Strict audio-only requirement
                
                abr = f.get('abr', 0)  # Audio bitrate
                asr = f.get('asr', 0)  # Audio sample rate
                ext = f.get('ext', 'unknown')
                acodec = f.get('acodec', 'unknown')
                
                audio_formats.append({
                    'url': f['url'],
                    'abr': abr,
                    'asr': asr,
                    'ext': ext,
                    'acodec': acodec,
                    'format_id': f.get('format_id', ''),
                    'filesize': f.get('filesize', 0)
                })
        
        if not audio_formats:
            print(f"[Attempt {attempt_num}] Error: No audio-only formats found")
            return None
        
        # Sort by audio quality (highest bitrate and sample rate first)
        audio_formats.sort(key=lambda x: (
            x['abr'] or 0,       # Higher bitrate better
            x['asr'] or 0        # Higher sample rate better
        ), reverse=True)
        
        # Print available audio-only qualities (only on first attempt to avoid spam)
        # if attempt_num == 1:
        #     print(f"\nAvailable AUDIO-ONLY formats (total: {len(audio_formats)}):")
        #     for i, fmt in enumerate(audio_formats[:5]):  # Show top 5
        #         size_info = f", ~{fmt['filesize']//1024//1024}MB" if fmt['filesize'] else ""
        #         print(f"  {i+1}. {fmt['format_id']}: {fmt['acodec']} @ {fmt['abr']}kbps, "
        #               f"{fmt['asr']}Hz, {fmt['ext']} (Audio-only){size_info}")
        
        # Select the best quality format
        best_format = audio_formats[0]
        
        # print(f"[Attempt {attempt_num}] Selected: {best_format['acodec']} @ {best_format['abr']}kbps")
        
        # Validate the URL before returning
        url = best_format['url']
        if url and len(url) > 50:  # Basic URL validation
            return url
        else:
            print(f"[Attempt {attempt_num}] Error: Invalid URL received")
            return None

def check_valid_youtubeId(videoId: str) -> bool:
    pattern = r'^[a-zA-Z0-9_-]{11}$'
    return bool(re.match(pattern, videoId))

def check_url_song_mismatch(title: str, song_url: str) -> bool:
    """
    Returns True if mismatch, False if matched.
    Cleans title, extracts keywords, and checks if they exist in song_url.
    """
    # Remove (feat. ...) or [feat. ...] and (From "...")
    title = re.sub(r"\(feat.*?\)|\[feat.*?\]|\(from.*?\)", "", title, flags=re.IGNORECASE)
    
    # Replace separators like /, |, & with space
    title = re.sub(r"[\/|&]", " ", title)
    
    # Remove special characters except letters, numbers, spaces
    title = re.sub(r"[^a-zA-Z0-9\s]", " ", title)
    
    # Collapse multiple spaces
    title = re.sub(r"\s+", " ", title).strip()

    # Lowercase
    title = title.lower()
    song_url = song_url.lower()

    # Split title into parts (words/phrases)
    words = title.split()

    # Try to find at least one strong keyword (>=3 letters) in song_url
    matched = any(word for word in words if len(word) > 2 and word in song_url)

    return not matched