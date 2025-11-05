import { SetSongResult, Song, Video } from "@/types/song";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { setNextSongAsync, setSongAsync } from "./thunks/songThunk";

interface DownloadedSongInfo {
  video: Video;
  fileUri: string;
  downloadedAt: number;
}

interface songPlayerState {
  currentSong: Song | null;
  nextSong: Video | null;
  loading: boolean;
  recentSearch: string[];
  queue: Video[];
  playedSongs: Video[];
  lastSession: Video[];
  downloadedSongs: Video[];
  downloadedSongsMap: Record<string, DownloadedSongInfo>;
  downloadProgress: Record<string, number>;
  activeDownloads: string[];
  lastSearchQuery: string;
  lastSearchResults: Video[];
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
  downloadedSongsMap: {},
  downloadProgress: {},
  activeDownloads: [],
  lastSearchQuery: "",
  lastSearchResults: [],
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
      state.downloadedSongsMap = {};
      state.downloadProgress = {};
      state.activeDownloads = [];
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
    setDownloadedSongInfo(
      state,
      action: PayloadAction<{ videoId: string; fileUri: string; video: Video }>
    ) {
      // Only update if not already present or if file path changed
      const existing = state.downloadedSongsMap[action.payload.videoId];

      state.downloadedSongsMap[action.payload.videoId] = {
        video: action.payload.video,
        fileUri: action.payload.fileUri,
        downloadedAt: existing?.downloadedAt || Date.now(), // Keep original download time
      };

      // Also update the array for backwards compatibility
      // Remove any existing entries first to prevent duplicates
      state.downloadedSongs = state.downloadedSongs.filter(
        (s) => s.id !== action.payload.videoId
      );
      state.downloadedSongs.push(action.payload.video);
    },
    removeDownloadedSongInfo(state, action: PayloadAction<string>) {
      delete state.downloadedSongsMap[action.payload];
      delete state.downloadProgress[action.payload];
      state.downloadedSongs = state.downloadedSongs.filter(
        (song) => song.id !== action.payload
      );
    },
    setDownloadProgress(
      state,
      action: PayloadAction<{ videoId: string; progress: number }>
    ) {
      state.downloadProgress[action.payload.videoId] = action.payload.progress;
    },
    addActiveDownload(state, action: PayloadAction<string>) {
      if (!state.activeDownloads.includes(action.payload)) {
        state.activeDownloads.push(action.payload);
      }
    },
    removeActiveDownload(state, action: PayloadAction<string>) {
      state.activeDownloads = state.activeDownloads.filter(
        (id) => id !== action.payload
      );
      // Clean up progress when download is complete or cancelled
      delete state.downloadProgress[action.payload];
    },
    setLastSearchState(
      state,
      action: PayloadAction<{ query: string; results: Video[] }>
    ) {
      state.lastSearchQuery = action.payload.query;
      state.lastSearchResults = action.payload.results;
    },
    clearLastSearchState(state) {
      state.lastSearchQuery = "";
      state.lastSearchResults = [];
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
        }
      )
      .addCase(
        setSongAsync.pending,
        (state) => {
          state.loading = true;
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
  setDownloadedSongInfo,
  removeDownloadedSongInfo,
  setDownloadProgress,
  addActiveDownload,
  removeActiveDownload,
  setLastSearchState,
  clearLastSearchState,
} = songPlayerSlice.actions;
