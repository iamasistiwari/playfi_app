
import redis
import json
from dotenv import load_dotenv
import os
from upload import UploadToImageKitAIO
import threading
import utils
import requests

load_dotenv()

# Redis connection
r = redis.Redis(
    host=os.getenv("REDIS_HOST"),
    port=os.getenv("REDIS_PORT"),
    db=1,
    password=os.getenv("REDIS_PASSWORD"),
    decode_responses=True
)

QUEUE_KEYS = ["song_tasks", "video_details", "songs_queue"]  # List of Redis queues


def worker():
    print("Worker started... waiting for tasks.")
    while True:
        task = r.brpop(QUEUE_KEYS)
        
        if task:
            queue_name, video_id = task
            print(f"Received task from {queue_name}: {video_id}")

            if queue_name == "songs_queue":
                video_ids = json.loads(video_id)
                for video_id in video_ids:
                    # check already exits or not
                    if r.exists(f"permenant_url:{video_id}"):
                        print(f"permenant_url {video_id} already exists in cache")
                        continue
                    if r.exists(f"song_url:{video_id}"):
                        print(f"Song {video_id} already exists in cache")
                        continue
                    
                    handleSongLink(video_id)
            if queue_name == "song_tasks":
                handleSongLink(video_id)

            if queue_name == "video_details":
                print(f"Processing video_details task for {video_id}")
                video_details = utils.getVideoDetails(video_id)
                if video_details:
                    r.set(f"video_details:{video_id}", json.dumps(video_details))
                    print(f"Saved result for key {video_id}")
                else:
                    print(f"Failed to get video details for {video_id}")
                    r.lpush("failed_video_details", video_id)


def handleSongLink(video_id: str):
    musicUrl = utils.getYoutubeMusicUrl(video_id)
    if not musicUrl or not musicUrl.endswith("="):
        print(f"Failed to fetch music URL for {video_id}")
        r.lpush("failed_song_tasks", video_id)
        return

    if musicUrl.startswith("http") and len(musicUrl) > 10:
        try:
            # Send a lightweight HEAD request first
            resp = requests.head(musicUrl, timeout=5)
            print(f"HEAD request status code: {resp.status_code}")
            # Some servers don't support HEAD — fallback to GET
            if resp.status_code >= 400:
                print(f"⚠️ HEAD request failed ({resp.status_code}), trying GET...")
                resp = requests.get(musicUrl, stream=True, timeout=5)
            
            # Proceed only if response is OK (<400)
            if resp.status_code < 400:
                cache_key = f"song_url:{video_id}"
                timeout = utils.getExpiryTimeout(musicUrl)
                r.set(cache_key, musicUrl, ex=timeout)
                print(f"✅ Saved valid URL for key {cache_key}")

                permenant_url = r.get(f"permenant_url:{video_id}")
                if not permenant_url:
                    print("Start Permanent fetching...")
                    threading.Thread(
                        target=UploadToImageKitAIO, 
                        args=(video_id, musicUrl), 
                        daemon=True
                    ).start()
            else:
                print(f"❌ Skipping cache for {video_id}: status {resp.status_code}")
        
        except requests.RequestException as e:
            print(f"❌ Error checking URL for {video_id}: {e}")
    else:
        print(f"⚠️ Invalid or missing music URL for {video_id}")


if __name__ == "__main__":
    worker()
