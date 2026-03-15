import { get, post } from "@/lib/api";
import { PlayHistoryItem, Video } from "@/types/song";

export const searchSongs = async (query: string): Promise<Video[]> => {
  try {
    const response = await get("/api/v1/search/songs", {
      q: query,
    });
    const searchResult = response?.responseData || [];
    return searchResult;
  } catch (error) {
    return [];
  }
};

export const getSongUrl = async (
  songId: string,
  isGetRelatedSongs: boolean
): Promise<{
  url: string | null;
  related_songs: Video[] | null;
}> => {
  try {
    const response = await get("/api/v1/playsong/", {
      songId: songId,
      isGetRelatedSongs: isGetRelatedSongs ? 1 : 0,
    });
    let data = {
      url: response?.responseData?.url || null,
      related_songs: response?.responseData?.related_songs || null,
    };
    return data;
  } catch (error) {
    return {
      url: null,
      related_songs: null,
    };
  }
};

export const recordPlay = async (
  songId: string,
  durationListened: number,
  completed: boolean,
  songData?: Video
): Promise<boolean> => {
  try {
    const response = await post("/api/v1/song/play", {
      song_id: songId,
      duration_listened: durationListened,
      completed,
      song_data: songData || null,
    });
    return response?.responseStatus?.status || false;
  } catch (error) {
    return false;
  }
};

export const fetchPlayHistory = async (
  page: number = 1,
  pageSize: number = 20
): Promise<PlayHistoryItem[]> => {
  try {
    const response = await get("/api/v1/song/history", {
      page,
      page_size: pageSize,
    });
    return response?.responseData || [];
  } catch (error) {
    return [];
  }
};
