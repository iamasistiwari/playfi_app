import { get, post } from "@/lib/api";
import { Playlist, Video } from "@/types/song";

export const fetchUserPlaylists = async (): Promise<Playlist[]> => {
  try {
    const response = await get("/api/v1/playlists");
    const searchResult = response?.responseData || [];
    return searchResult;
  } catch (error) {
    return [];
  }
};

export const fetchGlobalPlaylists = async (): Promise<Playlist[]> => {
  try {
    const response = await get("/api/v1/playlists/global");
    const searchResult = response?.responseData || [];
    return searchResult;
  } catch (error) {
    return [];
  }
};

const playlistCache = new Map<string, Playlist>();

export const fetchSinglePlaylist = async (
  playlistId: string,
  fetchFresh: boolean = false
): Promise<Playlist | null> => {
  try {
    if (!fetchFresh && playlistCache.has(playlistId)) {
      return playlistCache.get(playlistId);
    }
    const response = await get(`/api/v1/playlist/${playlistId}`);
    const searchResult: Playlist | null = response?.responseData ?? null;
    if (searchResult) {
      playlistCache.set(playlistId, searchResult);
    }
    return searchResult;
  } catch (error) {
    return null;
  }
};

export const addOrRemoveSongFromPlaylist = async (
  isPresent: boolean,
  playlistId: string,
  song: Video
): Promise<{
  status: false;
  message: string;
}> => {
  if (isPresent) {
    try {
      const response = await post("/api/v1/remove/song", {
        playlist_id: playlistId,
        song_id: song.id,
      });
      const isRemoved = response?.responseStatus?.status || false;
      return {
        status: isRemoved,
        message: response?.responseStatus?.message || "",
      };
    } catch (error) {
      return {
        status: false,
        message: "Error removing song from playlist",
      };
    }
  }
  try {
    const response = await post("/api/v1/add/song", {
      playlist_id: playlistId,
      song_data: song,
    });
    const isCreated = response?.responseStatus?.status || false;
    return {
      status: isCreated,
      message: response?.responseStatus?.message || "",
    };
  } catch (error) {
    return {
      status: false,
      message: "Error adding song to playlist",
    };
  }
};

export async function createPlaylistAsync(playlistName: string): Promise<{
  status: boolean;
  message: string;
}> {
  try {
    const response = await post("/api/v1/playlists/", {
      playlistName: playlistName,
    });
    const isCreated = response?.responseStatus?.status || false;
    return {
      status: isCreated,
      message: response?.responseStatus?.message || "",
    };
  } catch (error) {
    return {
      status: false,
      message: "Error creating playlist",
    };
  }
}
