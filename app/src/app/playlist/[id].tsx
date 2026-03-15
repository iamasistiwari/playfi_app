import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import Loader from "@/components/sub/Loader";
import SongTile from "@/components/sub/SongTiles";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { setCurrentPlaylist } from "@/redux/playlist-slice";
import { setSongQueue } from "@/redux/song-player";
import { playNextAsync } from "@/redux/thunks/songThunk";
import { fetchSinglePlaylistAsync } from "@/redux/thunks/playlistThunk";
import PlaylistMenu from "@/components/sub/PlaylistMenu";
import SongPlayer from "@/components/main/SongPlayer";
import PlaylistMembers from "@/components/sub/PlaylistMembers";
import InviteModal from "@/components/sub/InviteModal";
import PlaylistCoverArt from "@/components/sub/PlaylistCoverArt";
import { leavePlaylist, removeUserFromPlaylist } from "@/actions/playlist";
import CustomPortal from "@/components/sub/CustomPortal";
import Toast from "react-native-toast-message";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const FullPlaylistView = () => {
  const {
    currentPlaylist: playlist,
    loading,
    likedSongsPlaylist,
  } = useSelector((state: RootState) => state.playlist);
  const { email: currentUserEmail } = useSelector(
    (state: RootState) => state.user
  );
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [playPlaylistLoading, setplayPlaylistLoading] = useState(false);
  const { currentSong } = useSelector((state: RootState) => state.songPlayer);
  const [isPlayPlaylistPressed, setIsPlayPlaylistPressed] = useState(false);
  const [inviteVisible, setInviteVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [leaveVisible, setLeaveVisible] = useState(false);
  const [removeMemberEmail, setRemoveMemberEmail] = useState<string | null>(null);

  const isAdmin = playlist?.admin?.email === currentUserEmail;
  const isMember =
    isAdmin ||
    playlist?.joined_users?.some((u) => u.email === currentUserEmail);

  useEffect(() => {
    const isPress = playlist?.songs?.some(
      (item) => item.id === currentSong?.video?.id
    );
    setIsPlayPlaylistPressed(isPress ?? false);
  }, [playlist, currentSong]);

  useEffect(() => {
    dispatch(setCurrentPlaylist(id as string));
  }, [id]);

  useEffect(() => {
    if (id === "likedSongs") {
      dispatch(setCurrentPlaylist(id as string));
    }
  }, [likedSongsPlaylist?.songs?.length]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (id !== "likedSongs") {
      await dispatch(fetchSinglePlaylistAsync({ playlistId: id as string, fresh: true }));
    } else {
      dispatch(setCurrentPlaylist(id as string));
    }
    setRefreshing(false);
  }, [id, dispatch]);

  const handleLeave = () => setLeaveVisible(true);

  const handleRemoveMember = (email: string) => setRemoveMemberEmail(email);

  // Collect cover art thumbnails
  const coverThumbnails =
    playlist?.songs
      ?.slice(0, 4)
      .map(
        (s) => s.richThumbnail?.url || s.thumbnails?.at(-1)?.url || ""
      )
      .filter(Boolean) || [];

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#1a1a1a", "#121212", "#000000"]}
          style={styles.gradient}
        >
          <DummyNav />
          <View style={styles.loadingCenter}>
            <Loader size={50} />
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (!playlist) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#1a1a1a", "#121212", "#000000"]}
          style={styles.gradient}
        >
          <DummyNav />
          <View style={styles.loadingCenter}>
            <Text style={styles.notFoundText}>Playlist not found</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1a1a1a", "#121212", "#000000"]}
        style={styles.gradient}
      >
        {/* Top Nav */}
        <View style={styles.navBar}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={26} color="#d4d4d4" />
          </Pressable>
          <View style={styles.navRight}>
            <PlaylistMenu playlistId={id as string} />
          </View>
        </View>

        {/* Header with Cover Art */}
        <FlatList
          data={playlist?.songs}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => <SongTile data={item} key={item.id} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1DB954"
            />
          }
          ListHeaderComponent={
            <View>
              {/* Cover Art & Info */}
              <View style={styles.headerSection}>
                <PlaylistCoverArt thumbnails={coverThumbnails} size={180} />
                <Text style={styles.playlistName} numberOfLines={2}>
                  {playlist.playlistName}
                </Text>
                <Text style={styles.playlistMeta}>
                  {playlist?.songs?.length} songs
                  {playlist.admin?.name ? ` · ${playlist.admin.name}` : ""}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <View style={styles.actionLeft}>
                  {isAdmin && (
                    <Pressable
                      style={styles.actionBtn}
                      onPress={() => setInviteVisible(true)}
                    >
                      <Ionicons name="person-add" size={20} color="#1DB954" />
                    </Pressable>
                  )}
                  {isMember && !isAdmin && (
                    <Pressable style={styles.actionBtn} onPress={handleLeave}>
                      <Ionicons name="exit-outline" size={20} color="#ff4444" />
                    </Pressable>
                  )}
                </View>

                <View style={styles.actionRight}>
                  <Pressable style={styles.shuffleBtn}>
                    <MaterialIcons name="shuffle" size={24} color="rgba(255,255,255,0.6)" />
                  </Pressable>
                  <Pressable
                    style={styles.playBtn}
                    onPress={async () => {
                      if (isPlayPlaylistPressed) return;
                      setplayPlaylistLoading(true);
                      dispatch(setSongQueue(playlist.songs));
                      await new Promise((resolve) => setTimeout(resolve, 1000));
                      dispatch(playNextAsync());
                      setIsPlayPlaylistPressed(true);
                      setplayPlaylistLoading(false);
                    }}
                  >
                    {playPlaylistLoading ? (
                      <Loader size={24} />
                    ) : (
                      <Ionicons
                        name={isPlayPlaylistPressed ? "pause" : "play"}
                        size={28}
                        color="#000"
                      />
                    )}
                  </Pressable>
                </View>
              </View>

              {/* Members */}
              {playlist.members && playlist.members.length > 0 && (
                <PlaylistMembers
                  members={playlist.members}
                  isAdmin={isAdmin}
                  onRemove={isAdmin ? handleRemoveMember : undefined}
                />
              )}
            </View>
          }
        />

        <SongPlayer />

        <InviteModal
          visible={inviteVisible}
          onClose={() => setInviteVisible(false)}
          playlistId={id as string}
          onInvited={() => dispatch(setCurrentPlaylist(id as string))}
        />

        <CustomPortal
          visible={leaveVisible}
          handleClose={() => setLeaveVisible(false)}
          dialogTitle="Leave Playlist"
          dialogContent={
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 15, lineHeight: 22 }}>
              Are you sure you want to leave this playlist?
            </Text>
          }
          actionTitle="Leave"
          actionClassName="text-red-500"
          onSubmit={async () => {
            const result = await leavePlaylist(id as string);
            if (result.status) {
              router.back();
            } else {
              Toast.show({ type: "error", text1: result.message });
            }
          }}
        />

        <CustomPortal
          visible={!!removeMemberEmail}
          handleClose={() => setRemoveMemberEmail(null)}
          dialogTitle="Remove Member"
          dialogContent={
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 15, lineHeight: 22 }}>
              Remove {removeMemberEmail} from this playlist?
            </Text>
          }
          actionTitle="Remove"
          actionClassName="text-red-500"
          onSubmit={async () => {
            if (removeMemberEmail) {
              await removeUserFromPlaylist(id as string, removeMemberEmail);
              dispatch(setCurrentPlaylist(id as string));
            }
          }}
        />
      </LinearGradient>
    </View>
  );
};

export default FullPlaylistView;

function DummyNav() {
  const router = useRouter();
  return (
    <View style={styles.navBar}>
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <Ionicons name="arrow-back" size={26} color="#d4d4d4" />
      </Pressable>
      <View />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  gradient: {
    flex: 1,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 8,
  },
  navRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  loadingCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notFoundText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.5)",
  },
  headerSection: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  playlistName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 6,
  },
  playlistMeta: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    marginBottom: 8,
  },
  actionLeft: {
    flexDirection: "row",
    gap: 12,
  },
  actionRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  shuffleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  playBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1DB954",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#1DB954",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 150,
  },
});
