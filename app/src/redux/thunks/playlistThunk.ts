import { fetchGlobalPlaylists, fetchUserPlaylists } from "@/actions/playlist";
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
    return {
      globalPlaylists,
      userPlaylists,
    };
  }
);
