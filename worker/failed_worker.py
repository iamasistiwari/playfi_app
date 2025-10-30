
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

QUEUE_KEYS = ["image_url", "image_url_set"]  # List of Redis queues

def worker():
    print("Worker started looking old video details.")
    while True:
        task = r.brpop(QUEUE_KEYS)
        
        if task:
            queue_name, video_id = task
            print(f"Received task from {queue_name}: {video_id}")
            
            if queue_name == "image_url":
                image_url_key = f"image_url:{video_id}"
                print(f"Processing image_url task for {video_id}")
                # check if already exists or not
                cached_image = r.get(image_url_key)
                if(cached_image):
                    continue
                image_url = utils.get_high_image_url(video_id)
                if image_url:
                    r.set(image_url_key, image_url)
                    print(f"Saved result for key {image_url_key}")

            if queue_name == "image_url_set":
                print(f"Processing image_url_set task for {video_id}")
                # check if already exists or not
                video_ids = json.loads(video_id)
                for video_id in  video_ids:
                    image_url_key = f"image_url:{video_id}"
                    cached_image = r.get(image_url_key)
                    if(cached_image):
                        continue
                    image_url = utils.get_high_image_url(video_id)
                    if image_url:
                        r.set(image_url_key, image_url)
                        print(f"Saved result for key {image_url_key}")
                

if __name__ == "__main__":
    worker()
