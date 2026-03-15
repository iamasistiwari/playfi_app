import { createAsyncThunk } from "@reduxjs/toolkit";
import { getSongUrl } from "@/actions/songs";
import { SetSongResult, Song, Video } from "@/types/song";
import * as FileSystem from "expo-file-system";
import { RootState } from "../store";
import {
  addToPlayedSongs,
  removeFromPlayedSongs,
  removeSongFromQueue,
  addSongToQueueFront,
  setDownloadedSongInfo,
  removeDownloadedSongInfo,
  setDownloadProgress,
  addActiveDownload,
  removeActiveDownload,
  setSongQueue,
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

    if (tempFileInfo.exists) {
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
            progress: Math.min(progress * 100, 99),
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
    dispatch(removeActiveDownload(videoId));

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

    // Remove this song from queue if it's there (avoid playing + queued)
    dispatch(removeSongFromQueue(video.id));

    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) {
      if (!state.songPlayer.downloadedSongsMap[video.id]) {
        dispatch(setDownloadedSongInfo({ videoId: video.id, fileUri, video }));
      }

      // Prepare next song after state settles
      setTimeout(() => dispatch(setNextSongAsync()), 100);

      return {
        song: { video, musicUrl: fileUri },
        relatedSongs: null,
        error: null,
      };
    }

    const isGetRelatedSongs = state.songPlayer.queue.length < 3;
    const data = await getSongUrl(video.id, isGetRelatedSongs);
    if (!data.url) {
      return { song: null, relatedSongs: null, error: "No music URL found" };
    }

    // Start download in background (don't await)
    downloadAndMove(data.url, video, dispatch, getState);

    // Check if file is already downloaded, use local file
    const downloadedSongInfo = state.songPlayer.downloadedSongsMap[video.id];
    if (downloadedSongInfo) {
      const info = await FileSystem.getInfoAsync(downloadedSongInfo.fileUri);
      if (info.exists) {
        // Prepare next song after state settles (with related songs added)
        setTimeout(() => dispatch(setNextSongAsync()), 100);

        return {
          song: { video, musicUrl: downloadedSongInfo.fileUri },
          relatedSongs: data.related_songs || null,
          error: null,
        };
      }
    }

    // Prepare next song after state settles
    setTimeout(() => dispatch(setNextSongAsync()), 100);

    return {
      song: { video, musicUrl: data.url },
      relatedSongs: data.related_songs || null,
      error: null,
    };
  }
);

export const setNextSongAsync = createAsyncThunk<Video | null>(
  "songPlayer/setNextSongAsync",
  async (_, { getState, dispatch }) => {
    const state = getState() as RootState;
    const currentId = state.songPlayer.currentSong?.video?.id;

    // Find first queue item that isn't the current song
    const video = state.songPlayer.queue.find((s) => s.id !== currentId);

    if (!video) {
      return null;
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

    const isGetRelatedSongs = state.songPlayer.queue.length < 3;
    const data = await getSongUrl(video.id, isGetRelatedSongs);
    if (!data.url) {
      return null;
    }

    // Start download in background
    downloadAndMove(data.url, video, dispatch, getState);

    return video;
  }
);

export const playNextAsync = createAsyncThunk(
  "songPlayer/playNext",
  async (_, { dispatch, getState }) => {
    const state = getState() as RootState;
    const { repeatMode, currentSong, nextSong, playedSongs, queue } = state.songPlayer;

    // Repeat One: replay current song
    if (repeatMode === 'one' && currentSong?.video) {
      dispatch(setSongAsync(currentSong.video));
      return;
    }

    // Add current song to played history before moving on
    if (currentSong?.video) {
      dispatch(addToPlayedSongs(currentSong.video));
    }

    // Try nextSong first, then fall back to first song in queue
    const songToPlay = nextSong || queue[0] || null;
    if (songToPlay) {
      dispatch(setSongAsync(songToPlay));
    } else if (repeatMode === 'all' && playedSongs.length > 0) {
      // Queue is empty, repeat all: replay from played songs
      const allPlayed = [...playedSongs];
      if (currentSong?.video) {
        allPlayed.push(currentSong.video);
      }
      dispatch(setSongQueue(allPlayed.slice(1)));
      dispatch(setSongAsync(allPlayed[0]));
    }
    // If repeatMode === 'off' and no next song, playback stops
  }
);

export const autoFillQueueAsync = createAsyncThunk(
  "songPlayer/autoFillQueue",
  async (_, { getState, dispatch }) => {
    const state = getState() as RootState;
    const { currentSong, queue, nextSong } = state.songPlayer;

    // Only auto-fill if queue is empty and we have a current song
    if (queue.length > 0 || !currentSong?.video) return;
    // Also skip if nextSong already exists
    if (nextSong) return;

    const data = await getSongUrl(currentSong.video.id, true);
    if (data.related_songs && data.related_songs.length > 0) {
      const currentId = currentSong.video.id;
      const newSongs = data.related_songs.filter((s) => s.id !== currentId);
      if (newSongs.length > 0) {
        dispatch(setSongQueue(newSongs));
        // Prepare next song
        setTimeout(() => dispatch(setNextSongAsync()), 100);
      }
    }
  }
);

export const playPreviousAsync = createAsyncThunk(
  "songPlayer/playPrevious",
  async (_, { dispatch, getState }) => {
    const state = getState() as RootState;
    const { playedSongs, currentSong, queue } = state.songPlayer;

    if (playedSongs.length > 0) {
      const songToPlay = playedSongs.at(-1)!;

      // Put current song back at front of queue so user can go forward again
      if (currentSong?.video) {
        dispatch(addSongToQueueFront(currentSong.video));
      }

      // Remove from played history
      dispatch(removeFromPlayedSongs(songToPlay.id));

      dispatch(setSongAsync(songToPlay));
    }
  }
);
