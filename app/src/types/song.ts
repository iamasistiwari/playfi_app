export interface SongSearchResponse {
  responseStatus: {
    status: boolean;
    message: string;
  };
  responseData: Video[];
}

interface User {
  email: string;
  name: string;
  joined_at: string;
}

export interface UserProfile {
  email: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  joined_at: string;
  playlists_count: number;
  total_plays: number;
}

export interface UserStats {
  total_plays: number;
  total_minutes: number;
  playlists_count: number;
  top_songs: Video[];
}

export interface PlayHistoryItem {
  id: string;
  song: Video;
  played_at: string;
  duration_listened: number;
  completed: boolean;
}

export interface PlaylistMember {
  id: string;
  user: User;
  role: "editor" | "viewer";
  joined_at: string;
}

export interface UserSearchResult {
  email: string;
  name: string;
  avatar_url: string | null;
}

export type SetSongResult = {
  song: Song | null;
  relatedSongs: Video[] | null;
  error: string | null;
};

export interface Playlist {
  id: string;
  playlistName: string;
  admin: User;
  joined_users: User[];
  songs: Video[];
  created_at: string;
  isGlobal: boolean;
  members?: PlaylistMember[];
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
