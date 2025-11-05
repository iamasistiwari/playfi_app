import { get } from "@/lib/api";
import { Video } from "@/types/song";

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
  isGetRelatedSongs: boolean,
): Promise<{
  url: string | null;
  related_songs: Video[] | null;
}> => {
  try {
    const response = await get("/api/v1/playsong/", {
      songId: songId,
      isGetRelatedSongs: isGetRelatedSongs ? 1 : 0
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
