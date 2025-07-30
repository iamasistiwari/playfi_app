import { get } from "@/lib/api";
import { VideoItem } from "@/types/song";

export const fetchRecentSongs = async () => {
  try {
    const response = await get("/api/v1/recentSongs");
    const recentSearch = response?.responseData?.recent_search;
    return recentSearch;
  } catch (error) {
    return [];
  }
};

export const searchSongs = async (query: string): Promise<VideoItem[]> => {
  try {
    const response = await get("/api/v1/search/songs/", {
      q: query,
    });
    const searchResult = response?.responseData || [];
    return searchResult;
  } catch (error) {
    return [];
  }
};
