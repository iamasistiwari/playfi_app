import { View, Text } from "react-native";
import React, { useEffect, useState, useMemo } from "react";
import { CustomButton } from "./CustomButton";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { MaterialIcons } from "@expo/vector-icons";
import CustomPortal from "./CustomPortal";
import CustomMenu, { MenuItem } from "./CustomMenu";
import { changeVisiblity, deletePlaylist } from "@/actions/playlist";
import {
  fetchSinglePlaylistAsync,
  userPlaylistAsync,
} from "@/redux/thunks/playlistThunk";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import Entypo from "@expo/vector-icons/Entypo";

const PlaylistMenu = ({ playlistId }: { playlistId: string }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [makePrivatePublicDialogVisible, setMakePrivatePublicDialogVisible] =
    useState(false);
  const [playlistDetail, setPlaylistDetail] = useState<{
    isUserPlaylist: boolean;
    isGlobal: boolean;
  } | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const { userPlaylists, currentPlaylist } = useSelector(
    (state: RootState) => state.playlist
  );
  const router = useRouter();

  useEffect(() => {
    const isUserPlaylist = userPlaylists.find(
      (playlist) => playlist.id === playlistId
    );
    setPlaylistDetail({
      isUserPlaylist: Boolean(isUserPlaylist),
      isGlobal: currentPlaylist?.isGlobal,
    });
  }, [userPlaylists, playlistId]);

  const menuItems: MenuItem[] = useMemo(() => {
    if (!playlistDetail?.isUserPlaylist) return [];

    return [
      {
        title: playlistDetail?.isGlobal ? "Make Private" : "Make Public",
        onPress: () => {
          setMakePrivatePublicDialogVisible(true);
        },
        icon: playlistDetail?.isGlobal ? (
          <Entypo name="lock" size={24} color="#16a34a" />
        ) : (
          <Entypo name="globe" size={24} color="#16a34a" />
        ),
      },
      {
        title: "Delete Playlist",
        onPress: () => {
          setDeleteDialogVisible(true);
        },
        icon: <MaterialIcons name="delete" size={24} color="#16a34a" />,
      },
    ];
  }, [playlistDetail?.isUserPlaylist, playlistDetail?.isGlobal]);

  return (
    <View>
      <CustomButton
        loading={false}
        variant={"ghost"}
        className="p-0"
        title=""
        onPress={() => setMenuVisible(true)}
        icon={<Ionicons name="options-outline" size={24} color="white" />}
      />

      <CustomMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        items={menuItems}
        title="Playlist Options"
      />

      <CustomPortal
        visible={makePrivatePublicDialogVisible}
        handleClose={() => {
          setMakePrivatePublicDialogVisible(false);
        }}
        autoClose={true}
        dialogTitle={playlistDetail?.isGlobal ? "Make Private" : "Make Public"}
        onSubmit={async () => {
          await changeVisiblity(playlistId, !playlistDetail?.isGlobal);
          dispatch(
            fetchSinglePlaylistAsync({
              playlistId: currentPlaylist?.id,
              fresh: true,
            })
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }}
        dialogContent={
          <View>
            <Text className="text-white">
              {playlistDetail?.isGlobal
                ? "Are you sure you want to make this playlist private?"
                : "Are you sure you want to make this playlist public?"}
            </Text>
          </View>
        }
        actionTitle={playlistDetail?.isGlobal ? "Make Private" : "Make Public"}
        actionClassName="text-red-500"
      />

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
            await new Promise((resolve) => setTimeout(resolve, 700));
            router.back();
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
