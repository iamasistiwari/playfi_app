
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

QUEUE_KEYS = ["song_tasks", "video_details"]  # List of Redis queues

def worker():
    print("Worker started... waiting for tasks.")
    while True:
        task = r.brpop(QUEUE_KEYS)
        
        if task:
            queue_name, video_id = task
            print(f"Received task from {queue_name}: {video_id}")

            if queue_name == "song_tasks":
                musicUrl = utils.getYoutubeMusicUrl(video_id)
                resp = requests.head(musicUrl, timeout=5)
        
                if musicUrl and resp.status_code == 200:
                    cache_key = f"song_url:{video_id}"
                    timeout = utils.getExpiryTimeout(musicUrl)
                    r.set(cache_key, musicUrl, ex=timeout)
                    print(f"Saved result for key {cache_key}")

                    # permenant_url = r.get(f"permenant_url:{video_id}")
                    # if not permenant_url:
                    #     print("Start Permanent fetching...")
                    #     threading.Thread(
                    #         target=UploadToImageKitAIO, 
                    #         args=(video_id, musicUrl), 
                    #         daemon=True
                    #     ).start()
                else:
                    print(f"Failed to get audio URL for {video_id}")

            if queue_name == "video_details":
                print(f"Processing video_details task for {video_id}")
                video_details = utils.getVideoDetails(video_id)
                if video_details:
                    r.set(f"video_details:{video_id}", json.dumps(video_details))
                    print(f"Saved result for key {video_id}")

if __name__ == "__main__":
    worker()
