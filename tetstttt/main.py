#!/usr/bin/env python3
import yt_dlp
import json
import sys

def get_audio_url(youtube_url):
    """Extract direct audio URL from YouTube video (highest quality)"""
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'quiet': True,
        'no_warnings': True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Extract info without downloading
            info = ydl.extract_info(youtube_url, download=False)
            print("this is info",info)
            # Get the best audio-only formats
            formats = info.get('formats', [])
            audio_formats = [
                f for f in formats
                if f.get('vcodec') == 'none' and f.get('acodec') != 'none' and f.get('abr')
            ]
            
            if audio_formats:
                # Sort by abr (audio bitrate) descending
                # print("this is formats",audio_formats)
                best_audio = sorted(audio_formats, key=lambda x: x.get('abr', 0), reverse=True)[0]
                print("this is best audio",best_audio)
                return {
                    'url': best_audio['url'],
                    'title': info.get('title', 'Unknown'),
                    'duration': info.get('duration', 0),
                    'quality': best_audio.get('abr', 'Unknown'),
                    'format': best_audio.get('ext', 'Unknown')
                }
            else:
                return None
                
    except Exception as e:
        print(f"Error: {str(e)}")
        return None


def download_audio(youtube_url, output_path="./"):
    """Download audio file from YouTube video"""
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': f'{output_path}/%(title)s.%(ext)s',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([youtube_url])
            print("Download completed successfully!")
            return True
    except Exception as e:
        print(f"Download failed: {str(e)}")
        return False

def main():
    # Your YouTube video URL
    youtube_url = "https://www.youtube.com/watch?v=q3HE1dFiJBI"
    print("Extracting audio URL...")
    audio_info = get_audio_url(youtube_url)
    if audio_info:
        print("\n📺 Video Info:")
        print(f"Title: {audio_info['title']}")
        print(f"Duration: {audio_info['duration']} seconds")
        print(f"Quality: {audio_info['quality']} kbps")
        print(f"Format: {audio_info['format']}")
        print(f"\n🎵 Direct Audio URL:")
        print(audio_info['url'])
        
        # Save URL to file
        with open('audio_url.txt', 'w') as f:
            f.write(audio_info['url'])
        print("\n✅ Audio URL saved to 'audio_url.txt'")
        
        # Ask if user wants to download the file
        download_choice = input("\nDo you want to download the audio file? (y/n): ")
        if download_choice.lower() == 'y':
            download_audio(youtube_url)
            
    else:
        print("❌ Failed to extract audio URL")

if __name__ == "__main__":
    main()