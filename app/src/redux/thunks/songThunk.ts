import { createAsyncThunk } from "@reduxjs/toolkit";
import { getSongUrl } from "@/actions/songs";
import { SetSongResult, Song, Video } from "@/types/song";
import * as FileSystem from "expo-file-system";
import { RootState } from "../store";
import {
  addToPlayedSongs,
  removeSongFromQueue,
  setDownloadedSongInfo,
  removeDownloadedSongInfo,
  setDownloadProgress,
  addActiveDownload,
  removeActiveDownload,
} from "../song-player";
import AsyncStorage from "@react-native-async-storage/async-storage";

async function downloadAndMove(
  musicUrl: string,
  video: Video,
  dispatch: any,
  getState: any
) {
  const state = getState() as RootState;
  const videoId = video.id;

  // Check if already downloaded
  if (state.songPlayer.downloadedSongsMap[videoId]) {
    const fileInfo = await FileSystem.getInfoAsync(
      state.songPlayer.downloadedSongsMap[videoId].fileUri
    );
    if (fileInfo.exists) {
      return; // Already downloaded, skip
    }
  }

  // Check if already downloading
  if (state.songPlayer.activeDownloads.includes(videoId)) {
    return; // Already downloading, skip
  }

  const tempFileUri = `${FileSystem.cacheDirectory}${videoId}_temp_audio.mp4`;
  const finalUri = `${FileSystem.documentDirectory}${videoId}.mp4`;

  try {
    // Mark as active download
    dispatch(addActiveDownload(videoId));
    dispatch(setDownloadProgress({ videoId, progress: 0 }));

    // Check if temp file exists (partial download)
    const tempFileInfo = await FileSystem.getInfoAsync(tempFileUri);
    let resumable = false;

    if (tempFileInfo.exists) {
      // Can potentially resume, but expo-file-system doesn't support resume
      // So we'll delete and start fresh
      await FileSystem.deleteAsync(tempFileUri, { idempotent: true });
    }

    // Step 1: Download to temp with progress tracking
    const downloadResumable = FileSystem.createDownloadResumable(
      musicUrl,
      tempFileUri,
      {},
      (downloadProgress) => {
        const progress =
          downloadProgress.totalBytesWritten /
          downloadProgress.totalBytesExpectedToWrite;
        dispatch(
          setDownloadProgress({
            videoId,
            progress: Math.min(progress * 100, 99), // Cap at 99% until moved
          })
        );
      }
    );

    const res = await downloadResumable.downloadAsync();

    if (!res) {
      throw new Error("Download failed");
    }

    // Step 2: Move to permanent storage
    await FileSystem.moveAsync({
      from: res.uri,
      to: finalUri,
    });

    // Step 3: Update redux state
    dispatch(setDownloadedSongInfo({ videoId, fileUri: finalUri, video }));
    dispatch(setDownloadProgress({ videoId, progress: 100 }));

    // Clean up
    dispatch(removeActiveDownload(videoId));
  } catch (error) {
    console.error("Download error:", error);
    // Clean up on error
    dispatch(removeActiveDownload(videoId));

    // Try to clean up temp file
    try {
      await FileSystem.deleteAsync(tempFileUri, { idempotent: true });
    } catch {}
  }
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
      // Add to downloadedSongsMap if not already there
      if (!state.songPlayer.downloadedSongsMap[video.id]) {
        dispatch(setDownloadedSongInfo({ videoId: video.id, fileUri, video }));
      }
      // add to played songs
      return {
        song: {
          video,
          musicUrl: fileUri,
        },
        relatedSongs: null,
        error: null,
      };
    }
    const isGetRelatedSongs = state.songPlayer.queue.length < 1;
    const data = await getSongUrl(
      video.id,
      isGetRelatedSongs
    );
    if (!data.url) {
      return {
        song: null,
        relatedSongs: null,
        error: "No music URL found",
      };
    }

    // Start download in background (don't await)
    downloadAndMove(data.url, video, dispatch, getState);

    // Check if file is already downloaded, use local file
    const downloadedSongInfo = state.songPlayer.downloadedSongsMap[video.id];
    if (downloadedSongInfo) {
      const fileInfo = await FileSystem.getInfoAsync(downloadedSongInfo.fileUri);
      if (fileInfo.exists) {
        return {
          song: {
            video,
            musicUrl: downloadedSongInfo.fileUri,
          },
          relatedSongs: data.related_songs || null,
          error: null,
        };
      }
    }

    return {
      song: {
        video,
        musicUrl: data.url,
      },
      relatedSongs: data.related_songs || null,
      error: null,
    };
  }
);

export const setNextSongAsync = createAsyncThunk<Video | null>(
  "songPlayer/setNextSongAsync",
  async (_, { getState, dispatch }) => {
    const state = getState() as RootState;
    const video = state.songPlayer.queue[0];

    if (!video) {
      return null
    }

    // Check if already downloaded in map
    const downloadedSongInfo = state.songPlayer.downloadedSongsMap[video.id];
    if (downloadedSongInfo) {
      const fileInfo = await FileSystem.getInfoAsync(downloadedSongInfo.fileUri);
      if (fileInfo.exists) {
        return video;
      }
    }

    const fileUri = `${FileSystem.documentDirectory}${video.id}.mp4`;

    // Check if already downloaded (fallback check)
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) {
      return video;
    }
    const isGetRelatedSongs = state.songPlayer.queue.length < 1;
    const data = await getSongUrl(
      video.id,
      isGetRelatedSongs
    );
    if (!data.url) {
      return null
    }

    // Start download in background
    downloadAndMove(data.url, video, dispatch, getState);

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
