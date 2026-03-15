import React, { useState, useMemo, useCallback } from "react";
import { View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { addSongToQueue, removeSongFromQueue } from "@/redux/song-player";
import { setSongAsync } from "@/redux/thunks/songThunk";
import { handleLikeSong } from "@/redux/playlist-slice";
import { Video } from "@/types/song";
import CustomMenu, { MenuItem } from "./CustomMenu";
import PlaylistBottomSheet from "./PlaylistBottomSheet";
import CreatePlaylistModal from "./CreatePlaylistModal";
import { addOrRemoveSongFromPlaylist } from "@/actions/playlist";
import { fetchSinglePlaylistAsync } from "@/redux/thunks/playlistThunk";

interface SongCardMenuProps {
  video: Video;
  visible: boolean;
  onClose: () => void;
}

const SongCardMenu: React.FC<SongCardMenuProps> = ({ video, visible, onClose }) => {
  const [playlistSheetVisible, setPlaylistSheetVisible] = useState(false);
  const [createPlaylistVisible, setCreatePlaylistVisible] = useState(false);
  const [songActionLoading, setSongActionLoading] = useState<boolean[]>([]);
  const [isSongPresent, setIsSongPresent] = useState<Map<string, boolean>>(new Map());

  const dispatch = useDispatch<AppDispatch>();
  const { queue } = useSelector((state: RootState) => state.songPlayer);
  const { userPlaylists, likedSongsPlaylist } = useSelector(
    (state: RootState) => state.playlist
  );

  const songInQueue = useMemo(
    () => queue.some((item) => item.id === video.id),
    [queue, video.id]
  );

  const isLiked = useMemo(
    () => likedSongsPlaylist?.songs?.some((item) => item.id === video.id),
    [likedSongsPlaylist?.songs, video.id]
  );

  const handlePlayNow = useCallback(() => {
    dispatch(setSongAsync(video));
  }, [dispatch, video]);

  const handleQueue = useCallback(() => {
    if (songInQueue) {
      dispatch(removeSongFromQueue(video.id));
    } else {
      dispatch(addSongToQueue(video));
    }
  }, [dispatch, songInQueue, video]);

  const handleLike = useCallback(() => {
    dispatch(handleLikeSong(video));
  }, [dispatch, video]);

  const handleAddToPlaylist = useCallback(() => {
    // Build presence map
    const map = new Map<string, boolean>();
    userPlaylists.forEach((playlist) => {
      map.set(playlist.id, playlist.songs.some((song) => song.id === video.id));
    });
    setIsSongPresent(map);
    setSongActionLoading(Array(userPlaylists.length).fill(false));
    setPlaylistSheetVisible(true);
  }, [userPlaylists, video]);

  const handlePlaylistPress = useCallback(
    async (playlistId: string, index: number) => {
      setSongActionLoading((prev) =>
        prev.map((item, i) => (i === index ? true : item))
      );
      const isPresent = isSongPresent?.get(playlistId);
      await addOrRemoveSongFromPlaylist(isPresent, playlistId, video);
      dispatch(
        fetchSinglePlaylistAsync({ playlistId, fresh: true })
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSongActionLoading((prev) =>
        prev.map((item, i) => (i === index ? false : item))
      );
    },
    [isSongPresent, video, dispatch]
  );

  const menuItems: MenuItem[] = useMemo(
    () => [
      {
        title: "Play Now",
        onPress: handlePlayNow,
        icon: <Ionicons name="play-circle" size={26} color="#1DB954" />,
      },
      {
        title: songInQueue ? "Remove from Queue" : "Add to Queue",
        onPress: handleQueue,
        icon: <MaterialIcons name="queue-music" size={26} color="#fff" />,
      },
      {
        title: isLiked ? "Remove from Liked Songs" : "Add to Liked Songs",
        onPress: handleLike,
        icon: (
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={26}
            color={isLiked ? "#1DB954" : "#fff"}
          />
        ),
      },
      {
        title: "Add to Playlist",
        onPress: handleAddToPlaylist,
        icon: <MaterialIcons name="playlist-add" size={26} color="#fff" />,
      },
    ],
    [songInQueue, isLiked, handlePlayNow, handleQueue, handleLike, handleAddToPlaylist]
  );

  return (
    <View>
      <CustomMenu
        visible={visible}
        onClose={onClose}
        items={menuItems}
        title={video?.title}
      />

      <PlaylistBottomSheet
        visible={playlistSheetVisible}
        onClose={() => setPlaylistSheetVisible(false)}
        playlists={userPlaylists}
        songPresenceMap={isSongPresent}
        loadingStates={songActionLoading}
        onPlaylistPress={handlePlaylistPress}
        onCreatePlaylist={() => setCreatePlaylistVisible(true)}
      />

      <CreatePlaylistModal
        visible={createPlaylistVisible}
        onClose={() => setCreatePlaylistVisible(false)}
        onCreated={() => {
          setCreatePlaylistVisible(false);
          setPlaylistSheetVisible(false);
        }}
      />
    </View>
  );
};

export default SongCardMenu;
