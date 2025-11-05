import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Dimensions,
} from "react-native";
import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { Video } from "@/types/song";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { setSongAsync } from "@/redux/thunks/songThunk";
import { LinearGradient } from "expo-linear-gradient";
import SongImage from "../sub/SongImage";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width * 0.35;

interface DownloadedSongCardProps {
  song: Video;
  onPress: () => void;
  isPlaying: boolean;
}

const DownloadedSongCard: React.FC<DownloadedSongCardProps> = ({
  song,
  onPress,
  isPlaying,
}) => {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.imageContainer}>
        <SongImage
          url={song?.richThumbnail?.url || ""}
          style={styles.thumbnail}
          contentFit="cover"
        />
        {/* Downloaded Badge */}
        <View style={styles.downloadedBadge}>
          <Ionicons name="arrow-down-circle" size={20} color="#1DB954" />
        </View>
        {/* Play Overlay */}
        {isPlaying && (
          <LinearGradient
            colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.7)"]}
            style={styles.playOverlay}
          >
            <Ionicons name="volume-high" size={28} color="#1DB954" />
          </LinearGradient>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text numberOfLines={2} style={styles.songTitle}>
          {song.title}
        </Text>
        <Text numberOfLines={1} style={styles.artistName}>
          {song.channel.name}
        </Text>
      </View>
    </Pressable>
  );
};

const DownloadedSongs = () => {
  const dispatch = useDispatch<AppDispatch>();
  const songPlayerState = useSelector((state: RootState) => state.songPlayer);

  const downloadedSongsMap = songPlayerState?.downloadedSongsMap || {};
  const currentSong = songPlayerState?.currentSong;

  // Convert map to array and sort by download time (newest first)
  const downloadedSongs = Object.values(downloadedSongsMap)
    .sort((a, b) => b.downloadedAt - a.downloadedAt)
    .map((info) => info.video);

  const handleSongPress = useCallback(
    (song: Video) => {
      dispatch(setSongAsync(song));
    },
    [dispatch]
  );

  const renderSongItem = useCallback(
    ({ item }: { item: Video }) => {
      const isPlaying = currentSong?.video?.id === item.id;
      return (
        <DownloadedSongCard
          song={item}
          onPress={() => handleSongPress(item)}
          isPlaying={isPlaying}
        />
      );
    },
    [currentSong, handleSongPress]
  );

  const keyExtractor = useCallback((item: Video) => item.id, []);

  if (downloadedSongs.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="download" size={24} color="#1DB954" />
        <Text style={styles.title}>Downloaded Songs</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{downloadedSongs.length}</Text>
        </View>
      </View>

      <FlatList
        data={downloadedSongs}
        renderItem={renderSongItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        snapToInterval={ITEM_WIDTH + 12}
        decelerationRate="fast"
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        initialNumToRender={3}
        windowSize={5}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    flex: 1,
  },
  badge: {
    backgroundColor: "rgba(29, 185, 84, 0.2)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: "#1DB954",
    fontSize: 14,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 16,
  },
  card: {
    width: ITEM_WIDTH,
  },
  imageContainer: {
    position: "relative",
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  downloadedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 16,
    padding: 4,
  },
  playOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    marginTop: 8,
    gap: 4,
  },
  songTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    lineHeight: 18,
  },
  artistName: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.6)",
  },
});

export default DownloadedSongs;
