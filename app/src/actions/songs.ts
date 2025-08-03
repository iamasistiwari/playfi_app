import { get } from "@/lib/api";
import { Video } from "@/types/song";
import { AxiosError } from "axios";

export const fetchRecentSongs = async () => {
  try {
    const response = await get("/api/v1/recentSongs");
    const recentSearch = response?.responseData?.recent_search;
    return recentSearch;
  } catch (error) {
    return [];
  }
};

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
