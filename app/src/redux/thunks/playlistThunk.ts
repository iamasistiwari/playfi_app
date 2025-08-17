import {
  fetchGlobalPlaylists,
  fetchSinglePlaylist,
  fetchUserPlaylists,
} from "@/actions/playlist";
import { Playlist } from "@/types/song";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const userPlaylistAsync = createAsyncThunk(
  "playlist/userPlaylistAsync",
  async () => {
    const res = await fetchUserPlaylists();
    return res;
  }
);

export const globalPlaylistAsync = createAsyncThunk(
  "playlist/globalPlaylistAsync",
  async () => {
    const res = await fetchGlobalPlaylists();
    return res;
  }
);

export const fetchAllPlaylistAsync = createAsyncThunk(
  "playlist/fetchAllPlaylistAsync",
  async () => {
    const globalPlaylists = await fetchGlobalPlaylists();
    const userPlaylists = await fetchUserPlaylists();

    const map: Map<string, Playlist> = new Map();
    const playlists = [...globalPlaylists, ...userPlaylists];
    const res = await Promise.allSettled(
      playlists.map(async (item) => {
        return await fetchSinglePlaylist(item.id, true);
      })
    );
    res.forEach((item) => {
      if (item.status === "fulfilled" && item.value) {
        map.set(item.value.id, item.value);
      }
    });
    return {
      globalPlaylists,
      userPlaylists,
      map,
    };
  }
);

export const fetchSinglePlaylistAsync = createAsyncThunk(
  "playlist/fetchSinglePlaylistAsync",
  async ({
    playlistId,
    fresh = false,
  }: {
    playlistId: string;
    fresh: boolean;
  }) => {
    const res = await fetchSinglePlaylist(playlistId, fresh);
    return res;
  }
);


