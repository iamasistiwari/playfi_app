import { SetSongResult, Song, Video } from "@/types/song";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { setNextSongAsync, setSongAsync } from "./thunks/songThunk";

interface songPlayerState {
  currentSong: Song | null;
  nextSong: Video | null;
  loading: boolean;
  recentSearch: string[];
  queue: Video[];
  playedSongs: Video[];
  lastSession: Video[];
  downloadedSongs: Video[];
}

const initialState: songPlayerState = {
  currentSong: null,
  nextSong: null,
  loading: false,
  recentSearch: [],
  queue: [],
  playedSongs: [],
  lastSession: [],
  downloadedSongs: [],
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
      state.playedSongs = state.playedSongs.filter(
        (song) => song.id !== action.payload.id
      );
      state.playedSongs.push(action.payload);
    },
    removeFromPlayedSongs(state, action: PayloadAction<string>) {
      if (!Array.isArray(state.playedSongs)) {
        state.playedSongs = [];
      }
      state.playedSongs = state.playedSongs.filter(
        (song) => song.id !== action.payload
      );
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
      state.playedSongs = [];
      state.downloadedSongs = [];
    },
    addToDownloadedSongs(state, action: PayloadAction<Video>) {
      if (!Array.isArray(state.downloadedSongs)) {
        state.downloadedSongs = [];
      }
      state.downloadedSongs = state.downloadedSongs.filter(
        (song) => song.id !== action.payload.id
      );
      state.downloadedSongs.push(action.payload);
    },
    removeFromDownloadedSongs(state, action: PayloadAction<string>) {
      if (!Array.isArray(state.downloadedSongs)) {
        state.downloadedSongs = [];
      }
      state.downloadedSongs = state.downloadedSongs.filter(
        (song) => song.id !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(
        setNextSongAsync.fulfilled,
        (state, action: PayloadAction<Video | null>) => {
          if (!action.payload) {
            return;
          }
          state.nextSong = action.payload;
          state.queue.shift();
          state.loading = false;
        }
      )
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
  addToDownloadedSongs,
  removeFromDownloadedSongs,
} = songPlayerSlice.actions;
