export interface SongSearchResponse {
  responseStatus: {
    status: boolean;
    message: string;
  };
  responseData: Video[];
}

export interface Video {
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
  channel: {
    name: string;
    id: string;
    thumbnails: Thumbnail[];
    link: string;
  };
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


export interface Song {
  video: Video;
  musicUrl: string;
}