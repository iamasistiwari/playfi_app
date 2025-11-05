import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Dimensions } from "react-native";
import React, { useState, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import PlaylistTile from "../sub/PlaylistTile";
import { Playlist } from "@/types/song";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const Playlists = () => {
  const {
    globalPlaylists,
    userPlaylists: userPlaylist,
    likedSongsPlaylist,
    loading,
  } = useSelector((state: RootState) => state.playlist);

  const userPlaylists = [likedSongsPlaylist, ...userPlaylist];
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  // Split user playlists into pages of 6
  const ITEMS_PER_PAGE = 6;
  const pages: Playlist[][] = [];
  for (let i = 0; i < userPlaylists.length; i += ITEMS_PER_PAGE) {
    pages.push(userPlaylists.slice(i, i + ITEMS_PER_PAGE));
  }

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(contentOffsetX / SCREEN_WIDTH);
    setCurrentPage(page);
  };

  return (
    <View style={styles.container}>
      {/* Paginated User Playlists */}
      {userPlaylists.length > 0 && (
        <View>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {pages.map((pagePlaylists, pageIndex) => (
              <View key={pageIndex} style={[styles.page, { width: SCREEN_WIDTH }]}>
                <View style={styles.tilesContainer}>
                  {pagePlaylists.map((playlist) => (
                    <PlaylistTile key={playlist.id} playlist={playlist} />
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Pagination Dots */}
          {pages.length > 1 && (
            <View style={styles.dotsContainer}>
              {pages.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    currentPage === index && styles.activeDot,
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Made For You Section */}
      {globalPlaylists.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Made For You</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {globalPlaylists.map((playlist) => (
              <PlaylistTile key={playlist.id} playlist={playlist} isHorizontal />
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  page: {
    paddingHorizontal: 8,
  },
  tilesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1DB954",
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 16,
    paddingHorizontal: 16,
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
});

export default Playlists;
