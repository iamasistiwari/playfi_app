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

export const getSongUrl = async (
  songId: string
): Promise<{
  url: string | null;
  image_url: string | null;
}> => {
  try {
    const response = await get("/api/v1/playsong/", {
      songId: songId,
    });
    let data = {
      url: response?.responseData?.url || null,
      image_url: response?.responseData?.image_url || null,
    };
    return data;
  } catch (error) {
    return {
      url: null,
      image_url: null,
    };
  }
};
