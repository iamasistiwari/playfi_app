import { Playlist } from "@/types/song";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  fetchAllPlaylistAsync,
  fetchSinglePlaylistAsync,
  globalPlaylistAsync,
  userPlaylistAsync,
} from "./thunks/playlistThunk";

interface PlaylistState {
  loading: boolean;
  userPlaylists: Playlist[];
  globalPlaylists: Playlist[];
  currentPlaylist: Playlist | null;
  playlist: Map<string, Playlist>;
}

const initialState: PlaylistState = {
  loading: false,
  userPlaylists: [],
  globalPlaylists: [],
  currentPlaylist: null,
  playlist: new Map(),
};

const playlistSlice = createSlice({
  name: "playlist",
  initialState,
  reducers: {
    setCurrentPlaylist: (state, action: PayloadAction<string>) => {
      const playlist = state.playlist.get(action.payload);
      if (playlist) {
        state.currentPlaylist = playlist;
      }
    },
  },
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
            map: Map<string, Playlist>;
          }>
        ) => {
          state.globalPlaylists = action.payload.globalPlaylists;
          state.userPlaylists = action.payload.userPlaylists;
          state.playlist = action.payload.map;
          state.loading = false;
        }
      )
      .addCase(fetchSinglePlaylistAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        fetchSinglePlaylistAsync.fulfilled,
        (state, action: PayloadAction<Playlist | null>) => {
          if (action.payload) {
            state.playlist.set(action.payload.id, action.payload);
          }
          state.loading = false;
        }
      );
  },
});

export default playlistSlice.reducer;
export const { setCurrentPlaylist } = playlistSlice.actions;
