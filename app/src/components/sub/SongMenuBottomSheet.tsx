import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Video } from "@/types/song";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type SongMenuBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  video: Video;
  isLiked: boolean;
  songInQueue: boolean;
  onLike: () => void;
  onQueue: () => void;
  onOpenPlaylists: () => void;
};

const SongMenuBottomSheet: React.FC<SongMenuBottomSheetProps> = ({
  visible,
  onClose,
  video,
  isLiked,
  songInQueue,
  onLike,
  onQueue,
  onOpenPlaylists,
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
      console.log('Pan gesture started');
    })
    .onUpdate((event) => {
      console.log('Pan update:', event.translationY);
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      console.log('Pan ended:', event.translationY, event.velocityY);
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

            {/* Song Info Header */}
            <View style={styles.header}>
              <View style={styles.songInfo}>
                <Text style={styles.songTitle} numberOfLines={1}>
                  {video.title}
                </Text>
                <Text style={styles.artistName} numberOfLines={1}>
                  {video.channel?.name || "Unknown Artist"}
                </Text>
              </View>
            </View>

            {/* Menu Items */}
            <ScrollView style={styles.menuItems}>
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  onLike();
                  onClose();
                }}
              >
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={isLiked ? "heart" : "heart-outline"}
                    size={26}
                    color={isLiked ? "#1DB954" : "#fff"}
                  />
                </View>
                <Text style={styles.menuItemText}>
                  {isLiked ? "Remove from Liked Songs" : "Add to Liked Songs"}
                </Text>
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  onQueue();
                  onClose();
                }}
              >
                <View style={styles.iconContainer}>
                  <MaterialIcons
                    name="queue-music"
                    size={26}
                    color="#fff"
                  />
                </View>
                <Text style={styles.menuItemText}>
                  {songInQueue ? "Remove from Queue" : "Add to Queue"}
                </Text>
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  onOpenPlaylists();
                  onClose();
                }}
              >
                <View style={styles.iconContainer}>
                  <MaterialIcons
                    name="playlist-add"
                    size={26}
                    color="#fff"
                  />
                </View>
                <Text style={styles.menuItemText}>Add to Playlist</Text>
              </Pressable>

              <View style={styles.separator} />

              <Pressable style={styles.menuItem} onPress={onClose}>
                <View style={styles.iconContainer}>
                  <Ionicons name="close-circle-outline" size={26} color="#fff" />
                </View>
                <Text style={styles.menuItemText}>Close</Text>
              </Pressable>
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
    minHeight: SCREEN_HEIGHT * 0.5,
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  songInfo: {
    gap: 4,
  },
  songTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  artistName: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
  },
  menuItems: {
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginVertical: 8,
  },
});

export default SongMenuBottomSheet;
