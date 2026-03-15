import { del, get, post, put } from "@/lib/api";
import { Playlist, UserSearchResult, Video } from "@/types/song";

export const fetchUserPlaylists = async (): Promise<Playlist[]> => {
  try {
    const response = await get("/api/v1/playlists");
    const searchResult = response?.responseData || [];
    return searchResult;
  } catch (error) {
    return [];
  }
};

export const changeVisiblity = async (
  playlistId: string,
  isGlobal: boolean
): Promise<boolean> => {
  try {
    const urlToHit = isGlobal
      ? "/api/v1/playlist/global"
      : "/api/v1/playlist/private";
    const res = await post(urlToHit, {
      playlist_id: playlistId,
    });
    return res?.responseStatus?.status || false;
  } catch (error) {
    return false;
  }
};

export const deletePlaylist = async (
  playlistId: string
): Promise<{
  status: boolean;
  message: string;
}> => {
  try {
    const response = await del(`/api/v1/playlist/${playlistId}`);
    const isDeleted = response?.responseStatus?.status || false;
    return {
      status: isDeleted,
      message: response?.responseStatus?.message || "",
    };
  } catch (error) {
    return {
      status: false,
      message: "Error deleting playlist",
    };
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
      return playlistCache.get(playlistId)!;
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
  status: boolean;
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

export const inviteToPlaylist = async (
  playlistId: string,
  userEmail: string,
  role: string = "editor"
): Promise<{ status: boolean; message: string }> => {
  try {
    const response = await post("/api/v1/playlist/invite", {
      playlist_id: playlistId,
      user_email: userEmail,
      role,
    });
    return {
      status: response?.responseStatus?.status || false,
      message: response?.responseStatus?.message || "",
    };
  } catch (error) {
    return { status: false, message: "Error inviting user" };
  }
};

export const leavePlaylist = async (
  playlistId: string
): Promise<{ status: boolean; message: string }> => {
  try {
    const response = await post("/api/v1/playlist/leave", {
      playlist_id: playlistId,
    });
    return {
      status: response?.responseStatus?.status || false,
      message: response?.responseStatus?.message || "",
    };
  } catch (error) {
    return { status: false, message: "Error leaving playlist" };
  }
};

export const searchUsers = async (query: string): Promise<UserSearchResult[]> => {
  try {
    const response = await get(`/api/v1/users/search`, { q: query });
    return response?.responseData || [];
  } catch (error) {
    return [];
  }
};

export const renamePlaylist = async (
  playlistId: string,
  newName: string
): Promise<{ status: boolean; message: string }> => {
  try {
    const response = await put(`/api/v1/playlist/${playlistId}`, {
      playlistName: newName,
    });
    return {
      status: response?.responseStatus?.status || false,
      message: response?.responseStatus?.message || "",
    };
  } catch (error) {
    return { status: false, message: "Error renaming playlist" };
  }
};

export const removeUserFromPlaylist = async (
  playlistId: string,
  userEmail: string
): Promise<{ status: boolean; message: string }> => {
  try {
    const response = await post("/api/v1/playlist/remove/user", {
      playlist_id: playlistId,
      user_email: userEmail,
    });
    return {
      status: response?.responseStatus?.status || false,
      message: response?.responseStatus?.message || "",
    };
  } catch (error) {
    return { status: false, message: "Error removing user" };
  }
};
