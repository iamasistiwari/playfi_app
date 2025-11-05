import { cn } from "@/lib/utils";
import { AppDispatch, RootState } from "@/redux/store";
import { setSongAsync } from "@/redux/thunks/songThunk";
import { Video } from "@/types/song";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useDispatch, useSelector } from "react-redux";
import SongTileMenu from "./SongTileMenu";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { usePlayer } from "@/hooks/usePlayer";

// Animated Equalizer Bars Component
const EqualizerBars = () => {
  const bar1Height = useSharedValue(12);
  const bar2Height = useSharedValue(16);
  const bar3Height = useSharedValue(10);

  useEffect(() => {
    bar1Height.value = withRepeat(
      withSequence(
        withTiming(16, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        withTiming(8, { duration: 400, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    bar2Height.value = withRepeat(
      withSequence(
        withTiming(20, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(12, { duration: 600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    bar3Height.value = withRepeat(
      withSequence(
        withTiming(14, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        withTiming(6, { duration: 500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const bar1Style = useAnimatedStyle(() => ({
    height: bar1Height.value,
  }));

  const bar2Style = useAnimatedStyle(() => ({
    height: bar2Height.value,
  }));

  const bar3Style = useAnimatedStyle(() => ({
    height: bar3Height.value,
  }));

  return (
    <View style={styles.equalizerContainer}>
      <Animated.View style={[styles.equalizerBar, bar1Style]} />
      <Animated.View style={[styles.equalizerBar, bar2Style]} />
      <Animated.View style={[styles.equalizerBar, bar3Style]} />
    </View>
  );
};

const SongTile = ({ data }: { data: Video }) => {
  const songPlayerState = useSelector((state: RootState) => state.songPlayer);
  const { playerState } = usePlayer();
  const translateX = useSharedValue(-20);
  const opacity = useSharedValue(0);
  const dispatch = useDispatch<AppDispatch>();

  const currentSong = songPlayerState?.currentSong;
  const downloadProgress = songPlayerState?.downloadProgress || {};
  const downloadedSongsMap = songPlayerState?.downloadedSongsMap || {};
  const activeDownloads = songPlayerState?.activeDownloads || [];

  const isCurrentSong = currentSong?.video?.id === data.id;
  const isPlaying = isCurrentSong && playerState.isPlaying;
  const isDownloaded = !!downloadedSongsMap[data.id];
  const isDownloading = activeDownloads.includes(data.id);
  const downloadProgressValue = downloadProgress[data.id] || 0;

  // Pulse animation for playing song
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (isPlaying) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
    }
  }, [isPlaying]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
    translateX.value = withTiming(0, { duration: 500 });
  }, []);

  const handlePlay = () => {
    dispatch(setSongAsync(data));
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePlay}
        style={[
          styles.container,
          isCurrentSong && styles.containerActive,
        ]}
      >
        {/* Album Art */}
        <View style={styles.imageContainer}>
          <Animated.View style={pulseStyle}>
            <Image
              source={{ uri: data?.thumbnails?.at(-1)?.url }}
              style={styles.thumbnail}
              contentFit="cover"
              transition={200}
              cachePolicy="disk"
              priority="high"
              recyclingKey={data?.thumbnails?.at(-1)?.url || ""}
            />
          </Animated.View>

          {/* Download Progress Bar */}
          {isDownloading && (
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${downloadProgressValue}%` },
                ]}
              />
            </View>
          )}

          {/* Playing Indicator Overlay */}
          {isCurrentSong && (
            <View style={styles.playingOverlay}>
              {isPlaying ? (
                <EqualizerBars />
              ) : (
                <Ionicons name="pause" size={20} color="#1DB954" />
              )}
            </View>
          )}

          {/* Downloaded Indicator */}
          {isDownloaded && !isCurrentSong && (
            <View style={styles.downloadedBadge}>
              <Ionicons name="arrow-down-circle" size={18} color="#1DB954" />
            </View>
          )}
        </View>

        {/* Song Info */}
        <View style={styles.infoContainer}>
          <Text
            numberOfLines={1}
            style={[
              styles.title,
              isCurrentSong && styles.titleActive,
            ]}
          >
            {data.title}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              styles.channel,
              isCurrentSong && styles.channelActive,
            ]}
          >
            {data.channel.name}
          </Text>
        </View>

        {/* Right Side - Playing Icon or Menu */}
        {isCurrentSong ? (
          <View style={styles.playingIconContainer}>
            <Ionicons name="volume-high" size={20} color="#1DB954" />
          </View>
        ) : null}

        <SongTileMenu video={data} />
      </Pressable>
    </Animated.View>
  );
};

export default SongTile;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 10,
  },
  containerActive: {
    backgroundColor: "rgba(29, 185, 84, 0.08)",
  },
  imageContainer: {
    position: "relative",
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 6,
  },
  playingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
  },
  equalizerContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    height: 20,
  },
  equalizerBar: {
    width: 3,
    backgroundColor: "#1DB954",
    borderRadius: 2,
  },
  bar1: {
    height: 12,
  },
  bar2: {
    height: 16,
  },
  bar3: {
    height: 10,
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  titleActive: {
    color: "#1DB954",
    fontWeight: "700",
  },
  channel: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.6)",
  },
  channelActive: {
    color: "rgba(29, 185, 84, 0.8)",
  },
  playingIconContainer: {
    marginRight: 4,
  },
  progressBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#1DB954",
  },
  downloadedBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 10,
    padding: 2,
  },
});
