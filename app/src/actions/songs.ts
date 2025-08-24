import { get, post } from "@/lib/api";
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

export const getSongUrl = async (songId: string): Promise<string> => {
  try {
    const response = await get("/api/v1/playsong/", {
      songId: songId,
    });
    let url = response?.responseData?.url;
    if (url) {
      return url;
    }
    return "";
  } catch (error) {
    return "";
  }
};


