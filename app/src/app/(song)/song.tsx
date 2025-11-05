import { CustomButton } from "@/components/sub/CustomButton";
import Loader from "@/components/sub/Loader";
import SongImage from "@/components/sub/SongImage";
import SongSlider from "@/components/sub/SongSlider";
import SongTileMenu from "@/components/sub/SongTileMenu";
import { usePlayer } from "@/hooks/usePlayer";
import { AppDispatch, RootState } from "@/redux/store";
import { playNextAsync, setSongAsync } from "@/redux/thunks/songThunk";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  Modal,
} from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView, ScrollView } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { useDispatch, useSelector } from "react-redux";
import { LinearGradient } from "expo-linear-gradient";
import { Video } from "@/types/song";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const Song = () => {
  const { currentSong, loading, queue, nextSong } = useSelector(
    (state: RootState) => state.songPlayer
  );
  const { togglePlayPause, playerState, seekTo } = usePlayer();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const gestureTranslateY = useSharedValue(0);

  // Queue overlay state
  const [queueVisible, setQueueVisible] = useState(false);
  const queueTranslateY = useSharedValue(SCREEN_HEIGHT);
  const queueBackdropOpacity = useSharedValue(0);

  // Get the next song from queue if nextSong is not set
  const upNextSong = nextSong || queue[0];

  const openQueue = () => {
    setQueueVisible(true);
  };

  const closeQueue = () => {
    setQueueVisible(false);
  };

  useEffect(() => {
    if (queueVisible) {
      queueBackdropOpacity.value = withTiming(1, { duration: 300 });
      queueTranslateY.value = withSpring(0, {
        damping: 30,
        stiffness: 200,
      });
    } else {
      queueBackdropOpacity.value = withTiming(0, { duration: 200 });
      queueTranslateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
    }
  }, [queueVisible]);

  const handleDismiss = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/home");
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value + gestureTranslateY.value }],
  }));

  const handleIndicatorStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      gestureTranslateY.value,
      [0, 50],
      [1, 1.2],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ scale }],
    };
  });

  useEffect(() => {
    translateY.value = withSpring(0, {
      damping: 30,
      stiffness: 200,
    });
  }, []);

  const panGesture = Gesture.Pan()
    .activeOffsetY([-5, 5])
    .failOffsetX([-30, 30])
    .onUpdate((event) => {
      if (event.translationY > 0) {
        gestureTranslateY.value = event.translationY * 0.8;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 120 || event.velocityY > 600) {
        gestureTranslateY.value = withSpring(SCREEN_HEIGHT, {
          velocity: event.velocityY,
          damping: 50,
        });
        runOnJS(handleDismiss)();
      } else {
        gestureTranslateY.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
        });
      }
    });

  return (
    <>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.container, animatedStyle]}>
          <LinearGradient
            colors={["#2a2a2a", "#121212", "#000000"]}
            style={styles.gradient}
          >
            <Animated.View
              style={[styles.handleIndicator, handleIndicatorStyle]}
            />

            <View style={styles.header}>
              <Pressable style={styles.headerButton} onPress={handleDismiss}>
                <Ionicons name="chevron-down" size={30} color="#fff" />
              </Pressable>
              <Text style={styles.headerTitle}>Now Playing</Text>
              <View style={styles.menuButton}>
                <SongTileMenu video={currentSong?.video} />
              </View>
            </View>

            <View style={styles.content}>
              <View style={styles.albumArtSection}>
                <View style={styles.albumArtWrapper}>
                  <SongImage
                    url={currentSong?.image_url}
                    width={320}
                    height={320}
                  />
                </View>
              </View>

              <View style={styles.infoSection}>
                <Text numberOfLines={2} style={styles.songTitle}>
                  {currentSong?.video?.title || "No title"}
                </Text>
                <Text numberOfLines={1} style={styles.artistName}>
                  {currentSong?.video?.channel?.name || "No channel"}
                </Text>
              </View>

              <View style={styles.sliderSection}>
                <SongSlider />
              </View>

              <View style={styles.controlsSection}>
                <Pressable
                  style={styles.controlButton}
                  onPress={() => seekTo(0)}
                >
                  <Ionicons name="play-skip-back" size={42} color="#fff" />
                </Pressable>

                {loading || playerState.isBuffering ? (
                  <View style={styles.playButtonContainer}>
                    <Loader size={50} />
                  </View>
                ) : (
                  <Pressable
                    style={styles.playButtonContainer}
                    onPress={togglePlayPause}
                  >
                    <Ionicons
                      name={
                        playerState.isPlaying ? "pause-circle" : "play-circle"
                      }
                      size={85}
                      color="#fff"
                    />
                  </Pressable>
                )}

                <Pressable
                  style={styles.controlButton}
                  onPress={() => dispatch(playNextAsync())}
                >
                  <Ionicons name="play-skip-forward" size={42} color="#fff" />
                </Pressable>
              </View>

              {/* Next Song Section */}
              {upNextSong && (
                <View style={styles.nextSongSection}>
                  <Pressable style={styles.nextSongHeader} onPress={openQueue}>
                    <Ionicons
                      name="list"
                      size={18}
                      color="rgba(255, 255, 255, 0.7)"
                    />
                    <Text style={styles.nextSongLabel}>Up Next</Text>
                    <View style={styles.queueCount}>
                      <Text style={styles.queueCountText}>{queue.length}</Text>
                    </View>
                    <View style={{ flex: 1 }} />
                    <Ionicons
                      name="chevron-up"
                      size={20}
                      color="rgba(255, 255, 255, 0.5)"
                    />
                  </Pressable>
                  <Pressable
                    style={styles.nextSongContainer}
                    onPress={() => dispatch(playNextAsync())}
                  >
                    <View style={styles.nextSongImageContainer}>
                      <SongImage
                        url={upNextSong?.thumbnails?.at(-1)?.url || ""}
                        width={48}
                        height={48}
                      />
                      <View style={styles.nextSongOverlay}>
                        <Ionicons name="play" size={16} color="#fff" />
                      </View>
                    </View>
                    <View style={styles.nextSongInfo}>
                      <Text numberOfLines={1} style={styles.nextSongTitle}>
                        {upNextSong?.title || "Unknown"}
                      </Text>
                      <Text numberOfLines={1} style={styles.nextSongArtist}>
                        {upNextSong?.channel?.name || "Unknown Artist"}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="rgba(255, 255, 255, 0.5)"
                    />
                  </Pressable>
                </View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>
      </GestureDetector>

      {/* Queue Bottom Sheet */}
      <QueueBottomSheet
        visible={queueVisible}
        onClose={closeQueue}
        queue={queue}
        currentSong={currentSong}
        translateY={queueTranslateY}
        backdropOpacity={queueBackdropOpacity}
        onSongPress={(song) => {
          dispatch(setSongAsync(song));
          closeQueue();
        }}
      />
    </>
  );
};

// Queue Bottom Sheet Component
type QueueBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  queue: Video[];
  currentSong: any;
  translateY: Animated.SharedValue<number>;
  backdropOpacity: Animated.SharedValue<number>;
  onSongPress: (song: Video) => void;
};

const QueueBottomSheet: React.FC<QueueBottomSheetProps> = ({
  visible,
  onClose,
  queue,
  currentSong,
  translateY,
  backdropOpacity,
  onSongPress,
}) => {
  const queueGestureTranslateY = useSharedValue(0);
  const scrollViewRef = React.useRef(null);

  useEffect(() => {
    if (visible) {
      // Reset gesture value when opening
      queueGestureTranslateY.value = 0;
    } else {
      // Reset gesture value when closing
      queueGestureTranslateY.value = 0;
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // Separate gestures for drag area and content
  const dragAreaPanGesture = Gesture.Pan()
    .enabled(true)
    .activeOffsetY([-5, 5])
    .failOffsetX([-30, 30])
    .minDistance(0)
    .onUpdate((event) => {
      'worklet';
      // Only allow downward drag (closing)
      if (event.translationY > 0) {
        queueGestureTranslateY.value = event.translationY * 0.8;
        translateY.value = event.translationY * 0.8;
      }
    })
    .onEnd((event) => {
      'worklet';
      if (event.translationY > 120 || event.velocityY > 600) {
        translateY.value = withSpring(SCREEN_HEIGHT, {
          velocity: event.velocityY,
          damping: 50,
        });
        backdropOpacity.value = withTiming(0, { duration: 200 });
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
        });
      }
      queueGestureTranslateY.value = 0;
    });

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.queueModalContainer}>
        <Animated.View style={[styles.queueBackdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.queueSheet, animatedStyle]}>
          <GestureDetector gesture={dragAreaPanGesture}>
            <View style={styles.queueDragArea}>
              <View style={styles.queueHandleBar} />
            </View>
          </GestureDetector>

          {/* Header */}
          <GestureDetector gesture={dragAreaPanGesture}>
            <View style={styles.queueHeader}>
              <View style={styles.queueHeaderLeft}>
                <Ionicons name="list" size={24} color="#fff" />
                <Text style={styles.queueHeaderTitle}>Queue</Text>
                <View style={styles.queueHeaderCount}>
                  <Text style={styles.queueHeaderCountText}>
                    {queue.length}
                  </Text>
                </View>
              </View>
              <Pressable onPress={onClose} style={styles.queueCloseButton}>
                <Ionicons name="close" size={28} color="#fff" />
              </Pressable>
            </View>
          </GestureDetector>

          {/* Current Song */}
          {currentSong && (
            <View style={styles.nowPlayingSection}>
              <Text style={styles.nowPlayingLabel}>Now Playing</Text>
              <View style={styles.nowPlayingCard}>
                <View style={styles.nowPlayingImageContainer}>
                  <SongImage
                    url={currentSong?.image_url}
                    width={56}
                    height={56}
                  />
                  <View style={styles.nowPlayingIndicator}>
                    <Ionicons
                      name="musical-notes"
                      size={20}
                      color="#1DB954"
                    />
                  </View>
                </View>
                <View style={styles.nowPlayingInfo}>
                  <Text numberOfLines={1} style={styles.nowPlayingTitle}>
                    {currentSong?.video?.title || "Unknown"}
                  </Text>
                  <Text numberOfLines={1} style={styles.nowPlayingArtist}>
                    {currentSong?.video?.channel?.name || "Unknown Artist"}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Queue List */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.queueList}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            bounces={true}
          >
            <Text style={styles.queueListLabel}>Up Next</Text>
            {queue.length === 0 ? (
              <View style={styles.emptyQueue}>
                <Ionicons
                  name="musical-notes-outline"
                  size={48}
                  color="rgba(255, 255, 255, 0.3)"
                />
                <Text style={styles.emptyQueueText}>No songs in queue</Text>
              </View>
            ) : (
              queue.map((song, index) => (
                <Pressable
                  key={`${song.id}-${index}`}
                  style={styles.queueItem}
                  onPress={() => onSongPress(song)}
                >
                  <Text style={styles.queueItemNumber}>{index + 1}</Text>
                  <View style={styles.queueItemImageContainer}>
                    <SongImage
                      url={song?.thumbnails?.at(-1)?.url || ""}
                      width={48}
                      height={48}
                    />
                  </View>
                  <View style={styles.queueItemInfo}>
                    <Text numberOfLines={1} style={styles.queueItemTitle}>
                      {song?.title || "Unknown"}
                    </Text>
                    <Text numberOfLines={1} style={styles.queueItemArtist}>
                      {song?.channel?.name || "Unknown Artist"}
                    </Text>
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
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
  handleIndicator: {
    width: 36,
    height: 5,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 3,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 60,
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    opacity: 0.9,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  albumArtSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  albumArtWrapper: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 24,
    borderRadius: 8,
    overflow: "hidden",
  },
  infoSection: {
    paddingBottom: 10,
    paddingHorizontal: 4,
  },
  songTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  artistName: {
    fontSize: 18,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
  },
  sliderSection: {
    paddingTop: 15,
    paddingBottom: 10,
  },
  controlsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  controlButton: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  playButtonContainer: {
    width: 90,
    height: 90,
    justifyContent: "center",
    alignItems: "center",
  },
  nextSongSection: {
    marginTop: 24,
    paddingHorizontal: 4,
  },
  nextSongHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  nextSongLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  nextSongContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 8,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  nextSongImageContainer: {
    position: "relative",
  },
  nextSongOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
  },
  nextSongInfo: {
    flex: 1,
    justifyContent: "center",
  },
  nextSongTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  nextSongArtist: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.6)",
  },
  queueCount: {
    backgroundColor: "#1DB954",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  queueCountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#000",
  },
  // Queue Bottom Sheet Styles
  queueModalContainer: {
    flex: 1,
  },
  queueBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  queueSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.85,
    paddingBottom: 40,
    display: "flex",
    flexDirection: "column",
  },
  queueDragArea: {
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
    flexShrink: 0,
  },
  queueHandleBar: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
  },
  queueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    flexShrink: 0,
  },
  queueHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  queueHeaderTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
  },
  queueHeaderCount: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  queueHeaderCountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  queueCloseButton: {
    padding: 4,
  },
  nowPlayingSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    flexShrink: 0,
  },
  nowPlayingLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.6)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  nowPlayingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(29, 185, 84, 0.1)",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(29, 185, 84, 0.3)",
  },
  nowPlayingImageContainer: {
    position: "relative",
    marginRight: 12,
  },
  nowPlayingIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
  },
  nowPlayingInfo: {
    flex: 1,
  },
  nowPlayingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  nowPlayingArtist: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
  },
  queueList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  queueListLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.6)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 12,
  },
  emptyQueue: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyQueueText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: 12,
  },
  queueItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  queueItemNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.5)",
    width: 24,
    textAlign: "center",
  },
  queueItemImageContainer: {
    borderRadius: 4,
    overflow: "hidden",
  },
  queueItemInfo: {
    flex: 1,
  },
  queueItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  queueItemArtist: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.6)",
  },
});

export default Song;
