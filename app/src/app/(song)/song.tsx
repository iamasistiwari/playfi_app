import Loader from "@/components/sub/Loader";
import SongImage from "@/components/sub/SongImage";
import SongSlider from "@/components/sub/SongSlider";
import SongTileMenu from "@/components/sub/SongTileMenu";
import { usePlayer } from "@/hooks/usePlayer";
import { AppDispatch, RootState } from "@/redux/store";
import { autoFillQueueAsync, playNextAsync, playPreviousAsync, setSongAsync } from "@/redux/thunks/songThunk";
import { handleLikeSong } from "@/redux/playlist-slice";
import { toggleRepeatMode, toggleShuffle } from "@/redux/song-player";
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
  ImageBackground,
  ScrollView as RNScrollView,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";
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

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } =
  Dimensions.get("window");
const ART_SIZE = Math.min(SCREEN_WIDTH - 48, SCREEN_HEIGHT * 0.38);

const Song = () => {
  const { currentSong, loading, queue, nextSong, repeatMode, shuffleEnabled } = useSelector(
    (state: RootState) => state.songPlayer
  );
  const { likedSongsPlaylist } = useSelector(
    (state: RootState) => state.playlist
  );
  const { togglePlayPause, playerState, seekTo } = usePlayer();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const gestureTranslateY = useSharedValue(0);

  const [queueVisible, setQueueVisible] = useState(false);
  const queueTranslateY = useSharedValue(SCREEN_HEIGHT);
  const queueBackdropOpacity = useSharedValue(0);

  const upNextSong = nextSong || queue[0];

  const isLiked = likedSongsPlaylist?.songs?.some(
    (s) => s.id === currentSong?.video?.id
  );

  const openQueue = () => setQueueVisible(true);
  const closeQueue = () => setQueueVisible(false);

  // Auto-fill queue when it's empty
  useEffect(() => {
    if (queue.length === 0 && !nextSong && currentSong?.video) {
      dispatch(autoFillQueueAsync());
    }
  }, [queue.length, nextSong, currentSong?.video?.id]);

  useEffect(() => {
    if (queueVisible) {
      queueBackdropOpacity.value = withTiming(1, { duration: 300 });
      queueTranslateY.value = withSpring(0, { damping: 30, stiffness: 200 });
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
    return { transform: [{ scale }] };
  });

  // Spinning animation for album art
  const rotation = useSharedValue(0);
  useEffect(() => {
    if (playerState.isPlaying) {
      rotation.value = withTiming(rotation.value + 360, { duration: 30000 });
    }
  }, [playerState.isPlaying]);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 30, stiffness: 200 });
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

  const artUrl =
    currentSong?.video?.richThumbnail?.url ||
    currentSong?.video?.thumbnails?.at(-1)?.url ||
    "";

  return (
    <>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.container, animatedStyle]}>
          {/* Blurred background */}
          <ImageBackground
            source={{ uri: artUrl }}
            style={StyleSheet.absoluteFill}
            blurRadius={60}
          >
            <LinearGradient
              colors={[
                "rgba(0,0,0,0.5)",
                "rgba(0,0,0,0.8)",
                "rgba(0,0,0,0.95)",
              ]}
              style={StyleSheet.absoluteFill}
            />
          </ImageBackground>

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

          <RNScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.albumArtSection}>
              <View style={styles.albumArtWrapper}>
                <SongImage
                  url={artUrl}
                  style={{
                    width: ART_SIZE,
                    height: ART_SIZE,
                    borderRadius: 12,
                  }}
                />
              </View>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <View style={styles.infoText}>
                  <Text numberOfLines={2} style={styles.songTitle}>
                    {currentSong?.video?.title || "No title"}
                  </Text>
                  <Text numberOfLines={1} style={styles.artistName}>
                    {currentSong?.video?.channel?.name || "No channel"}
                  </Text>
                </View>
                <Pressable
                  style={styles.likeButton}
                  onPress={() => {
                    if (currentSong?.video) {
                      dispatch(handleLikeSong(currentSong.video));
                    }
                  }}
                >
                  <Ionicons
                    name={isLiked ? "heart" : "heart-outline"}
                    size={28}
                    color={isLiked ? "#1DB954" : "rgba(255,255,255,0.7)"}
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.sliderSection}>
              <SongSlider />
            </View>

            <View style={styles.controlsSection}>
              {/* Shuffle */}
              <Pressable
                style={styles.sideControlButton}
                onPress={() => dispatch(toggleShuffle())}
              >
                <Ionicons
                  name="shuffle"
                  size={24}
                  color={shuffleEnabled ? "#1DB954" : "rgba(255,255,255,0.5)"}
                />
              </Pressable>

              <Pressable
                style={styles.controlButton}
                onPress={() => dispatch(playPreviousAsync())}
              >
                <Ionicons name="play-skip-back" size={36} color="#fff" />
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
                  <View style={styles.playButtonBg}>
                    <Ionicons
                      name={playerState.isPlaying ? "pause" : "play"}
                      size={36}
                      color="#000"
                    />
                  </View>
                </Pressable>
              )}

              <Pressable
                style={styles.controlButton}
                onPress={() => dispatch(playNextAsync())}
              >
                <Ionicons name="play-skip-forward" size={36} color="#fff" />
              </Pressable>

              {/* Repeat */}
              <Pressable
                style={styles.sideControlButton}
                onPress={() => dispatch(toggleRepeatMode())}
              >
                <View>
                  <Ionicons
                    name="repeat"
                    size={24}
                    color={repeatMode !== 'off' ? "#1DB954" : "rgba(255,255,255,0.5)"}
                  />
                  {repeatMode === 'one' && (
                    <View style={styles.repeatOneBadge}>
                      <Text style={styles.repeatOneText}>1</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            </View>

            <View style={styles.nextSongSection}>
              <Pressable style={styles.nextSongHeader} onPress={openQueue}>
                <Ionicons
                  name="list"
                  size={18}
                  color="rgba(255, 255, 255, 0.7)"
                />
                <Text style={styles.nextSongLabel}>
                  {queue.length > 0 ? "Up Next" : "Queue"}
                </Text>
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
              {upNextSong ? (
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
              ) : (
                <Pressable style={styles.emptyQueueHint} onPress={openQueue}>
                  <Ionicons name="musical-notes-outline" size={20} color="rgba(255,255,255,0.3)" />
                  <Text style={styles.emptyQueueHintText}>
                    No songs in queue. Add songs from the menu.
                  </Text>
                </Pressable>
              )}
            </View>
          </RNScrollView>
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
    queueGestureTranslateY.value = 0;
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const dragAreaPanGesture = Gesture.Pan()
    .enabled(true)
    .activeOffsetY([-5, 5])
    .failOffsetX([-30, 30])
    .minDistance(0)
    .onUpdate((event) => {
      "worklet";
      if (event.translationY > 0) {
        queueGestureTranslateY.value = event.translationY * 0.8;
        translateY.value = event.translationY * 0.8;
      }
    })
    .onEnd((event) => {
      "worklet";
      if (event.translationY > 120 || event.velocityY > 600) {
        translateY.value = withSpring(SCREEN_HEIGHT, {
          velocity: event.velocityY,
          damping: 50,
        });
        backdropOpacity.value = withTiming(0, { duration: 200 });
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
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

          {currentSong && (
            <View style={styles.nowPlayingSection}>
              <Text style={styles.nowPlayingLabel}>Now Playing</Text>
              <View style={styles.nowPlayingCard}>
                <View style={styles.nowPlayingImageContainer}>
                  <SongImage
                    url={currentSong?.video?.thumbnails?.at(-1)?.url || ""}
                    style={{ width: 56, height: 56 }}
                  />
                  <View style={styles.nowPlayingIndicator}>
                    <Ionicons name="musical-notes" size={20} color="#1DB954" />
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
                      style={{ width: 48, height: 48 }}
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
  handleIndicator: {
    width: 36,
    height: 5,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 3,
    alignSelf: "center",
    marginTop: 8,
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
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  albumArtSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  albumArtWrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.9,
    shadowRadius: 32,
    elevation: 24,
    borderRadius: 12,
    overflow: "hidden",
  },
  infoSection: {
    paddingBottom: 8,
    paddingHorizontal: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoText: {
    flex: 1,
    marginRight: 12,
  },
  songTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  artistName: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
  },
  likeButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  sliderSection: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  controlsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  sideControlButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  controlButton: {
    width: 52,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  repeatOneBadge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: "#1DB954",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  repeatOneText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#000",
  },
  playButtonContainer: {
    width: 76,
    height: 76,
    justifyContent: "center",
    alignItems: "center",
  },
  playButtonBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  nextSongSection: {
    marginTop: 16,
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  emptyQueueHint: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 8,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  emptyQueueHintText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.4)",
    flex: 1,
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
