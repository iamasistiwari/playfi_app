import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { fetchUserStats, fetchRecentlyPlayed } from "@/actions/user";
import { UserStats, Video } from "@/types/song";
import SongImage from "@/components/sub/SongImage";
import SongPlayer from "@/components/main/SongPlayer";
import EditProfileModal from "@/components/sub/EditProfileModal";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { setSongAsync } from "@/redux/thunks/songThunk";
import Animated, { FadeInDown } from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const AVATAR_GRADIENTS = [
  ["#1DB954", "#169041"],
  ["#6C5CE7", "#4834D4"],
  ["#FF6B6B", "#EE5A24"],
  ["#00B894", "#00CEC9"],
  ["#FD79A8", "#E84393"],
  ["#74B9FF", "#0984E3"],
  ["#FDCB6E", "#F39C12"],
  ["#636E72", "#2D3436"],
];

const Profile = () => {
  const { name, email, bio, avatar_url } = useSelector(
    (state: RootState) => state.user
  );
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentSongs, setRecentSongs] = useState<Video[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  const loadData = async () => {
    const [statsData, recentData] = await Promise.all([
      fetchUserStats(),
      fetchRecentlyPlayed(10),
    ]);
    setStats(statsData);
    setRecentSongs(recentData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const initials = (name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const gradientIndex = avatar_url ? parseInt(avatar_url) || 0 : 0;
  const avatarColors = AVATAR_GRADIENTS[gradientIndex] || AVATAR_GRADIENTS[0];

  const STAT_ITEMS = [
    {
      icon: "musical-notes" as const,
      value: stats?.total_plays ?? "-",
      label: "Total Plays",
      gradient: ["#1DB95420", "#1DB95408"] as [string, string],
    },
    {
      icon: "time" as const,
      value: stats?.total_minutes ?? "-",
      label: "Minutes",
      gradient: ["#6C5CE720", "#6C5CE708"] as [string, string],
    },
    {
      icon: "list" as const,
      value: stats?.playlists_count ?? "-",
      label: "Playlists",
      gradient: ["#FF6B6B20", "#FF6B6B08"] as [string, string],
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[`${avatarColors[0]}30`, "#121212", "#000000"]}
        style={styles.gradient}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1DB954"
            />
          }
        >
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <LinearGradient
              colors={avatarColors as [string, string]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
            <Text style={styles.userName}>{name || "User"}</Text>
            {bio ? <Text style={styles.userBio}>{bio}</Text> : null}
            <Text style={styles.userEmail}>{email || ""}</Text>

            {/* Edit Profile Button */}
            <Pressable
              style={styles.editButton}
              onPress={() => setEditModalVisible(true)}
            >
              <Ionicons name="pencil" size={16} color="#fff" />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </Pressable>
          </View>

          {/* Stats Cards */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(100)}
            style={styles.statsRow}
          >
            {STAT_ITEMS.map((item) => (
              <View key={item.label} style={styles.statCard}>
                <LinearGradient
                  colors={item.gradient}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <Ionicons
                  name={item.icon}
                  size={20}
                  color="rgba(255,255,255,0.4)"
                  style={styles.statIcon}
                />
                <Text style={styles.statNumber}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            ))}
          </Animated.View>

          {/* Top Songs */}
          {stats?.top_songs && stats.top_songs.length > 0 && (
            <Animated.View
              entering={FadeInDown.duration(500).delay(200)}
              style={styles.section}
            >
              <Text style={styles.sectionTitle}>Top Songs</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {stats.top_songs.map((song) => (
                  <Pressable
                    key={song.id}
                    style={styles.topSongCard}
                    onPress={() => dispatch(setSongAsync(song))}
                  >
                    <View style={styles.topSongImage}>
                      <SongImage
                        url={
                          song.richThumbnail?.url ||
                          song.thumbnails?.at(-1)?.url ||
                          ""
                        }
                        style={{ width: "100%", height: "100%" }}
                      />
                    </View>
                    <Text numberOfLines={1} style={styles.topSongTitle}>
                      {song.title}
                    </Text>
                    <Text numberOfLines={1} style={styles.topSongArtist}>
                      {song.channel?.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* Recently Played List */}
          {recentSongs.length > 0 && (
            <Animated.View
              entering={FadeInDown.duration(500).delay(300)}
              style={styles.section}
            >
              <Text style={styles.sectionTitle}>Recently Played</Text>
              {recentSongs.map((song) => (
                <Pressable
                  key={song.id}
                  style={styles.recentItem}
                  onPress={() => dispatch(setSongAsync(song))}
                >
                  <View style={styles.recentImage}>
                    <SongImage
                      url={song.thumbnails?.at(-1)?.url || ""}
                      style={{ width: 48, height: 48 }}
                    />
                  </View>
                  <View style={styles.recentInfo}>
                    <Text numberOfLines={1} style={styles.recentTitle}>
                      {song.title}
                    </Text>
                    <Text numberOfLines={1} style={styles.recentArtist}>
                      {song.channel?.name || "Unknown"}
                    </Text>
                  </View>
                  <Ionicons
                    name="play-circle-outline"
                    size={28}
                    color="rgba(255,255,255,0.5)"
                  />
                </Pressable>
              ))}
            </Animated.View>
          )}
        </ScrollView>
        <SongPlayer />

        <EditProfileModal
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          onSaved={loadData}
        />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 150,
  },
  profileHeader: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 24,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "800",
    color: "#fff",
  },
  userName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  userBio: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 4,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  userEmail: {
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  statIcon: {
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 16,
  },
  horizontalScroll: {
    gap: 12,
  },
  topSongCard: {
    width: SCREEN_WIDTH * 0.35,
  },
  topSongImage: {
    width: SCREEN_WIDTH * 0.35,
    height: SCREEN_WIDTH * 0.35,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 8,
  },
  topSongTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  topSongArtist: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  recentImage: {
    width: 48,
    height: 48,
    borderRadius: 6,
    overflow: "hidden",
  },
  recentInfo: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  recentArtist: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
  },
});

export default Profile;
