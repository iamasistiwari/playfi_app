import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Playlist } from "@/types/song";
import { fetchGlobalPlaylists } from "@/actions/playlist";
import SectionHeader from "../sub/SectionHeader";
import PlaylistCoverArt from "../sub/PlaylistCoverArt";
import { useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { setCurrentPlaylist } from "@/redux/playlist-slice";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.4;

interface GlobalPlaylistsSectionProps {
  refreshTrigger?: number;
}

const GlobalPlaylistsSection: React.FC<GlobalPlaylistsSectionProps> = ({
  refreshTrigger,
}) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const load = async () => {
    setLoading(true);
    const data = await fetchGlobalPlaylists();
    setPlaylists(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      load();
    }
  }, [refreshTrigger]);

  if (!loading && playlists.length === 0) return null;

  return (
    <View style={styles.container}>
      <SectionHeader title="Public Playlists" icon="globe-outline" iconColor="#74B9FF" />

      {loading ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeleton} />
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {playlists.map((playlist) => {
            const thumbnails =
              playlist.songs
                ?.slice(0, 4)
                .map(
                  (s) =>
                    s.richThumbnail?.url ||
                    s.thumbnails?.at(-1)?.url ||
                    ""
                )
                .filter(Boolean) || [];

            return (
              <Pressable
                key={playlist.id}
                style={styles.card}
                onPress={() => {
                  dispatch(setCurrentPlaylist(playlist.id));
                  router.push(`/playlist/${playlist.id}`);
                }}
              >
                <PlaylistCoverArt thumbnails={thumbnails} size={CARD_WIDTH} />
                <Text numberOfLines={1} style={styles.playlistName}>
                  {playlist.playlistName}
                </Text>
                <Text style={styles.playlistMeta}>
                  {playlist.songs?.length || 0} songs
                  {playlist.admin?.name ? ` · ${playlist.admin.name}` : ""}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  skeleton: {
    width: CARD_WIDTH,
    height: CARD_WIDTH + 40,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
  },
  card: {
    width: CARD_WIDTH,
  },
  playlistName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    marginTop: 8,
    marginBottom: 2,
  },
  playlistMeta: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
  },
});

export default React.memo(GlobalPlaylistsSection);
