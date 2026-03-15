import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import SongImage from "./SongImage";

interface PlaylistCoverArtProps {
  thumbnails: string[];
  size?: number;
}

const PlaylistCoverArt: React.FC<PlaylistCoverArtProps> = ({
  thumbnails,
  size = 200,
}) => {
  const halfSize = size / 2;

  if (thumbnails.length === 0) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <LinearGradient
          colors={["#2a2a2a", "#1a1a1a"]}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons name="musical-notes" size={size * 0.35} color="rgba(255,255,255,0.2)" />
      </View>
    );
  }

  if (thumbnails.length === 1) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <SongImage url={thumbnails[0]} style={{ width: size, height: size }} />
      </View>
    );
  }

  // 2x2 collage (fill missing slots with gradient)
  const slots = [
    thumbnails[0] || null,
    thumbnails[1] || null,
    thumbnails[2] || null,
    thumbnails[3] || null,
  ];

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={styles.row}>
        {slots.slice(0, 2).map((url, i) =>
          url ? (
            <SongImage
              key={i}
              url={url}
              style={{ width: halfSize, height: halfSize }}
            />
          ) : (
            <LinearGradient
              key={i}
              colors={["#2a2a2a", "#1a1a1a"]}
              style={{ width: halfSize, height: halfSize }}
            />
          )
        )}
      </View>
      <View style={styles.row}>
        {slots.slice(2, 4).map((url, i) =>
          url ? (
            <SongImage
              key={i + 2}
              url={url}
              style={{ width: halfSize, height: halfSize }}
            />
          ) : (
            <LinearGradient
              key={i + 2}
              colors={["#2a2a2a", "#1a1a1a"]}
              style={{ width: halfSize, height: halfSize }}
            />
          )
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
  },
});

export default PlaylistCoverArt;
