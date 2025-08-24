import { View, Pressable, ScrollView } from "react-native";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { Menu } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import { addSongToQueue, removeSongFromQueue } from "@/redux/song-player";
import { Video } from "@/types/song";
import { CustomButton } from "./CustomButton";
import CustomPortal from "./CustomPortal";
import CreatePlaylist from "./CreatePlaylist";
import {
  fetchSinglePlaylistAsync,
  globalPlaylistAsync,
  userPlaylistAsync,
} from "@/redux/thunks/playlistThunk";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { addOrRemoveSongFromPlaylist } from "@/actions/playlist";
import { handleLikeSong } from "@/redux/playlist-slice";

interface Props {
  video: Video;
}

const CustomMenuComponent: React.FC<Props> = ({ video }: Props) => {

  const [isSongPresent, setIsSongPresent] = useState<Map<string, boolean>>();

  const { queue = [] } = useSelector((state: RootState) => state.songPlayer);

  const { userPlaylists, playlist, loading, likedSongsPlaylist } = useSelector(
    (state: RootState) => state.playlist
  );

  const songInQueue = queue.some((item) => item.id === video.id);

  const [addToPlaylistDialogVisible, setaddToPlaylistDialogVisible] =
    useState(false);

  const [renameSongDialogVisible, setRenameSongDialogVisible] = useState(false);

  const [menuVisible, setmenuVisible] = useState(false);

  const dispatch = useDispatch<AppDispatch>();

  const [songActionLoading, setSongActionLoading] = useState<boolean[]>(
    Array(userPlaylists.length).fill(false)
  );

  const isLiked = likedSongsPlaylist.songs.some((item) => item.id === video.id);

  useEffect(() => {
    if (userPlaylists.length > 0 && !loading) {
      const map: Map<string, boolean> = new Map();
      playlist.forEach((playlist) => {
        map.set(
          playlist.id,
          playlist.songs.some((song) => song.id === video.id)
        );
      });
      setIsSongPresent(map);
    }
  }, [playlist]);

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
          onPress={() => {
            dispatch(handleLikeSong(video));
          }}
          leadingIcon={() =>
            isLiked ? (
              <Ionicons name="heart" size={24} color="#ef4444" />
            ) : (
              <Ionicons name="heart-outline" size={24} color="#ef4444" />
            )
          }
          title={isLiked ? "Remove" : "Like"}
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
          title="Playlists Actions"
        />
        
      </Menu>
      {/* add to playlist dialog */}
      <CustomPortal
        visible={addToPlaylistDialogVisible}
        handleClose={() => setaddToPlaylistDialogVisible(false)}
        dialogTitle="Playlists Actions"
        dialogContent={
          <View>
            <ScrollView
              showsVerticalScrollIndicator={true}
              style={{ height: 150 }}
              indicatorStyle="white"
              persistentScrollbar={true}
            >
              {userPlaylists.map((playlist, index) => (
                <CustomButton
                  title={playlist.playlistName}
                  key={playlist.id}
                  variant={"ghost"}
                  loading={songActionLoading[index]}
                  icon={
                    isSongPresent?.get(playlist.id) ? (
                      <FontAwesome
                        name="check-circle"
                        size={24}
                        color="green"
                      />
                    ) : (
                      <Ionicons
                        name="add-circle-outline"
                        size={24}
                        color="white"
                      />
                    )
                  }
                  className="p-0 justify-start"
                  onPress={async () => {
                    setSongActionLoading(
                      songActionLoading.map((item, i) =>
                        i === index ? true : item
                      )
                    );
                    const isPresent = isSongPresent?.get(playlist.id);
                    await addOrRemoveSongFromPlaylist(
                      isPresent,
                      playlist.id,
                      video
                    );
                    dispatch(userPlaylistAsync());
                    dispatch(globalPlaylistAsync());
                    dispatch(
                      fetchSinglePlaylistAsync({
                        playlistId: playlist.id as string,
                        fresh: true,
                      })
                    );
                    setSongActionLoading(
                      songActionLoading.map((item, i) =>
                        i === index ? false : item
                      )
                    );
                  }}
                />
              ))}
            </ScrollView>
            <CreatePlaylist />
          </View>
        }
      />
    </View>
  );
};

const CustomMenu = React.memo(
  CustomMenuComponent,
  (prevProps, nextProps) => prevProps.video.id === nextProps.video.id
);
export default CustomMenu;
