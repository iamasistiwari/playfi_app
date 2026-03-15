from .types import YoutubeVideoType, ViewCount, Thumbnail, Channel, Accessibility
from typing import Any, List
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
import threading

load_dotenv()

redis_client = None

def get_redis_client():
    global redis_client
    if redis_client is None:
        redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST"),
            port=os.getenv("REDIS_PORT"),
            db=int(os.getenv("REDIS_DB", 0)),
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
    title = title.split('(')[0]
    title = title.strip().title()
    return title


def getExpiryTimeout(music_url: str) -> int:
    try:
        parsed_url = urlparse(music_url)
        query_params = parse_qs(parsed_url.query)
        expire_timestamp = int(query_params.get("expire", [0])[0])
        current_timestamp = int(time.time())
        timeout = max(expire_timestamp - current_timestamp, 1)
        return timeout
    except Exception as e:
        print(f"Error extracting expiry: {e}")
        return 60 * 60 * 24

def getRelatedSong(video_id: str) -> List[YoutubeVideoType]:
    try:
        yt = getYTMusic()
        watch_playlist = yt.get_watch_playlist(videoId=video_id)

        browse_id = None
        if isinstance(watch_playlist, dict):
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
    updated_url = re.sub(pattern, replacement, url)
    return updated_url


def _precache_song_urls(song_ids: list):
    """Background thread: pre-cache audio URLs for a list of song IDs."""
    from .extraction import getYoutubeMusicUrl, getExpiryTimeout as extractionGetExpiry
    r = get_redis_client()
    for sid in song_ids[:3]:
        try:
            if r.get(f"permenant_url:{sid}") or r.get(f"song_url:{sid}"):
                continue
            url = getYoutubeMusicUrl(sid, max_rounds=2)
            if url:
                ttl = extractionGetExpiry(url)
                r.set(f"song_url:{sid}", url, ex=ttl)
        except Exception as e:
            print(f"Pre-cache error for {sid}: {e}")


def youtubeSearch(query: str) -> List[YoutubeVideoType]:
    results = getYTMusic().search(query, filter="songs")
    validated_videos: List[YoutubeVideoType] = []
    unique_videos = []

    for video in results[:6]:
        try:
            rich_thumbnail = video["thumbnails"][-1] if video.get("thumbnails") else None

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

    seen_ids: set[str] = set()
    for vid in validated_videos:
        if vid["id"] not in seen_ids:
            unique_videos.append(vid)
            seen_ids.add(vid["id"])

    # Background pre-cache top 3 results
    if seen_ids:
        t = threading.Thread(target=_precache_song_urls, args=(list(seen_ids),), daemon=True)
        t.start()

    return unique_videos

def getVideoDetails(video_id: str) -> dict:
    """Direct call to YTMusic API — no queue needed."""
    try:
        r = get_redis_client()
        key = f"video_details:{video_id}"
        cached = r.get(key)
        if cached:
            return json.loads(cached)

        results = getYTMusic().get_song(video_id)
        thumbnails = results.get("videoDetails", {}).get("thumbnail", {}).get("thumbnails", [])
        if thumbnails:
            r.set(key, json.dumps(results), ex=60 * 60 * 24)  # cache 24 hours
            return results
        return None
    except Exception as e:
        print(f"Error getting video details: {e}")
        return None

def get_high_image_url(video_id: str) -> str:
    r = get_redis_client()
    image_url = r.get(f"image:{video_id}")
    if image_url:
        return image_url
    try:
        video_details = getVideoDetails(video_id)
        thumbnails = video_details.get("videoDetails", {}).get("thumbnail", {}).get("thumbnails", [])
        if not thumbnails:
            return None
        image_url = max(thumbnails, key=lambda t: t.get("width", 0)).get("url")
        r.set(f"image:{video_id}", image_url)
        return image_url
    except:
        return None

def check_valid_youtubeId(videoId: str) -> bool:
    pattern = r'^[a-zA-Z0-9_-]{11}$'
    return bool(re.match(pattern, videoId))

def check_url_song_mismatch(title: str, song_url: str) -> bool:
    title = re.sub(r"\(feat.*?\)|\[feat.*?\]|\(from.*?\)", "", title, flags=re.IGNORECASE)
    title = re.sub(r"[\/|&]", " ", title)
    title = re.sub(r"[^a-zA-Z0-9\s]", " ", title)
    title = re.sub(r"\s+", " ", title).strip()
    title = title.lower()
    song_url = song_url.lower()
    words = title.split()
    matched = any(word for word in words if len(word) > 2 and word in song_url)
    return not matched
