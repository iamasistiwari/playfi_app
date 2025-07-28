from .types import YoutubeVideoType
from typing import List
from youtubesearchpython import VideosSearch
import yt_dlp
from urllib.parse import urlparse, parse_qs
import time

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


def youtubeSearch(query: str) -> List[dict]:
    videos_search = VideosSearch(query=query, limit=5, region="IND")
    results = videos_search.result()

    videos = results.get("result", [])
    validated_videos = [YoutubeVideoType.model_validate(video) for video in videos]
    return [video.model_dump() for video in validated_videos]

def getYoutubMusicUrl(videoId: str) -> str:
    print("SONG ID RECEIVED", videoId)
    youtube_url = f"https://www.youtube.com/watch?v={videoId}"
    print("song url", youtube_url)
    ydl_opts = {
        'format': 'bestaudio/best',
        'quiet': True,
        'no_warnings': True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Extract info without downloading
            info = ydl.extract_info(youtube_url, download=False)
            
            # Get the best audio-only formats
            formats = info.get('formats', [])
            audio_formats = [
                f for f in formats
                if f.get('vcodec') == 'none' and f.get('acodec') != 'none' and f.get('abr')
            ]
            
            if audio_formats:
                # Sort by abr (audio bitrate) descending
                best_audio = sorted(audio_formats, key=lambda x: x.get('abr', 0), reverse=True)[0]
                return best_audio['url']
            else:
                return None
                
    except Exception as e:
        print(f"Error: {str(e)}")
        return None
