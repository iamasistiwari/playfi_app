import { AppDispatch, RootState } from "@/redux/store";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, Text, View, StyleSheet, Dimensions } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { CustomButton } from "../sub/CustomButton";
import Loader from "../sub/Loader";
import LoadingSkeleton from "../sub/LoadingSkeleton";
import { usePlayer } from "@/hooks/usePlayer";
import { formatTime } from "@/lib/customfn";
import { playNextAsync } from "@/redux/thunks/songThunk";
import SongImage from "../sub/SongImage";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Easing,
  runOnJS,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SongPlayer = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { currentSong, loading } = useSelector(
    (state: RootState) => state.songPlayer
  );
  const dispatch = useDispatch<AppDispatch>();
  const {
    togglePlayPause,
    playerState: { isBuffering, position, duration, isPlaying },
    seekTo,
  } = usePlayer();

  const handleOpenSong = () => {
    if (pathname !== "/song") {
      router.push("/song");
    }
  };

  const panGesture = Gesture.Pan()
    .activeOffsetY([-15, 15])
    .failOffsetX([-30, 30])
    .onEnd((event) => {
      "worklet";
      if (event.translationY < -80 && event.velocityY < -500) {
        runOnJS(handleOpenSong)();
      }
    });

  if (pathname === "/song") return null;

  const SongPlayerLoadingSkeleton = () => {
    const shimmer = useSharedValue(0);

    useEffect(() => {
      shimmer.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
      const opacity = interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.6, 0.3]);
      return { opacity };
    });

    return (
      <>
        <View style={styles.loadingContainer}>
          {/* Album Art Skeleton */}
          <Animated.View style={[styles.loadingAlbumArt, animatedStyle]}>
            <LinearGradient
              colors={["#262626", "#404040", "#262626"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          {/* Text Skeletons */}
          <View style={styles.loadingTextContainer}>
            <Animated.View style={[styles.loadingTitle, animatedStyle]}>
              <LinearGradient
                colors={["#262626", "#404040", "#262626"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            <Animated.View style={[styles.loadingSubtitle, animatedStyle]}>
              <LinearGradient
                colors={["#262626", "#404040", "#262626"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>

          {/* Play Button Skeleton */}
          <Animated.View style={[styles.loadingButton, animatedStyle]}>
            <LinearGradient
              colors={["#262626", "#404040", "#262626"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      </>
    );
  };

  const bottomPosition = pathname.includes("/playlist")
    ? 70
    : pathname.includes("/search")
    ? 90
    : 60;

  return (
    <GestureDetector gesture={panGesture}>
      <View style={[styles.container, { bottom: bottomPosition }]}>
        <Pressable onPress={handleOpenSong} style={styles.pressableContainer}>
          <LinearGradient
            colors={["#1a1a1a", "#0a0a0a"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {/* Progress Bar - Top of player */}
            {!loading && duration > 0 && (
              <View style={styles.progressBarContainer}>
                <Animated.View
                  style={[
                    styles.progressBar,
                    { width: `${Math.min((position / duration) * 100, 100)}%` },
                  ]}
                />
              </View>
            )}

            {/* Main Content */}
            <View style={styles.mainContent}>
              {loading ? (
                <SongPlayerLoadingSkeleton />
              ) : (
                <>
                  {/* Left side - Song Info */}
                  <View style={styles.songInfoContainer}>
                    <View style={styles.albumArtContainer}>
                      <SongImage
                        url={currentSong?.video?.thumbnails?.at(-1)?.url || ""}
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 8,
                        }}
                      />
                    </View>
                    <View style={styles.textContainer}>
                      <Text numberOfLines={1} style={styles.songTitle}>
                        {currentSong?.video?.title || "No Song Playing"}
                      </Text>
                      <Text numberOfLines={1} style={styles.artistName}>
                        {currentSong?.video?.channel?.name || "Unknown Artist"}
                      </Text>
                    </View>
                  </View>

                  {/* Right side - Controls */}
                  <View style={styles.controlsContainer}>
                    {loading || isBuffering ? (
                      <Loader />
                    ) : (
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          togglePlayPause();
                        }}
                        style={styles.playButton}
                      >
                        <Ionicons
                          name={isPlaying ? "pause" : "play"}
                          size={24}
                          color="#000"
                        />
                      </Pressable>
                    )}
                  </View>
                </>
              )}
            </View>
          </LinearGradient>
        </Pressable>
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 8,
  },
  pressableContainer: {
    width: "100%",
  },
  gradient: {
    width: "100%",
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  mainContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 68,
  },
  songInfoContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  albumArtContainer: {
    width: 52,
    height: 52,
    borderRadius: 6,
    overflow: "hidden",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  songTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  artistName: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.65)",
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  progressBarContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#1DB954",
    shadowColor: "#1DB954",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  loadingAlbumArt: {
    width: 48,
    height: 48,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#262626",
  },
  loadingTextContainer: {
    flex: 1,
    gap: 8,
  },
  loadingTitle: {
    width: "70%",
    height: 14,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#262626",
  },
  loadingSubtitle: {
    width: "50%",
    height: 12,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#262626",
  },
  loadingButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#262626",
  },
});

export default SongPlayer;
