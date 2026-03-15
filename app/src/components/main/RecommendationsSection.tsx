import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Video } from "@/types/song";
import { fetchRecommendations } from "@/actions/user";
import SongImage from "../sub/SongImage";
import SectionHeader from "../sub/SectionHeader";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { setSongAsync } from "@/redux/thunks/songThunk";
import SongCardMenu from "../sub/SongCardMenu";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.42;

interface RecommendationsSectionProps {
  refreshTrigger?: number;
}

const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({ refreshTrigger }) => {
  const [songs, setSongs] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuSong, setMenuSong] = useState<Video | null>(null);
  const dispatch = useDispatch<AppDispatch>();

  const load = async () => {
    setLoading(true);
    const data = await fetchRecommendations();
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
      <SectionHeader title="Recommended" icon="sparkles" iconColor="#A29BFE" />

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
          {songs.map((song) => (
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
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.85)"]}
                  style={styles.overlay}
                />
                <View style={styles.textOverlay}>
                  <Text numberOfLines={2} style={styles.songTitle}>
                    {song.title}
                  </Text>
                  <Text numberOfLines={1} style={styles.artist}>
                    {song.channel?.name || "Unknown"}
                  </Text>
                </View>
              </View>
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
    height: CARD_WIDTH,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
  },
  imageContainer: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderRadius: 10,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
  },
  textOverlay: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
  },
  songTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
  },
  artist: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
});

export default React.memo(RecommendationsSection);
