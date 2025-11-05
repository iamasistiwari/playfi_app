import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import React from "react";
import { Playlist } from "@/types/song";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TILE_PADDING = 16;
const TILE_GAP = 8;
const TILES_PER_ROW = 2;
const TILE_WIDTH = (SCREEN_WIDTH - TILE_PADDING - TILE_GAP) / TILES_PER_ROW;

type PlaylistTileProps = {
  playlist: Playlist;
  isHorizontal?: boolean;
};

const PlaylistTile: React.FC<PlaylistTileProps> = ({ playlist, isHorizontal }) => {
  const router = useRouter();
  const imageUrl = playlist?.songs?.[0]?.thumbnails?.at(-1)?.url || "";
  const isLikedSongs = playlist.playlistName.toLowerCase().includes("liked") ||
                       playlist.playlistName.toLowerCase().includes("favorite");

  if (isHorizontal) {
    return (
      <Pressable
        style={styles.horizontalCard}
        onPress={() => router.push(`/playlist/${playlist.id}`)}
      >
        {isLikedSongs ? (
          <LinearGradient
            colors={["#5f27cd", "#341f97"]}
            style={styles.horizontalImage}
          >
            <Ionicons name="heart" size={80} color="#fff" />
          </LinearGradient>
        ) : (
          <Image
            source={{ uri: imageUrl }}
            style={styles.horizontalImage}
            contentFit="cover"
            transition={200}
            cachePolicy="disk"
            priority="high"
            recyclingKey={imageUrl}
          />
        )}
        <View style={styles.horizontalInfo}>
          <Text style={styles.horizontalTitle} numberOfLines={2}>
            {playlist.playlistName}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={[styles.tile, { width: TILE_WIDTH }]}
      onPress={() => router.push(`/playlist/${playlist.id}`)}
    >
      {isLikedSongs ? (
        <LinearGradient
          colors={["#5f27cd", "#341f97"]}
          style={styles.tileImage}
        >
          <Ionicons name="heart" size={32} color="#fff" />
        </LinearGradient>
      ) : (
        <Image
          source={{ uri: imageUrl }}
          style={styles.tileImage}
          contentFit="cover"
          transition={200}
          cachePolicy="disk"
          priority="high"
          recyclingKey={imageUrl}
        />
      )}
      <Text style={styles.tileTitle} numberOfLines={2}>
        {playlist.playlistName}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  tile: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 4,
    overflow: "hidden",
    height: 60,
  },
  tileImage: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  tileTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    paddingHorizontal: 12,
    lineHeight: 16,
  },
  horizontalCard: {
    width: 150,
    backgroundColor: "#181818",
    borderRadius: 8,
    overflow: "hidden",
  },
  horizontalImage: {
    width: 150,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },
  horizontalInfo: {
    padding: 12,
  },
  horizontalTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 18,
  },
});

export default PlaylistTile;
