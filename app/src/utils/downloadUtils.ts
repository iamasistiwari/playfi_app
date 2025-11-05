import * as FileSystem from "expo-file-system";
import { Video } from "@/types/song";
import { removeDownloadedSongInfo } from "@/redux/song-player";

export async function removeDownloadedSong(
  video: Video,
  dispatch: any
) {
  const finalUri = `${FileSystem.documentDirectory}${video.id}.mp4`;
  try {
    // Delete old file if exists
    const oldFile = await FileSystem.getInfoAsync(finalUri);
    if (oldFile.exists) {
      await FileSystem.deleteAsync(finalUri, { idempotent: true });
    }
    dispatch(removeDownloadedSongInfo(video.id));
  } catch (error) {
    console.error("Error removing downloaded song:", error);
  }
}
