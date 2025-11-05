import { Playlist, Video } from "@/types/song";
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
  likedSongsPlaylist: Playlist;
}

const initialState: PlaylistState = {
  loading: false,
  userPlaylists: [],
  globalPlaylists: [],
  currentPlaylist: null,
  playlist: new Map(),
  likedSongsPlaylist: {
    id: "likedSongs",
    playlistName: "Liked Songs",
    admin: {
      email: "",
      name: "",
      joined_at: "",
    },
    joined_users: [],
    songs: [],
    created_at: "",
    isGlobal: false,
  },
};

const playlistSlice = createSlice({
  name: "playlist",
  initialState,
  reducers: {
    handleLikeSong: (state, action: PayloadAction<Video>) => {
      const isLiked = state.likedSongsPlaylist.songs.some(
        (song) => song.id === action.payload.id
      );
      if (isLiked) {
        state.likedSongsPlaylist.songs = state.likedSongsPlaylist.songs.filter(
          (item) => item.id !== action.payload.id
        );
      } else {
        state.likedSongsPlaylist.songs.push(action.payload);
      }

      // Update currentPlaylist if it's the liked songs playlist
      if (state.currentPlaylist?.id === "likedSongs") {
        state.currentPlaylist = { ...state.likedSongsPlaylist };
      }
    },
    resetPlaylistAfterSignout: (state) => {
      state.currentPlaylist = null;
      state.globalPlaylists = [];
      state.playlist = null;
      state.userPlaylists = [];
      state.likedSongsPlaylist = {
        id: "likedSongs",
        playlistName: "Liked Songs",
        admin: {
          email: "",
          name: "",
          joined_at: "",
        },
        joined_users: [],
        songs: [],
        created_at: "",
        isGlobal: false,
      };
    },
    setCurrentPlaylist: (state, action: PayloadAction<string>) => {
      if (action.payload === "likedSongs") {
        state.currentPlaylist = state.likedSongsPlaylist;
        return;
      }
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
          action.payload.forEach((playlist) => {
            state.playlist.set(playlist.id, playlist);
          });
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
            state.userPlaylists = state.userPlaylists.map((item) =>
              item.id === action.payload?.id
                ? { ...item, songs: action.payload.songs }
                : item
            );
            state.globalPlaylists = state.globalPlaylists.map((item) =>
              item.id === action.payload?.id
                ? { ...item, songs: action.payload.songs }
                : item
            );
            // update current playlist
            if (state.currentPlaylist?.id === action.payload.id) {
              state.currentPlaylist = action.payload;
            }
          }
          state.loading = false;
        }
      );
  },
});

export default playlistSlice.reducer;
export const { setCurrentPlaylist, handleLikeSong, resetPlaylistAfterSignout } =
  playlistSlice.actions;
