import { View, ScrollView, StyleSheet, RefreshControl, Pressable, Text } from "react-native";
import React, { useCallback, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Navbar from "@/components/main/Navbar";
import Playlists from "@/components/main/Playlists";
import SongPlayer from "@/components/main/SongPlayer";
import DownloadedSongs from "@/components/main/DownloadedSongs";
import RecentlyPlayedSection from "@/components/main/RecentlyPlayedSection";
import TrendingSection from "@/components/main/TrendingSection";
import RecommendationsSection from "@/components/main/RecommendationsSection";
import GlobalPlaylistsSection from "@/components/main/GlobalPlaylistsSection";

const GENRE_CHIPS = [
  { label: "Chill", query: "chill lo-fi music", color: "#4ECDC4" },
  { label: "Workout", query: "workout gym music", color: "#FF6B6B" },
  { label: "Focus", query: "focus study music", color: "#6C5CE7" },
  { label: "Party", query: "party dance music", color: "#FFD93D" },
  { label: "Bollywood", query: "bollywood hits", color: "#FD79A8" },
  { label: "Hip Hop", query: "hip hop rap music", color: "#00B894" },
  { label: "Classical", query: "classical instrumental", color: "#74B9FF" },
  { label: "Devotional", query: "devotional bhajan", color: "#FDCB6E" },
];

const Home = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const router = useRouter();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshTrigger((t) => t + 1);
    setRefreshing(false);
  }, []);

  const handleGenrePress = (query: string) => {
    router.push({
      pathname: "/(tabs)/search",
      params: { query },
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1a1a1a", "#121212", "#000000"]}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1DB954"
              colors={["#1DB954"]}
            />
          }
        >
          <Navbar />

          {/* Genre Quick Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.genreChipsContainer}
          >
            {GENRE_CHIPS.map((genre) => (
              <Pressable
                key={genre.label}
                style={[styles.genreChip, { backgroundColor: `${genre.color}18` }]}
                onPress={() => handleGenrePress(genre.query)}
              >
                <Text style={[styles.genreChipText, { color: genre.color }]}>
                  {genre.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <RecentlyPlayedSection refreshTrigger={refreshTrigger} />
          <RecommendationsSection refreshTrigger={refreshTrigger} />
          <Playlists />
          <GlobalPlaylistsSection refreshTrigger={refreshTrigger} />
          <TrendingSection refreshTrigger={refreshTrigger} />
          <DownloadedSongs />
        </ScrollView>
        <SongPlayer />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 150,
  },
  genreChipsContainer: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  genreChip: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  genreChipText: {
    fontSize: 13,
    fontWeight: "700",
  },
});

export default Home;
