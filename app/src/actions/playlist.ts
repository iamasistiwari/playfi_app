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
    const searchResult = (response?.responseData ?? null) as Playlist | null;
    if (searchResult) {
      playlistCache.set(playlistId, searchResult);
    }
    return searchResult;
  } catch (error) {
    return null;
  }
};

export const addSongToPlaylist = async (
  playlistId: string,
  song: Video
): Promise<{
  status: false;
  message: string;
}> => {
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
