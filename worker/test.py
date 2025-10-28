from ytmusicapi import YTMusic
from typing import Optional

ytmusic: Optional[YTMusic] = None

def getYTMusic() -> YTMusic:
    global ytmusic
    if ytmusic is None:
        ytmusic = YTMusic()
    return ytmusic

def getRelatedSong(video_id: str):
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
            for item in contents:
                video = {
                    "type": "music",
                    "id": item.get("itemId", ""),
                    "title": item.get("title", ""),
                    "publishedTime": str(item.get("year") or ""),
                    "duration": item.get("duration", ""),
                    "viewCount": {"text": item.get("views", "0 views"), "short": None},
                    "thumbnails": item.get("thumbnails", []),
                    "richThumbnail": item["thumbnails"][-1] if item.get("thumbnails") else None,
                    "channel": {
                        "name": item["artists"][0]["name"] if item.get("artists") else "",
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

if __name__ == "__main__":
    print(getRelatedSong("jOF8gqpoPgs"))
