from typing import List, Optional
from ytmusicapi import YTMusic
from urllib.parse import urlparse, parse_qs
import yt_dlp
import time
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

ytmusic: Optional[YTMusic] = None
def getYTMusic() -> YTMusic:
    global ytmusic
    if ytmusic is None:
        ytmusic = YTMusic()
    return ytmusic

def getVideoDetails(video_id: str) -> dict | None:
    try:
        results = getYTMusic().get_song(video_id)
        thumbnails = results.get("videoDetails", {}).get("thumbnail", {}).get("thumbnails", [])
        if thumbnails:
            return results
        return None
    except Exception as e:
        print(f"Error getting video details: {e}")
        return None

def get_high_image_url(video_id: dict) -> str:
    try:
        video_details = getVideoDetails(video_id)
        thumbnails = video_details.get("videoDetails", {}).get("thumbnail", {}).get("thumbnails", [])
        if not thumbnails:
            return None
        # Get the one with maximum width (safest approach)
        image_url = max(thumbnails, key=lambda t: t.get("width", 0)).get("url")
        return image_url
    except:
        return None


def getYoutubeMusicUrl(videoId: str, max_rounds: int = 4) -> Optional[str]:
    concurrent = 3

    for round_num in range(1, max_rounds + 1):
        if round_num == 3:
            try:
                print("📦 Attempting to upgrade yt-dlp...")
                subprocess.check_call([sys.executable, "-m", "pip", "install", "-U", "yt-dlp"])
                print("✅ yt-dlp upgraded successfully")
            except subprocess.CalledProcessError as e:
                print(f"⚠️ Failed to upgrade yt-dlp: {e}")

        with ThreadPoolExecutor(max_workers=concurrent) as executor:
            futures = [executor.submit(_extractAudioUrl, videoId) for _ in range(concurrent)]
            for future in as_completed(futures):
                try:
                    result = future.result()
                    if result:
                        # Cancel remaining futures
                        for f in futures:
                            f.cancel()
                        print(f"✅ Got audio URL on round {round_num}")
                        return result
                except Exception as e:
                    print(f"❌ Round {round_num} request failed: {str(e)}")

        print(f"❌ Round {round_num} - all {concurrent} requests failed")
        if round_num < max_rounds:
            time.sleep(round_num)

    print(f"\n❌ ALL {max_rounds} ROUNDS FAILED for video ID: {videoId}")
    return None

def _extractAudioUrl(videoId: str) -> Optional[str]:
    youtube_url = f"https://www.youtube.com/watch?v={videoId}"

    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'retries': 2,
        'socket_timeout': 30,
        'extractor_args': {'youtube': {'js_runtimes': ['nodejs']}},
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(youtube_url, download=False)

        if not info:
            return None

        formats = info.get('formats', [])
        if not formats:
            return None

        # Filter for audio-only formats
        audio_formats = [
            f for f in formats
            if f.get('url')
            and f.get('acodec', 'none') != 'none'
            and f.get('vcodec') == 'none'
        ]

        if not audio_formats:
            return None

        # Sort by audio quality (highest bitrate first)
        audio_formats.sort(key=lambda x: (x.get('abr', 0) or 0, x.get('asr', 0) or 0), reverse=True)

        url = audio_formats[0]['url']
        if url and len(url) > 50:
            return url
        return None

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