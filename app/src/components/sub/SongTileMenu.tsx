import { View, Pressable, StyleSheet } from "react-native";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { Ionicons } from "@expo/vector-icons";
import { addSongToQueue, removeSongFromQueue } from "@/redux/song-player";
import { Video } from "@/types/song";
import { fetchSinglePlaylistAsync } from "@/redux/thunks/playlistThunk";
import { addOrRemoveSongFromPlaylist } from "@/actions/playlist";
import { handleLikeSong } from "@/redux/playlist-slice";
import SongMenuBottomSheet from "./SongMenuBottomSheet";
import PlaylistBottomSheet from "./PlaylistBottomSheet";

interface Props {
  video: Video;
}

const SongTileMenuComponent: React.FC<Props> = ({ video }: Props) => {
  const [isSongPresent, setIsSongPresent] = useState<Map<string, boolean>>(new Map());
  const [addToPlaylistDialogVisible, setaddToPlaylistDialogVisible] = useState(false);
  const [menuVisible, setmenuVisible] = useState(false);
  const [songActionLoading, setSongActionLoading] = useState<boolean[]>([]);

  const dispatch = useDispatch<AppDispatch>();

  const { queue = [] } = useSelector((state: RootState) => state.songPlayer);
  const { userPlaylists, loading, likedSongsPlaylist } = useSelector(
    (state: RootState) => state.playlist
  );

  // Memoize expensive computations
  const songInQueue = useMemo(
    () => queue.some((item) => item.id === video.id),
    [queue, video.id]
  );

  const isLiked = useMemo(
    () => likedSongsPlaylist.songs.some((item) => item.id === video.id),
    [likedSongsPlaylist.songs, video.id]
  );

  // Update song presence map only when necessary
  useEffect(() => {
    if (userPlaylists.length > 0 && !loading) {
      const map = new Map<string, boolean>();
      userPlaylists.forEach((playlist) => {
        map.set(
          playlist.id,
          playlist.songs.some((song) => song.id === video.id)
        );
      });
      setIsSongPresent(map);
      setSongActionLoading(Array(userPlaylists.length).fill(false));
    }
  }, [userPlaylists.length, loading]);

  // Memoize callbacks
  const handleMenuOpen = useCallback(() => {
    setmenuVisible(true);
  }, []);

  const handleMenuClose = useCallback(() => {
    setmenuVisible(false);
  }, []);

  const handleLike = useCallback(async () => {
    dispatch(handleLikeSong(video));
    await new Promise((resolve) => setTimeout(resolve, 100));
    setmenuVisible(false);
  }, [dispatch, video]);

  const handleQueue = useCallback(async () => {
    if (songInQueue) {
      dispatch(removeSongFromQueue(video.id));
    } else {
      dispatch(addSongToQueue(video));
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
    setmenuVisible(false);
  }, [dispatch, songInQueue, video]);

  const handleOpenPlaylistDialog = useCallback(() => {
    setaddToPlaylistDialogVisible(true);
    setmenuVisible(false);
  }, []);

  const handleClosePlaylistDialog = useCallback(() => {
    setaddToPlaylistDialogVisible(false);
  }, []);

  const handlePlaylistPress = useCallback(
    async (playlistId: string, index: number) => {
      setSongActionLoading(
        songActionLoading.map((item, i) => (i === index ? true : item))
      );
      const isPresent = isSongPresent?.get(playlistId);
      await addOrRemoveSongFromPlaylist(isPresent, playlistId, video);
      dispatch(
        fetchSinglePlaylistAsync({
          playlistId: playlistId as string,
          fresh: true,
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSongActionLoading(
        songActionLoading.map((item, i) => (i === index ? false : item))
      );
    },
    [songActionLoading, isSongPresent, video, dispatch]
  );

  const handleCreatePlaylist = useCallback(() => {
    // Implement create playlist logic
    console.log("Create playlist");
  }, []);

  return (
    <View>
      <Pressable onPress={handleMenuOpen} style={styles.menuButton}>
        <Ionicons name="ellipsis-vertical" size={28} color="#d4d4d4" />
      </Pressable>

      <SongMenuBottomSheet
        visible={menuVisible}
        onClose={handleMenuClose}
        video={video}
        isLiked={isLiked}
        songInQueue={songInQueue}
        onLike={handleLike}
        onQueue={handleQueue}
        onOpenPlaylists={handleOpenPlaylistDialog}
      />

      <PlaylistBottomSheet
        visible={addToPlaylistDialogVisible}
        onClose={handleClosePlaylistDialog}
        playlists={userPlaylists}
        songPresenceMap={isSongPresent}
        loadingStates={songActionLoading}
        onPlaylistPress={handlePlaylistPress}
        onCreatePlaylist={handleCreatePlaylist}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  menuButton: {
    paddingHorizontal: 12,
  },
});

const SongTileMenu = React.memo(
  SongTileMenuComponent,
  (prevProps, nextProps) => prevProps.video.id === nextProps.video.id
);
export default SongTileMenu;
