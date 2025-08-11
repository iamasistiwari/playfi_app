import { View, Text, Pressable } from "react-native";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { Menu } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import { addSongToQueue, removeSongFromQueue } from "@/redux/song-player";
import { Video } from "@/types/song";
import { Portal, Dialog, Button } from "react-native-paper";

const CustomMenu = ({ video }: { video: Video }) => {
  const { queue } = useSelector((state: RootState) => state.songPlayer);

  const songInQueue = queue.some((item) => item.id === video.id);
  const [addToPlaylistDialogVisible, setaddToPlaylistDialogVisible] =
    useState(false);

  const [menuVisible, setmenuVisible] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  return (
    <View>
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
              dispatch(removeSongFromQueue(video.id));
            } else {
              dispatch(addSongToQueue(video));
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
          leadingIcon={() => (
            <MaterialIcons name="playlist-add" size={24} color="#16a34a" />
          )}
          title="Add to Playlist"
        />
      </Menu>
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
    </View>
  );
};

export default CustomMenu;
