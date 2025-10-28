from ytmusicapi import YTMusic

def get_ytmusic():
    return YTMusic()  # optionally with auth headers/cookies if needed

def test_get_song_related(video_id: str):
    yt = get_ytmusic()

    # Step 1: get the watch playlist for the video
    watch_playlist = yt.get_watch_playlist(videoId=video_id)
    # E.g., returns something like { "tracks": [...], "videoId": "...", ... } :contentReference[oaicite:3]{index=3}

    # Step 2: extract the browseId for related songs
    # According to docs, you should look for a “related” key and inside it a “browseId”
    # But because API formats can change, inspect what you actually received
    print("watch_playlist:", watch_playlist)  # debug line

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

    # Step 3: use the browseId to get related songs
    related_results = yt.get_song_related(browse_id)
    print("Related results:", related_results)

if __name__ == "__main__":
    # Replace this with a real videoID of a song from YouTube Music
    test_get_song_related("jOF8gqpoPgs")
