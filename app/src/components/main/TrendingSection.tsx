import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Video } from "@/types/song";
import { fetchTrendingSongs } from "@/actions/user";
import SongImage from "../sub/SongImage";
import SectionHeader from "../sub/SectionHeader";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { setSongAsync } from "@/redux/thunks/songThunk";
import SongCardMenu from "../sub/SongCardMenu";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.38;

interface TrendingSectionProps {
  refreshTrigger?: number;
}

const TrendingSection: React.FC<TrendingSectionProps> = ({ refreshTrigger }) => {
  const [songs, setSongs] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuSong, setMenuSong] = useState<Video | null>(null);
  const dispatch = useDispatch<AppDispatch>();

  const load = async () => {
    setLoading(true);
    const data = await fetchTrendingSongs(7, 10);
    setSongs(data);
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

  if (!loading && songs.length === 0) return null;

  return (
    <View style={styles.container}>
      <SectionHeader title="Trending Now" icon="trending-up" />

      {loading ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.card, styles.skeleton]} />
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {songs.map((song, index) => (
            <Pressable
              key={song.id}
              style={styles.card}
              onPress={() => dispatch(setSongAsync(song))}
              onLongPress={() => setMenuSong(song)}
              delayLongPress={300}
            >
              <View style={styles.imageContainer}>
                <SongImage
                  url={song.richThumbnail?.url || song.thumbnails?.at(-1)?.url || ""}
                  style={styles.image}
                />
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
              </View>
              <Text numberOfLines={1} style={styles.songTitle}>
                {song.title}
              </Text>
              <Text numberOfLines={1} style={styles.artist}>
                {song.channel?.name || "Unknown"}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {menuSong && (
        <SongCardMenu
          video={menuSong}
          visible={!!menuSong}
          onClose={() => setMenuSong(null)}
        />
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
  card: {
    width: CARD_WIDTH,
  },
  skeleton: {
    height: CARD_WIDTH + 40,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 8,
  },
  imageContainer: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 8,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  rankBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#1DB954",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rankText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#000",
  },
  songTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  artist: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
});

export default React.memo(TrendingSection);
