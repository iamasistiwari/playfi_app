import { View, Text } from "react-native";
import React, { useEffect, useState } from "react";
import { Menu } from "react-native-paper";
import { CustomButton } from "./CustomButton";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { MaterialIcons } from "@expo/vector-icons";
import CustomPortal from "./CustomPortal";
import { deletePlaylist } from "@/actions/playlist";
import { userPlaylistAsync } from "@/redux/thunks/playlistThunk";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";

const PlaylistMenu = ({ playlistId }: { playlistId: string }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [isUserPlaylist, setIsUserPlaylist] = useState(true);
  const dispatch = useDispatch<AppDispatch>();
  const { userPlaylists } = useSelector((state: RootState) => state.playlist);
  const router = useRouter()

  useEffect(() => {
    const isUserPlaylist = userPlaylists.find(
      (playlist) => playlist.id === playlistId
    );
    setIsUserPlaylist(Boolean(isUserPlaylist));
  }, [userPlaylists, playlistId]);

  return (
    <View>
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <CustomButton
            loading={false}
            variant={"ghost"}
            className="p-0"
            title=""
            onPress={() => setMenuVisible(true)}
            icon={<Ionicons name="options-outline" size={24} color="white" />}
          />
        }
      >
        {isUserPlaylist && (
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              setDeleteDialogVisible(true);
            }}
            title={"Delete Playlist"}
            leadingIcon={() => (
              <MaterialIcons name="delete" size={24} color="#16a34a" />
            )}
          />
        )}
      </Menu>

      <CustomPortal
        visible={deleteDialogVisible}
        handleClose={() => {
          setDeleteDialogVisible(false);
        }}
        dialogTitle="Delete Playlist"
        onSubmit={async () => {
          const response = await deletePlaylist(playlistId);
          if (response.status) {
            dispatch(userPlaylistAsync());
            Toast.show({
              type: "success",
              text1: "Playlist deleted successfully",
            });
            await new Promise((resolve) => setTimeout(resolve, 1000));
            router.back()
          } else {
            Toast.show({
              type: "error",
              text1: "Error deleting playlist",
            });
          }
        }}
        dialogContent={
          <View>
            <Text className="text-white">Delete Playlist</Text>
          </View>
        }
        actionTitle="Delete"
        actionClassName="text-red-500"
      />
    </View>
  );
};

export default PlaylistMenu;
