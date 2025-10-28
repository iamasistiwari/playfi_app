import { SetSongResult, Song, Video } from "@/types/song";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { setSongAsync } from "./thunks/songThunk";

interface songPlayerState {
  currentSong: Song | null;
  loading: boolean;
  recentSearch: string[];
  queue: Video[];
  playedSongs: Video[];
  lastSession: Video[];
}

const initialState: songPlayerState = {
  currentSong: null,
  loading: false,
  recentSearch: [],
  queue: [],
  playedSongs: [],
  lastSession: [],
};

const songPlayerSlice = createSlice({
  name: "songPlayer",
  initialState,
  reducers: {
    addToRecentSearch(state, action: PayloadAction<string>) {
      if (!Array.isArray(state.recentSearch)) {
        state.recentSearch = [];
      }
      const term = action.payload;
      state.recentSearch = state.recentSearch.filter((item) => item !== term);
      state.recentSearch.unshift(term);
      if (state.recentSearch.length > 15) {
        state.recentSearch.pop();
      }
    },

    setSongQueue(state, action: PayloadAction<Video[]>) {
      state.queue = action.payload;
    },
    addToPlayedSongs(state, action: PayloadAction<Video>) {
      if (!Array.isArray(state.playedSongs)) {
        state.playedSongs = [];
      }
      state.playedSongs = state.playedSongs.filter((song) => song.id !== action.payload.id);
      state.playedSongs.push(action.payload);
    },
    removeFromPlayedSongs(state, action: PayloadAction<string>) {
      if (!Array.isArray(state.playedSongs)) {
        state.playedSongs = [];
      }
      state.playedSongs = state.playedSongs.filter((song) => song.id !== action.payload);
    },

    addSongToQueue(state, action: PayloadAction<Video>) {
      if (!Array.isArray(state.queue)) {
        state.queue = [];
      }
      state.queue = state.queue.filter((song) => song.id !== action.payload.id);
      state.queue.push(action.payload);
    },
    removeSongFromQueue(state, action: PayloadAction<string>) {
      if (!Array.isArray(state.queue)) {
        state.queue = [];
      }
      state.queue = state.queue.filter((song) => song.id !== action.payload);
    },
    resetSongPlayer(state) {
      state.recentSearch = [];
      state.lastSession = [];
      state.currentSong = null;
      state.queue = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(setSongAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        setSongAsync.fulfilled,
        (state, action: PayloadAction<SetSongResult>) => {
          if (!action.payload.song) {
            state.loading = false;
            return;
          }
          state.currentSong = action.payload.song;
          state.queue = [
            ...state.queue,
            ...(action.payload.relatedSongs || []),
          ];
          state.loading = false;
        }
      );
  },
});

export default songPlayerSlice.reducer;
export const {
  addSongToQueue,
  removeSongFromQueue,
  addToRecentSearch,
  setSongQueue,
  resetSongPlayer,
  addToPlayedSongs,
  removeFromPlayedSongs,
} = songPlayerSlice.actions;
