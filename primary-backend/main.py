import requests

INV_INSTANCES = [
    "https://yewtu.be",
    "https://vid.puffyan.us",
    "https://inv.nadeko.net",
    "https://invidious.flokinet.to",
    "https://inv.tux.pizza",
    "https://inv.zzls.xyz",
    "https://inv.citizen4.eu"
]

def get_audio_urls(video_id: str):
    for base in INV_INSTANCES:
        api_url = f"{base}/api/v1/videos/{video_id}"
        print(f"Trying {api_url}")

        try:
            response = requests.get(api_url, timeout=5)
            if response.status_code == 200:
                try:
                    data = response.json()
                except Exception:
                    print(f"⚠️ {base} returned non-JSON (probably HTML error)")
                    continue

                audio_formats = [
                    fmt for fmt in data.get("adaptiveFormats", [])
                    if "audio" in fmt.get("type", "")
                ]
                if audio_formats:
                    return audio_formats
        except Exception as e:
            print(f"❌ {base} failed: {e}")
            continue

    raise Exception("No working Invidious instances found")

# Example usage
video_id = "cWMxCE2HTag"
streams = get_audio_urls(video_id)
for s in streams:
    print(f"{s.get('bitrate')} -> {s.get('url')}")
