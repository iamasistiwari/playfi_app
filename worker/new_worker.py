import yt_dlp
import os

def download_youtube_as_mp3(url: str, output_dir: str = "./downloads"):
    os.makedirs(output_dir, exist_ok=True)

    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": os.path.join(output_dir, "%(title)s.%(ext)s"),
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "192",
        }],
        "http_headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Accept-Language": "en-US,en;q=0.9",
        },
        "extractor_args": {"youtube": {"player_client": ["android", "web"]}},
        "quiet": False,
        "no_warnings": True,
    }

    try:
        print(f"🎵 Fetching info for: {url}")

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # ✅ Get best audio-only format
            best_audio = None
            for f in info.get("formats", []):
                if f.get("vcodec") == "none":  # audio-only
                    best_audio = f
                    break

            if best_audio:
                print("\n🎧 Audio Details:")
                print(f"• Bitrate: {best_audio.get('abr', 'unknown')} kbps")
                print(f"• Codec: {best_audio.get('acodec', 'unknown')}")
                print(f"• Extension: .{best_audio.get('ext', 'unknown')}")
                print(f"🔗 Direct Audio URL:\n{best_audio.get('url')}\n")
            else:
                print("❌ Could not find a valid audio stream URL.")
                return

            print("⬇️ Downloading and converting to MP3...")
            ydl.download([url])

        print("✅ Conversion complete! Check the downloads folder.")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    download_youtube_as_mp3("https://www.youtube.com/watch?v=c-FKlE3_kHo")
