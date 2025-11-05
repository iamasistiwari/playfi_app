import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { Playlist } from "@/types/song";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type PlaylistBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  playlists: Playlist[];
  songPresenceMap: Map<string, boolean>;
  loadingStates: boolean[];
  onPlaylistPress: (playlistId: string, index: number) => void;
  onCreatePlaylist: () => void;
};

const PlaylistBottomSheet: React.FC<PlaylistBottomSheetProps> = ({
  visible,
  onClose,
  playlists,
  songPresenceMap,
  loadingStates,
  onPlaylistPress,
  onCreatePlaylist,
}) => {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, {
        damping: 30,
        stiffness: 200,
      });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const panGesture = Gesture.Pan()
    .onStart(() => {
      console.log('Playlist pan gesture started');
    })
    .onUpdate((event) => {
      console.log('Playlist pan update:', event.translationY);
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      console.log('Playlist pan ended:', event.translationY, event.velocityY);
      if (event.translationY > 100 || event.velocityY > 500) {
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
        backdropOpacity.value = withTiming(0, { duration: 200 });
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
        });
      }
    });

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.sheet, animatedStyle]}>
            <View style={styles.dragArea}>
              <View style={styles.handleBar} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Add to Playlist</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="#fff" />
              </Pressable>
            </View>

            {/* Create New Playlist Button */}
            <Pressable style={styles.createButton} onPress={onCreatePlaylist}>
              <View style={styles.createIconContainer}>
                <Ionicons name="add-circle" size={28} color="#1DB954" />
              </View>
              <Text style={styles.createButtonText}>Create New Playlist</Text>
            </Pressable>

            {/* Playlists List */}
            <ScrollView style={styles.playlistsList}>
              {playlists.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    No playlists yet. Create one!
                  </Text>
                </View>
              ) : (
                playlists.map((playlist, index) => {
                  const isPresent = songPresenceMap.get(playlist.id);
                  const isLoading = loadingStates[index];

                  return (
                    <Pressable
                      key={playlist.id}
                      style={styles.playlistItem}
                      onPress={() => onPlaylistPress(playlist.id, index)}
                      disabled={isLoading}
                    >
                      <View style={styles.playlistInfo}>
                        <Text style={styles.playlistName} numberOfLines={1}>
                          {playlist.playlistName}
                        </Text>
                        <Text style={styles.playlistCount}>
                          {playlist.songs?.length || 0} songs
                        </Text>
                      </View>

                      {isLoading ? (
                        <ActivityIndicator size="small" color="#1DB954" />
                      ) : (
                        <View style={styles.checkContainer}>
                          {isPresent ? (
                            <FontAwesome
                              name="check-circle"
                              size={24}
                              color="#1DB954"
                            />
                          ) : (
                            <Ionicons
                              name="add-circle-outline"
                              size={24}
                              color="rgba(255, 255, 255, 0.6)"
                            />
                          )}
                        </View>
                      )}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#282828",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: SCREEN_HEIGHT * 0.8,
    paddingBottom: 40,
  },
  dragArea: {
    width: "100%",
    paddingVertical: 16,
    alignItems: "center",
    paddingTop: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  closeButton: {
    padding: 4,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  createIconContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1DB954",
  },
  playlistsList: {
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
  },
  playlistItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  playlistInfo: {
    flex: 1,
    marginRight: 16,
  },
  playlistName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  playlistCount: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
  },
  checkContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default PlaylistBottomSheet;
