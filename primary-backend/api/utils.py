from .types import YoutubeVideoType
from typing import List
from youtubesearchpython import VideosSearch


def youtubeSearch(query: str) -> List[dict]:
    videos_search = VideosSearch(query=query, limit=5, region="IND")
    results = videos_search.result()

    videos = results.get("result", [])
    validated_videos = [YoutubeVideoType.model_validate(video) for video in videos]
    return [video.model_dump() for video in validated_videos]
