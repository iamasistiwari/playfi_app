import { Playlist } from "@/types/song";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  fetchAllPlaylistAsync,
  globalPlaylistAsync,
  userPlaylistAsync,
} from "./thunks/playlistThunk";

interface PlaylistState {
  loading: boolean;
  userPlaylists: Playlist[];
  globalPlaylists: Playlist[];
}

const initialState: PlaylistState = {
  loading: false,
  userPlaylists: [],
  globalPlaylists: [],
};

const playlistSlice = createSlice({
  name: "playlist",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(userPlaylistAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        userPlaylistAsync.fulfilled,
        (state, action: PayloadAction<Playlist[]>) => {
          state.userPlaylists = action.payload;
          state.loading = false;
        }
      )
      .addCase(globalPlaylistAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        globalPlaylistAsync.fulfilled,
        (state, action: PayloadAction<Playlist[]>) => {
          state.globalPlaylists = action.payload;
          state.loading = false;
        }
      )
      .addCase(fetchAllPlaylistAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        fetchAllPlaylistAsync.fulfilled,
        (
          state,
          action: PayloadAction<{
            globalPlaylists: Playlist[];
            userPlaylists: Playlist[];
          }>
        ) => {
          state.globalPlaylists = action.payload.globalPlaylists;
          state.userPlaylists = action.payload.userPlaylists;
          state.loading = false;
        }
      );
  },
});

export default playlistSlice.reducer;
