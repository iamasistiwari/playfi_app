import { createAsyncThunk } from "@reduxjs/toolkit";
import { getSongUrl } from "@/actions/songs";
import { Video, Song } from "@/types/song";

export let previousSongId: string | null = null;
export const setSongAsync = createAsyncThunk(
  "songPlayer/setSongAsync",
  async (video: Video) => {
    if (previousSongId && previousSongId == video.id) {
      return null;
    }
    const musicUrl = await getSongUrl(video.id);
    const songWithUrl: Song = {
      video: video,
      musicUrl,
    };
    if (musicUrl.length < 0) {
      return {
        song: songWithUrl,
        error: "Failed to fetch music url",
      };
    }
    previousSongId = video.id;
    return {
      song: songWithUrl,
      error: null,
    };
  }
);
