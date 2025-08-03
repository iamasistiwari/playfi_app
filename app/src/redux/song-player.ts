import { Song, Video } from "@/types/song";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { setSongAsync } from "./thunks/songThunk";

interface songPlayerState {
  currentSong: Song | null;
  queue: Video[];
  loading: boolean;
}

const initialState: songPlayerState = {
  currentSong: null,
  queue: [],
  loading: false,
};

const songPlayerSlice = createSlice({
  name: "songPlayer",
  initialState,
  reducers: {
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
export const { addSongToQueue, removeSongFromQueue } = songPlayerSlice.actions;
