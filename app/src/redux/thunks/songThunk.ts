import { createAsyncThunk } from "@reduxjs/toolkit";
import { getSongUrl } from "@/actions/songs";
import { SetSongResult, Song, Video } from "@/types/song";
import * as FileSystem from "expo-file-system";
import { RootState } from "../store";
import { addToPlayedSongs, removeSongFromQueue } from "../song-player";
import AsyncStorage from "@react-native-async-storage/async-storage";

async function downloadAndMove(musicUrl: string, videoId: string, image_url: string | null, relatedSongs: Video[] | null) {
  const tempFileUri = `${FileSystem.cacheDirectory}${videoId}_temp_audio.mp4`;
  const finalUri = `${FileSystem.documentDirectory}${videoId}.mp4`;
  
  const tempImageUri = `${FileSystem.cacheDirectory}${videoId}_temp_image.jpg`;
  const finalImageUri = `${FileSystem.documentDirectory}${videoId}.jpg`;
  try {

    // caching the related songs
    if (relatedSongs) {
      await AsyncStorage.setItem(`song_related_${videoId}`, JSON.stringify(relatedSongs));
    }

    // caching the image url
    // download image also
    if (image_url) {
      const oldFile = await FileSystem.getInfoAsync(finalImageUri);
      if (oldFile.exists) {
        await FileSystem.deleteAsync(finalImageUri, { idempotent: true });
      }
      // download image
      const res = await FileSystem.downloadAsync(image_url, tempImageUri);
      // move image to permanent storage
      await FileSystem.moveAsync({
        from: res.uri,
        to: finalImageUri,
      });
    }

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



export const setSongAsync = createAsyncThunk<SetSongResult, Video>(
  "songPlayer/setSongAsync",
  async (video, { getState }) => {
    const fileUri = `${FileSystem.documentDirectory}${video.id}.mp4`;

    // Check if already downloaded
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) {
      const cachedImage = await AsyncStorage.getItem(`song_image_${video.id}`);
      const relatedSongs = await AsyncStorage.getItem(
        `song_related_${video.id}`
      );
      return {
        song: {
          video,
          musicUrl: fileUri,
          highResImageUrl: cachedImage || "",
        },
        relatedSongs: relatedSongs ? JSON.parse(relatedSongs) : null,
        error: null,
      };
    }
    const state = getState() as RootState;
    const isGetRelatedSongs = state.songPlayer.queue.length < 2;
    const data = await getSongUrl(video.id, video?.richThumbnail?.url || "",  isGetRelatedSongs);
    if (!data.url) {
      return {
        song: null,
        relatedSongs: null,
        error: "No music URL found",
      };
    }

    downloadAndMove(
      data.url,
      video.id,
      data.high_res_image_url || data.less_res_image_url,
      data.related_songs
    );

    return {
      song: {
        video,
        musicUrl: data.url,
        highResImageUrl: data.high_res_image_url || data.less_res_image_url,
      },
      relatedSongs: data.related_songs || null,
      error: null,
    };
  }
);

export const playNextAsync = createAsyncThunk(
  "songPlayer/playNext",
  async (_, { dispatch, getState }) => {
    const state = getState() as RootState;
    const queue = state.songPlayer.queue || [];
    if (queue.length > 0) {
      const songToPlay = queue[0];
      dispatch(removeSongFromQueue(songToPlay.id));
      dispatch(addToPlayedSongs(songToPlay));
      await dispatch(setSongAsync(songToPlay));
    }
  }
);

export const playPreviousAsync = createAsyncThunk(
  "songPlayer/playPrevious",
  async (_, { dispatch, getState }) => {
    const state = getState() as RootState;
    const playedSongs = state.songPlayer.playedSongs || [];
    if (playedSongs.length > 0) {
      const songToPlay = playedSongs[playedSongs.length - 1];
      dispatch(removeSongFromQueue(songToPlay.id));
      dispatch(addToPlayedSongs(songToPlay));
      await dispatch(setSongAsync(songToPlay));
    }
  }
);
