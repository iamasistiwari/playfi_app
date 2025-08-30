import requests
from bs4 import BeautifulSoup
import re
import os
from dotenv import load_dotenv

load_dotenv()

MUSIC_BASE_URL = os.getenv("BASE_URL")

PLAYFI_AUTH_TOKEN = os.getenv("PLAYFI_AUTH_TOKEN")

PLAYFI_API_URL = os.getenv("PLAYFI_API_URL")

HEADERS = {
    "Content-Type": "application/json",
    "Authorization": PLAYFI_AUTH_TOKEN
}

def get_artist_songs(url: str) -> list[dict]:
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/139.0.0.0 Safari/537.36"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "html.parser")
        songs = []
        
        for p in soup.find_all("p"):
            a = p.find("a")
            if not a:
                continue
            
            name = a.get_text(strip=True).split("\n")[0]
            href = a.get("href")
            
            # Skip unwanted links
            unwanted = ["top songs", "home", "feedback", "feedback / suggestion / contact us"]
            if not href or name.lower() in unwanted:
                continue
            
            # Clean up name
            if "(as a artist" in name:
                name = name.split("(as a artist")[0].strip()
            
            # Make full URL
            if href.startswith("/"):
                href = MUSIC_BASE_URL + href
            
            songs.append({"name": name, "href": href})
        
        return songs
    
    except Exception as e:
        print("Error:", e)
        return []

def get_single_tracks(url: str) -> list[dict]:
    print("url is", url)
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/139.0.0.0 Safari/537.36"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "html.parser")
        tracks = []

        # Find all <p> containing <a href> which are likely tracks
        for p in soup.find_all("p"):
            a = p.find("a")
            if not a:
                continue
            
            href = a.get("href")
            #  Only keep URLs that start with / and end with .html
            if not href or not href.startswith("/") or not href.endswith(".html"):
                continue

            name = a.get_text(strip=True)
            # Remove [Artist] and [Duration] from name
            name = re.sub(r"\[.*?\]", "", name).strip()

            tracks.append({
                "name": name,
                "url": MUSIC_BASE_URL + href
            })

        return tracks
    
    except Exception as e:
        print("Error:", e)
        return []

def post_track(track, artist_name, success_file="added_tracks.txt"):
    payload = {
        "query": f"{track['name']} {artist_name}",
        "site_url": track["url"],
        "update": True
    }
    print("payload", payload)
    try:
        response = requests.post(PLAYFI_API_URL, headers=HEADERS, json=payload, timeout=10)
        resp_json = response.json()
        if response.status_code == 200:
            #  Ensure file exists and append track name
            os.makedirs(os.path.dirname(success_file), exist_ok=True) if os.path.dirname(success_file) else None
            video_id = resp_json["responseData"]["video_id"]

            # Write name:video_id if not already present
            line_to_write = f"{track['name']}:{video_id}\n"
            with open(success_file, "a+", encoding="utf-8") as f:
                f.seek(0)
                existing = f.read()
                if line_to_write.strip() not in existing:
                    f.write(line_to_write)

            return f"✅ Added: {track['name']} {response.text}"
        else:
            return f"⚠️ Failed ({response.status_code}) for {track['name']} → {response.text}"
    except requests.RequestException as e:
        return f"❌ Error while adding {track['name']}: {e}"
    
def fetch_artist_tracks(artist_url: str, artist_name: str, max_workers: int = 10):
    songs = get_artist_songs(artist_url)
    all_tracks = []
    
    for song in songs:
        tracks = get_single_tracks(song["href"])
        all_tracks.extend(tracks)
    print("Total tracks",len(all_tracks))
    for track in all_tracks:
        print("=================================================================================")
        print(f"trying!! {track['url']}")
        print(post_track(track, artist_name))
    

# songs = get_artist_songs("https://djpunjab.is/artist/apdhillon")
# for s in songs:
#     tracks = get_single_tracks(s["href"])
#     for t in tracks:
#         print(t)

# tracks = get_single_tracks("https://djpunjab.is/punjabi-music/sicario-shubh-album-56865.html")
# for t in tracks:
#     print(t)

fetch_artist_tracks("https://djpunjab.is/artist/guru-randhawa", "guru randhawa")


# karan aujla 
# shubh
# ap dilhon
# harrdy sandhu