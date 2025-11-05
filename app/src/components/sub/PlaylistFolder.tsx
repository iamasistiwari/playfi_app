import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import React from "react";
import { Playlist } from "@/types/song";
import PhotoGrid from "./PhotoGrid";
import { useRouter } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTAINER_PADDING = 32; // 16px on each side
const GAP = 12;
const ITEMS_PER_ROW = 3;
const CARD_WIDTH = (SCREEN_WIDTH - CONTAINER_PADDING - GAP * (ITEMS_PER_ROW - 1)) / ITEMS_PER_ROW;

const PlaylistFolder = ({ playlist }: { playlist: Playlist }) => {
  const router = useRouter();
  const collageImages = (playlist?.songs || [])
    .map((song) => song?.thumbnails?.at(-1).url)
    .filter(Boolean)
    .slice(0, 4);

  return (
    <Pressable
      style={[styles.container, { width: CARD_WIDTH }]}
      onPress={() => router.push(`/playlist/${playlist.id}`)}
      android_ripple={{ color: "rgba(255, 255, 255, 0.1)" }}
    >
      <View style={styles.imageContainer}>
        <PhotoGrid collageImages={collageImages} />
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {playlist.playlistName}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#181818",
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
  },
  imageContainer: {
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 17,
  },
});

export default PlaylistFolder;
