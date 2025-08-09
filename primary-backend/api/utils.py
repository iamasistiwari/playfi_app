from .types import YoutubeVideoType
from typing import List
from youtubesearchpython import VideosSearch
import yt_dlp
from urllib.parse import urlparse, parse_qs
import time
import re
from typing import Optional

def format_sentence(sentence: str) -> str:
    if not sentence:
        return ""

    # Check if the sentence contains Devanagari (Hindi) characters
    if re.search(r'[\u0900-\u097F]', sentence):
        return sentence  # Return as-is if it's in Hindi

    # Continue processing for non-Hindi (likely English) input
    sentence = re.sub(r'[^a-zA-Z0-9\s]', '', sentence)
    words = sentence.split()
    formatted_words = [word.capitalize() for word in words]
    return " ".join(formatted_words)

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
    videos_search = VideosSearch(query=query, limit=5, region="IND")
    results = videos_search.result()

    videos = results.get("result", [])
    # validated_videos = [YoutubeVideoType.model_validate(video) for video in videos]
    validated_videos = []
    for video in videos:
        try:
            validated = YoutubeVideoType.model_validate(video)
            validated_videos.append(validated.model_dump())  
        except Exception as e:
            continue
    return validated_videos

def getYoutubeMusicUrl(videoId: str, max_attempts: int = 4) -> Optional[str]:
    
    for attempt in range(1, max_attempts + 1):
        try:
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
            time.sleep(1)
    
    print(f"\n❌ ALL {max_attempts} ATTEMPTS FAILED for video ID: {videoId}")
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

