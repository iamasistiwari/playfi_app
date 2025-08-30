from imagekitio import ImageKit
from imagekitio.models.UploadFileRequestOptions import UploadFileRequestOptions
import requests
import redis
from dotenv import load_dotenv
import os

load_dotenv()

imagekit = ImageKit(
    private_key=os.getenv("IMAGE_KIT_PRIVATE_KEY"),
    public_key=os.getenv("IMAGE_KIT_PUBLIC_KEY"),
    url_endpoint=os.getenv("IMAGE_KIT_URL_ENDPOINT")
)

r = redis.Redis(
    host=os.getenv("REDIS_HOST"),
    port=os.getenv("REDIS_PORT"),
    db=1,
    password=os.getenv("REDIS_PASSWORD"),
    decode_responses=True
)

def UploadToImageKitAIO(file_id: str, music_url: str):
    os.makedirs("music", exist_ok=True)  
    permenant_url = r.get(f"permenant_url:{file_id}")
    if permenant_url:
        print("song already uploaded")
        return
    downloaded_path = dowloadLocal(file_id, music_url)
    if not downloaded_path:
        print("song locally not downloaded can't upload")
        return
    try:
        with open(downloaded_path, "rb") as f:
            upload = imagekit.upload_file(
                file=f,  # file object
                file_name=f"{file_id}.mp3",  
                options=UploadFileRequestOptions(
                    folder="/mp3songs/",
                    response_fields=["is_private_file", "tags"],
                    tags=["music"]
                )
            )
        if upload.url:
            r.set(f"permenant_url:{file_id}", upload.url) 
            os.remove(downloaded_path)
            print(f"Uploaded to ImageKit: {upload.url}")
            print(f"Deleted local file: {downloaded_path}")
    except Exception as e:
        print(f"Error uploading to ImageKit: {e}")
        return

def dowloadLocal(file_id: str, music_url: str) -> str | None:
    output_file = f"music/{file_id}.mp3"
    response = requests.get(music_url, stream=True)

    if response.status_code == 200:
        downloaded_size = 0
        with open(output_file, "wb") as f:
            for chunk in response.iter_content(chunk_size=1024*1024):
                if chunk:
                    f.write(chunk)
                    downloaded_size += len(chunk)
        return output_file
    else:
        return None

