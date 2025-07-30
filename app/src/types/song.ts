export interface SongSearchResponse {
  responseStatus: {
    status: boolean;
    message: string;
  };
  responseData: VideoItem[]
}

export interface VideoItem {
  type: string;
  id: string;
  title: string;
  publishedTime: string;
  duration: string;
  viewCount: {
    text: string;
    short: string;
  };
  thumbnails: Thumbnail[];
  richThumbnail: Thumbnail;
  channel: Channel;
  accessibility: {
    title: string;
    duration: string;
  };
  link: string;
}

export interface Thumbnail {
  url: string;
  width: number;
  height: number;
}

export interface Channel {
  name: string;
  id: string;
  thumbnails: Thumbnail[];
  link: string;
}
