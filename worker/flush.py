
import redis
import json
from dotenv import load_dotenv
import os
from upload import UploadToImageKitAIO
import threading
import utils

load_dotenv()

r = redis.Redis(
    host=os.getenv("REDIS_HOST"),
    port=os.getenv("REDIS_PORT"),
    db=1,
    password=os.getenv("REDIS_PASSWORD"),
    decode_responses=True
)

r.flushdb()
