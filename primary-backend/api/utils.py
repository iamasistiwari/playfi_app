from .types import YoutubeVideoType, ViewCount, Thumbnail, Channel, Accessibility
from typing import List
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

_redis_client = None

def get_redis_client():
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST"),
            port=os.getenv("REDIS_PORT"),
            db=1,
            password=os.getenv("REDIS_PASSWORD"),
            decode_responses=True
        )
    return _redis_client

ytmusic: Optional[YTMusic] = None

def fetch_320kbps(url: str) -> str:
    headers = {"User-Agent": "Mozilla/5.0"}
    res = requests.get(url, headers=headers)
    res.raise_for_status()

    soup = BeautifulSoup(res.text, "html.parser")

    # Look for anchor tags that mention "320 Kbps"
    link = None
    for a in soup.select("a[href]"):
        if "320" in a.text:
            link = a["href"]
            break

    return link

def is_valid_url(url: str) -> bool:
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except ValueError:
        return False

def getYTMusic() -> YTMusic:
    global ytmusic
    if ytmusic is None:
        ytmusic = YTMusic()
    return ytmusic

def format_sentence(sentence: str, channelName: str) -> str:
    removable_words = [
        "official", "audio", "lyrics", "music", "video", "clip", "latest", 
        "song", "songs", "punjabi", "hindi", "new", "full", "hd", "ft", "lyric", "lyrics"
    ]
    
    # Add channel name words
    if channelName:
        channel_words = [word.strip() for word in channelName.split() if word.strip()]
        removable_words.extend(channel_words)
    
    # Add common year patterns (optional)
    # removable_words.extend([str(year) for year in range(2020, 2025)])
    
    if not sentence:
        return ""
    
    # If the sentence contains Devanagari (Hindi) characters, return as-is
    if re.search(r'[\u0900-\u097F]', sentence):
        return sentence.strip()

    # Remove special characters except spaces and alphanumerics
    sentence = re.sub(r'[^a-zA-Z0-9\s]', '', sentence)

    # Split into words and filter
    words = sentence.split()
    removable_set = set(word.lower() for word in removable_words)
    filtered_words = [word for word in words if word.lower() not in removable_set]

    # Capitalize and join
    capitalized_words = [word.capitalize() for word in filtered_words]
    finalSentence = " ".join(capitalized_words)

    return finalSentence

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

def youtubeSearch(query: str) -> List[YoutubeVideoType]:
    results = getYTMusic().search(query, filter="songs")
    validated_videos: List[YoutubeVideoType] = []

    for video in results[:6]:  
        try:
            mapped_video = {
                "type": video.get("videoType", ""),
                "id": video.get("videoId", ""),
                "title": video.get("title", ""),
                "publishedTime": str(video.get("year") or ""),
                "duration": video.get("duration", ""),
                "viewCount": {"text": video.get("views", "0 views"), "short": None},
                "thumbnails": video.get("thumbnails", []),
                "richThumbnail": video["thumbnails"][-1] if video.get("thumbnails") else None,
                "channel": {
                    "name": video["artists"][0]["name"] if video.get("artists") else "",
                    "id": video["artists"][0]["id"] if video.get("artists") else "",
                    "thumbnails": [],
                    "link": ""
                },
                "accessibility": {
                    "title": video.get("title", ""),
                    "duration": video.get("duration", "")
                },
                "link": f"https://music.youtube.com/watch?v={video.get('videoId','')}"
            }

            validated = YoutubeVideoType.model_validate(mapped_video)
            validated_videos.append(validated.model_dump())  # now this works
        except Exception as e:
            continue

    return validated_videos

def getVideoDetails(video_id: str) -> List[YoutubeVideoType]:
    try:
        redis_client = get_redis_client()
        video_details = redis_client.get(f"video_details:{video_id}")
        if video_details:
            return json.loads(video_details)   
        results = getYTMusic().get_song(video_id)
        redis_client.set(f"video_details:{video_id}", json.dumps(results))
        return results
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