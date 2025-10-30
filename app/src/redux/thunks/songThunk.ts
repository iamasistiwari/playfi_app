import { createAsyncThunk } from "@reduxjs/toolkit";
import { getSongUrl } from "@/actions/songs";
import { SetSongResult, Song, Video } from "@/types/song";
import * as FileSystem from "expo-file-system";
import { AppDispatch, RootState } from "../store";
import {
  addToDownloadedSongs,
  addToPlayedSongs,
  removeFromDownloadedSongs,
  removeSongFromQueue,
} from "../song-player";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch } from "react-redux";

async function removeDownloadedSong(video: Video) {
  const finalUri = `${FileSystem.documentDirectory}${video.id}.mp4`;
  const dispatch = useDispatch<AppDispatch>();
  try {
    // Delete old file if exists
    const oldFile = await FileSystem.getInfoAsync(finalUri);
    if (oldFile.exists) {
      await FileSystem.deleteAsync(finalUri, { idempotent: true });
    }
    dispatch(removeFromDownloadedSongs(video.id));
  } catch (error) {}
}

async function downloadAndMove(
  musicUrl: string,
  video: Video,
  image_url: string | null,
  relatedSongs: Video[] | null
) {
  const tempFileUri = `${FileSystem.cacheDirectory}${video.id}_temp_audio.mp4`;
  const finalUri = `${FileSystem.documentDirectory}${video.id}.mp4`;
  const dispatch = useDispatch<AppDispatch>();
  const tempImageUri = `${FileSystem.cacheDirectory}${video.id}_temp_image.jpg`;
  const finalImageUri = `${FileSystem.documentDirectory}${video.id}.jpg`;
  try {
    // caching the related songs
    if (relatedSongs) {
      await AsyncStorage.setItem(
        `song_related_${video.id}`,
        JSON.stringify(relatedSongs)
      );
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
    dispatch(addToDownloadedSongs(video));
  } catch (error) {}
}

export const setSongAsync = createAsyncThunk<SetSongResult, Video>(
  "songPlayer/setSongAsync",
  async (video, { getState, dispatch }) => {
    const fileUri = `${FileSystem.documentDirectory}${video.id}.mp4`;
    const state = getState() as RootState;
    // Check if already downloaded
    dispatch(setNextSongAsync());
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) {
      const cachedImage = await AsyncStorage.getItem(`song_image_${video.id}`);
      let relatedSongs = null;
      if (state.songPlayer.queue.length < 1) {
        relatedSongs = await AsyncStorage.getItem(`song_related_${video.id}`);
      }
      // add to played songs
      return {
        song: {
          video,
          musicUrl: fileUri,
          image_url: cachedImage ? cachedImage : video?.richThumbnail?.url,
        },
        relatedSongs: relatedSongs ? JSON.parse(relatedSongs) : null,
        error: null,
      };
    }
    const isGetRelatedSongs = state.songPlayer.queue.length < 1;
    const data = await getSongUrl(
      video.id,
      video?.richThumbnail?.url || "",
      isGetRelatedSongs
    );
    if (!data.url) {
      return {
        song: null,
        relatedSongs: null,
        error: "No music URL found",
      };
    }

    downloadAndMove(data.url, video, data.image_url, data.related_songs);

    return {
      song: {
        video,
        musicUrl: data.url,
        image_url: data.image_url,
      },
      relatedSongs: data.related_songs || null,
      error: null,
    };
  }
);

export const setNextSongAsync = createAsyncThunk<Video | null>(
  "songPlayer/setNextSongAsync",
  async (_, { getState }) => {
    const state = getState() as RootState;
    const video = state.songPlayer.queue[0];

    if (!video) {
      return null
    }
    const fileUri = `${FileSystem.documentDirectory}${video.id}.mp4`;

    // Check if already downloaded
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) {
      return video;
    }
    const isGetRelatedSongs = state.songPlayer.queue.length < 1;
    const data = await getSongUrl(
      video.id,
      video?.richThumbnail?.url || "",
      isGetRelatedSongs
    );
    if (!data.url) {
      return null
    }

    downloadAndMove(data.url, video, data.image_url, data.related_songs);

    return video
  }
);

export const playNextAsync = createAsyncThunk(
  "songPlayer/playNext",
  async (_, { dispatch, getState }) => {
    const state = getState() as RootState;
    const songToPlay = state.songPlayer.nextSong;
    if (songToPlay) {
      dispatch(addToPlayedSongs(songToPlay));
      dispatch(setSongAsync(songToPlay));
    }
  }
);

export const playPreviousAsync = createAsyncThunk(
  "songPlayer/playPrevious",
  async (_, { dispatch, getState }) => {
    const state = getState() as RootState;
    const playedSongs = state.songPlayer.playedSongs || [];
    if (playedSongs.length > 0) {
      const songToPlay = playedSongs.at(-1) || null;
      if (!songToPlay) {
        return;
      }
      await dispatch(setSongAsync(songToPlay));
    }
  }
);
