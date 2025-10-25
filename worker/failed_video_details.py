
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

QUEUE_KEYS = ["failed_video_details"]  # List of Redis queues

def worker():
    print("Worker started looking old video details.")
    while True:
        task = r.brpop(QUEUE_KEYS)
        
        if task:
            queue_name, video_id = task
            print(f"Received task from {queue_name}: {video_id}")

            if queue_name == "failed_video_details":
                print(f"Processing video_details task for {video_id}")
                video_details = utils.getVideoDetails(video_id)
                print(f"Fetched video details: {video_details}")
                if video_details:
                    r.set(f"video_details:{video_id}", json.dumps(video_details))
                    print(f"Saved result for key {video_id}")

if __name__ == "__main__":
    worker()
