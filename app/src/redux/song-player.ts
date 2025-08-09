import { Song, Video } from "@/types/song";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { setSongAsync } from "./thunks/songThunk";

interface songPlayerState {
  currentSong: Song | null;
  queue: Video[];
  loading: boolean;
  recentSearch: string[];
}

const initialState: songPlayerState = {
  currentSong: null,
  queue: [],
  loading: false,
  recentSearch: [],
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
      if (state.recentSearch.length > 10) {
        state.recentSearch.pop();
      }
    },

    addSongToQueue(state, action: PayloadAction<Video>) {
      state.queue = state.queue.filter((song) => song.id !== action.payload.id);
      state.queue.push(action.payload);
    },
    removeSongFromQueue(state, action: PayloadAction<string>) {
      state.queue = state.queue.filter((song) => song.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(setSongAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        setSongAsync.fulfilled,
        (
          state,
          action: PayloadAction<{
            song: Song;
            error: string | null;
          } | null>
        ) => {
          if (!action.payload) {
            state.loading = false;
            return;
          }
          state.currentSong = action.payload.song;
          state.loading = false;
        }
      );
  },
});

export default songPlayerSlice.reducer;
export const { addSongToQueue, removeSongFromQueue, addToRecentSearch } =
  songPlayerSlice.actions;
