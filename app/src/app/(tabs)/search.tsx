import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  Dimensions,
  Keyboard,
  RefreshControl,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import {
  addToRecentSearch,
  setLastSearchState,
  clearRecentSearch,
  removeFromRecentSearch,
} from "@/redux/song-player";
import { searchSongs } from "@/actions/songs";
import { fetchRecommendations } from "@/actions/user";
import { Video } from "@/types/song";
import SongTile from "@/components/sub/SongTiles";
import { SongLoadingSkeleton } from "@/components/sub/LoadingSkeleton";
import SongPlayer from "@/components/main/SongPlayer";
import SongImage from "@/components/sub/SongImage";
import { setSongAsync } from "@/redux/thunks/songThunk";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const GENRE_CHIPS = [
  { label: "Chill", icon: "leaf-outline" as const, color: "#4ECDC4" },
  { label: "Workout", icon: "barbell-outline" as const, color: "#FF6B6B" },
  { label: "Party", icon: "sparkles-outline" as const, color: "#FFD93D" },
  { label: "Focus", icon: "eye-outline" as const, color: "#6C5CE7" },
  { label: "Bollywood", icon: "film-outline" as const, color: "#FD79A8" },
  { label: "Pop", icon: "musical-notes-outline" as const, color: "#74B9FF" },
  { label: "Hip-Hop", icon: "mic-outline" as const, color: "#FDCB6E" },
  { label: "Rock", icon: "flash-outline" as const, color: "#E17055" },
  { label: "Lo-fi", icon: "headset-outline" as const, color: "#A29BFE" },
  { label: "Classical", icon: "musical-note-outline" as const, color: "#DFE6E9" },
];

const CHIP_WIDTH = (SCREEN_WIDTH - 48) / 2;
const REC_CARD_WIDTH = SCREEN_WIDTH * 0.42;

const SearchScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const params = useLocalSearchParams<{ query?: string }>();
  const songPlayerState = useSelector((state: RootState) => state.songPlayer);
  const lastSearchQuery = songPlayerState?.lastSearchQuery || "";
  const lastSearchResults = songPlayerState?.lastSearchResults || [];
  const recentSearches = songPlayerState?.recentSearch || [];

  const [searchQuery, setSearchQuery] = useState(lastSearchQuery);
  const [results, setResults] = useState<Video[]>(lastSearchResults);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recommendations, setRecommendations] = useState<Video[]>([]);
  const [recsLoading, setRecsLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(lastSearchResults.length > 0);
  const inputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList>(null);
  const previousQuery = useRef(lastSearchQuery);

  // Handle query param from genre chip navigation
  useEffect(() => {
    if (params.query && params.query !== searchQuery) {
      setSearchQuery(params.query);
      previousQuery.current = "";
    }
  }, [params.query]);

  // Load recommendations on mount
  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    setRecsLoading(true);
    const data = await fetchRecommendations();
    setRecommendations(data);
    setRecsLoading(false);
  };

  // Debounced search
  useEffect(() => {
    if (previousQuery.current === searchQuery) return;
    previousQuery.current = searchQuery;

    const query = searchQuery.trim();
    if (query.length > 0) {
      setLoading(true);
      setResults([]);
      setHasSearched(false);
    } else {
      setResults([]);
      setLoading(false);
      setHasSearched(false);
      dispatch(setLastSearchState({ query: "", results: [] }));
      return;
    }

    const timerId = setTimeout(() => {
      performSearch(query);
    }, 700);
    return () => clearTimeout(timerId);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setLoading(true);
    Keyboard.dismiss();
    dispatch(addToRecentSearch(query));
    const data = await searchSongs(query);
    setResults(data);
    setHasSearched(true);
    dispatch(setLastSearchState({ query, results: data }));
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    const query = searchQuery.trim();
    if (query.length > 0) {
      setRefreshing(true);
      const data = await searchSongs(query);
      setResults(data);
      dispatch(setLastSearchState({ query, results: data }));
      setRefreshing(false);
    }
  }, [searchQuery]);

  const handleGenrePress = (genre: string) => {
    const query = `${genre.toLowerCase()} music`;
    setSearchQuery(query);
    previousQuery.current = "";
  };

  const handleRecentPress = (term: string) => {
    setSearchQuery(term);
    previousQuery.current = "";
  };

  const renderSongItem = useCallback(
    ({ item }: { item: Video }) => <SongTile data={item} />,
    []
  );

  const keyExtractor = useCallback((item: Video) => item.id, []);

  const isSearchActive = searchQuery.trim().length > 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1a1a1a", "#121212", "#000000"]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Search</Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="rgba(255,255,255,0.5)" />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="What do you want to listen to?"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => {
                  setSearchQuery("");
                  setResults([]);
                  setHasSearched(false);
                  dispatch(setLastSearchState({ query: "", results: [] }));
                  inputRef.current?.focus();
                }}
              >
                <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.5)" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Content */}
        {isSearchActive ? (
          <FlatList
            ref={flatListRef}
            data={results}
            renderItem={renderSongItem}
            keyExtractor={keyExtractor}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            ListHeaderComponent={
              loading ? (
                <SongLoadingSkeleton />
              ) : hasSearched && results.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={64} color="#404040" />
                  <Text style={styles.emptyTitle}>No results found</Text>
                  <Text style={styles.emptySubtitle}>
                    Try searching with different keywords
                  </Text>
                </View>
              ) : null
            }
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#1DB954"
              />
            }
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            removeClippedSubviews
            maxToRenderPerBatch={10}
            initialNumToRender={10}
            windowSize={10}
          />
        ) : (
          <ScrollView
            style={styles.idleScrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.idleContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Searches</Text>
                  <Pressable onPress={() => dispatch(clearRecentSearch())}>
                    <Text style={styles.clearText}>Clear all</Text>
                  </Pressable>
                </View>
                <View style={styles.chipsWrap}>
                  {recentSearches.slice(0, 10).map((term, index) => (
                    <Pressable
                      key={`${term}-${index}`}
                      style={styles.recentChip}
                      onPress={() => handleRecentPress(term)}
                    >
                      <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.5)" />
                      <Text style={styles.recentChipText} numberOfLines={1}>
                        {term}
                      </Text>
                      <Pressable
                        onPress={() => dispatch(removeFromRecentSearch(index))}
                        hitSlop={8}
                      >
                        <Ionicons name="close" size={16} color="rgba(255,255,255,0.3)" />
                      </Pressable>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Browse Categories */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Browse Categories</Text>
              <View style={styles.genreGrid}>
                {GENRE_CHIPS.map((genre) => (
                  <Pressable
                    key={genre.label}
                    style={[styles.genreChip, { borderColor: `${genre.color}30` }]}
                    onPress={() => handleGenrePress(genre.label)}
                  >
                    <LinearGradient
                      colors={[`${genre.color}20`, `${genre.color}08`]}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                    <Ionicons name={genre.icon} size={20} color={genre.color} />
                    <Text style={[styles.genreChipText, { color: genre.color }]}>
                      {genre.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recommended For You</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recsScroll}
                >
                  {recommendations.map((song) => (
                    <Pressable
                      key={song.id}
                      style={styles.recCard}
                      onPress={() => dispatch(setSongAsync(song))}
                    >
                      <View style={styles.recImageContainer}>
                        <SongImage
                          url={song.richThumbnail?.url || song.thumbnails?.at(-1)?.url || ""}
                          style={styles.recImage}
                        />
                        <LinearGradient
                          colors={["transparent", "rgba(0,0,0,0.8)"]}
                          style={styles.recGradient}
                        />
                        <View style={styles.recTextOverlay}>
                          <Text numberOfLines={2} style={styles.recTitle}>
                            {song.title}
                          </Text>
                          <Text numberOfLines={1} style={styles.recArtist}>
                            {song.channel?.name || "Unknown"}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={{ height: 120 }} />
          </ScrollView>
        )}

        <SongPlayer />
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
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  idleScrollView: {
    flex: 1,
  },
  idleContent: {
    paddingBottom: 150,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
  },
  clearText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.4)",
    marginBottom: 12,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  recentChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  recentChipText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
    flexShrink: 1,
    maxWidth: SCREEN_WIDTH * 0.45,
  },
  genreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  genreChip: {
    width: CHIP_WIDTH,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 10,
    overflow: "hidden",
    borderWidth: 1,
  },
  genreChipText: {
    fontSize: 15,
    fontWeight: "600",
  },
  recsScroll: {
    gap: 12,
  },
  recCard: {
    width: REC_CARD_WIDTH,
  },
  recImageContainer: {
    width: REC_CARD_WIDTH,
    height: REC_CARD_WIDTH,
    borderRadius: 10,
    overflow: "hidden",
  },
  recImage: {
    width: "100%",
    height: "100%",
  },
  recGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
  },
  recTextOverlay: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
  },
  recTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
  },
  recArtist: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 150,
    flexGrow: 1,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.3)",
    marginTop: 8,
  },
});

export default SearchScreen;
