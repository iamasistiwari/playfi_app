import { createAsyncThunk } from "@reduxjs/toolkit";
import { getSongUrl } from "@/actions/songs";
import { Video } from "@/types/song";
import * as FileSystem from "expo-file-system";

async function downloadAndMove(musicUrl: string, videoId: string) {
  const tempFileUri = `${FileSystem.cacheDirectory}${videoId}_temp_audio.mp4`;
  const finalUri = `${FileSystem.documentDirectory}${videoId}.mp4`;

  try {
    // Delete old file if exists
    const oldFile = await FileSystem.getInfoAsync(finalUri);
    if (oldFile.exists) {
      await FileSystem.deleteAsync(finalUri, { idempotent: true });
    }

    // Step 1: Download to temp
    const res = await FileSystem.downloadAsync(musicUrl, tempFileUri);

    // Step 2: Move to permanent storage
    await FileSystem.moveAsync({
      from: res.uri,
      to: finalUri,
    });
  } catch (error) {}
}

export const setSongAsync = createAsyncThunk(
  "songPlayer/setSongAsync",
  async (video: Video) => {
    const fileUri = `${FileSystem.documentDirectory}${video.id}.mp4`;

    // Check if already downloaded
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) {
      return {
        song: {
          video,
          musicUrl: fileUri,
        },
        error: null,
      };
    }

    const musicUrl = await getSongUrl(video.id);
    if (!musicUrl) {
      return { song: null, error: "No music URL found" };
    }
    downloadAndMove(musicUrl, video.id);
    return {
      song: {
        video,
        musicUrl,
      },
      error: null,
    };
  }
);
