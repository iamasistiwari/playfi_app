import { get, put } from "@/lib/api";
import { UserProfile, UserStats, Video } from "@/types/song";

export const fetchUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const response = await get("/api/v1/user/profile");
    return response?.responseData ?? null;
  } catch (error) {
    return null;
  }
};

export const updateUserProfile = async (data: {
  name?: string;
  avatar_url?: string;
  bio?: string;
}): Promise<UserProfile | null> => {
  try {
    const response = await put("/api/v1/user/profile", data);
    return response?.responseData ?? null;
  } catch (error) {
    return null;
  }
};

export const fetchUserStats = async (): Promise<UserStats | null> => {
  try {
    const response = await get("/api/v1/user/stats");
    return response?.responseData ?? null;
  } catch (error) {
    return null;
  }
};

export const fetchRecentlyPlayed = async (
  limit: number = 20
): Promise<Video[]> => {
  try {
    const response = await get("/api/v1/recently-played", { limit });
    return response?.responseData || [];
  } catch (error) {
    return [];
  }
};

export const fetchTrendingSongs = async (
  days: number = 7,
  limit: number = 20
): Promise<Video[]> => {
  try {
    const response = await get("/api/v1/trending", { days, limit });
    return response?.responseData || [];
  } catch (error) {
    return [];
  }
};

export const fetchRecommendations = async (): Promise<Video[]> => {
  try {
    const response = await get("/api/v1/recommendations");
    return response?.responseData || [];
  } catch (error) {
    return [];
  }
};
