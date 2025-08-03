import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import { Video } from "@/types/song";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { previousSongId, setSongAsync } from "@/redux/thunks/songThunk";
import { Menu } from "react-native-paper";
import { addSongToQueue, removeSongFromQueue } from "@/redux/song-player";
import { Portal, Dialog, Button } from "react-native-paper";

const SongTile = ({ data }: { data: Video }) => {
  const { queue } = useSelector((state: RootState) => state.songPlayer);
  const songInQueue = queue.some((item) => item.id === data.id);
  const [addToPlaylistDialogVisible, setaddToPlaylistDialogVisible] =
    useState(false);

  const [menuVisible, setmenuVisible] = useState(false);
  const translateX = useSharedValue(-20);
  const opacity = useSharedValue(0);
  const dispatch = useDispatch<AppDispatch>();

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
    translateX.value = withTiming(0, { duration: 500 });
  }, []);

  const handlePlay = () => {
    if (!(previousSongId === data.id)) {
      dispatch(setSongAsync(data));
    }
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePlay}
        className="flex flex-row items-center justify-center"
      >
        <Image
          source={{ uri: data.thumbnails?.[0]?.url }}
          className="w-[60px] h-[60px] rounded-lg"
          resizeMode="cover"
        />
        <View style={styles.infoContainer}>
          <Text numberOfLines={2} style={styles.title}>
            {data.title.slice(0, 25)}
          </Text>
          <Text style={styles.channel}>{data.channel.name}</Text>
          <Text style={styles.views}>
            {data.viewCount.short} • {data.publishedTime}
          </Text>
        </View>
        <Menu
          visible={menuVisible}
          onDismiss={() => setmenuVisible(false)}
          anchor={
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                setmenuVisible(true);
              }}
            >
              <Ionicons
                name="ellipsis-vertical"
                size={28}
                color="#d4d4d4"
                style={{ marginHorizontal: 12 }}
              />
            </Pressable>
          }
        >
          <Menu.Item
            onPress={() => {}}
            leadingIcon={() => (
              <Ionicons name="heart" size={24} color="#16a34a" />
            )}
            title="Like"
          />
          <Menu.Item
            onPress={() => {
              if (songInQueue) {
                dispatch(removeSongFromQueue(data.id));
              } else {
                dispatch(addSongToQueue(data));
              }
            }}
            leadingIcon={() => (
              <MaterialIcons name="queue-music" size={24} color="#16a34a" />
            )}
            title={songInQueue ? "Pop from Queue" : "Add to Queue"}
          />
          <Menu.Item
            onPress={() => {
              setaddToPlaylistDialogVisible(true);
              setmenuVisible(false);
            }}
            title="Add to Playlist"
          />
        </Menu>
      </Pressable>
      <Portal>
        <Dialog
          visible={addToPlaylistDialogVisible}
          onDismiss={() => setaddToPlaylistDialogVisible(false)}
        >
          <Dialog.Title>Add to Playlist</Dialog.Title>
          <Dialog.Content>
            <Text>Add this song to your playlist?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setaddToPlaylistDialogVisible(false)}>
              Cancel
            </Button>
            <Button
              onPress={() => {
                // TODO: Implement add to playlist logic
                setaddToPlaylistDialogVisible(false);
              }}
            >
              Confirm
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Animated.View>
  );
};

export default SongTile;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#121212",
    padding: 10,
    marginVertical: 6,
    marginHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    borderColor: "#fff",
  },
  thumbnail: {
    width: 100,
    height: 60,
    borderRadius: 8,
  },
  infoContainer: {
    marginLeft: 10,
    flex: 1,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  channel: {
    color: "#aaa",
    fontSize: 13,
    marginTop: 2,
  },
  views: {
    color: "#888",
    fontSize: 12,
    marginTop: 2,
  },
});
