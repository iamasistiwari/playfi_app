import yt_dlp
import os

def get_best_audio_url(video_url, download=False, output_path='downloads'):
    """
    Extract the best audio URL from a YouTube video.
    If download=True, downloads the audio file directly.
    
    Args:
        video_url (str): YouTube video URL
        download (bool): Whether to download the audio file
        output_path (str): Directory to save downloaded audio
        
    Returns:
        dict: Dictionary containing audio info and download status
    """
    
    if download:
        # Create output directory if it doesn't exist
        os.makedirs(output_path, exist_ok=True)
        
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': os.path.join(output_path, '%(title)s.%(ext)s'),
            'quiet': False,
            'no_warnings': False,
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
        }
    else:
        ydl_opts = {
            'format': 'bestaudio/best',
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
        }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=download)
            
            result = {
                'title': info.get('title', 'Unknown'),
                'duration': info.get('duration', 0),
                'ext': info.get('ext', 'unknown'),
                'filesize': info.get('filesize', 'Unknown'),
                'abr': info.get('abr', 'Unknown'),
                'uploader': info.get('uploader', 'Unknown'),
                'view_count': info.get('view_count', 0),
            }
            
            if download:
                result['downloaded'] = True
                result['file_path'] = os.path.join(output_path, f"{info['title']}.mp3")
            else:
                result['audio_url'] = info['url']
                result['http_headers'] = info.get('http_headers', {})
                result['note'] = 'Note: Direct URL access may require cookies/auth. Use download=True for reliable downloads.'
            
            return result
            
    except Exception as e:
        return {'error': str(e)}


def stream_audio_url(video_url):
    """
    Get a streamable audio URL using yt-dlp's built-in method.
    This returns the URL that yt-dlp would use internally.
    """
    ydl_opts = {
        'format': 'bestaudio/best',
        'quiet': True,
        'no_warnings': True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=False)
            
            # Get the direct URL
            url = ydl.prepare_filename(info)
            
            return {
                'title': info.get('title'),
                'stream_url': info['url'],
                'format': info.get('format'),
                'note': 'Use yt-dlp or download with proper authentication'
            }
    except Exception as e:
        return {'error': str(e)}


# Example usage
if __name__ == "__main__":
    # Replace with your YouTube video URL
    youtube_url = "https://www.youtube.com/watch?v=c-FKlE3_kHo"
    
    print("="*60)
    print("OPTION 1: Get URL info (may not work for direct browser access)")
    print("="*60)
    result = get_best_audio_url(youtube_url, download=False)
    
    if 'error' in result:
        print(f"Error: {result['error']}")
    else:
        print(f"\nTitle: {result['title']}")
        print(f"Duration: {result['duration']} seconds")
        print(f"Format: {result['ext']}")
        print(f"Audio Bitrate: {result['abr']} kbps")
        print(f"Uploader: {result['uploader']}")
        print(f"Views: {result['view_count']:,}")
        print(f"\nAudio URL:")
        print(result['audio_url'][:100] + "...")
        print(f"\n⚠️  {result['note']}")
    
    print("\n" + "="*60)
    print("OPTION 2: Download audio directly (RECOMMENDED)")
    print("="*60)
    user_input = input("\nDo you want to download the audio as MP3? (y/n): ")
    
    if user_input.lower() == 'y':
        print("\nDownloading audio...")
        download_result = get_best_audio_url(youtube_url, download=True)
        
        if 'error' in download_result:
            print(f"Error: {download_result['error']}")
        elif download_result.get('downloaded'):
            print(f"\n✓ Audio downloaded successfully!")
            print(f"Title: {download_result['title']}")
            print(f"Location: {download_result['file_path']}")
        else:
            print("Download failed!")
    else:
        print("\nSkipping download.")
    
    print("\n" + "="*60)
    print("Note: For web apps, consider using yt-dlp on the backend")
    print("and streaming the downloaded file to users.")
    print("="*60)