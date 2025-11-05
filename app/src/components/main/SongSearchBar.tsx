import {
  View,
  TextInput,
  Text,
  FlatList,
  RefreshControl,
  Keyboard,
  Pressable,
  Animated,
} from "react-native";
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import CustomInput from "../sub/CustomInput";
import { Ionicons } from "@expo/vector-icons";
import RecentSongHistroy from "../sub/RecentSongHistroy";
import useFetch from "@/hooks/useFetch";
import { searchSongs } from "@/actions/songs";
import SongTile from "../sub/SongTiles";
import { SongLoadingSkeleton } from "../sub/LoadingSkeleton";
import { Video } from "@/types/song";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { addToRecentSearch, setLastSearchState } from "@/redux/song-player";
import SongPlayer from "./SongPlayer";

const SongSearchBar = () => {
  const dispatch = useDispatch<AppDispatch>();
  const songPlayerState = useSelector((state: RootState) => state.songPlayer);
  const lastSearchQuery = songPlayerState?.lastSearchQuery || "";
  const lastSearchResults = songPlayerState?.lastSearchResults || [];

  const [searchQuery, setSearchQuery] = useState(lastSearchQuery);
  const [refreshing, setRefreshing] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRestoringCache, setIsRestoringCache] = useState(!!lastSearchQuery);
  const { data, loading, refetch, resetData, setData } = useFetch<Video[]>(() =>
    searchSongs(searchQuery.trim())
  );
  const inputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const previousSearchQuery = useRef(lastSearchQuery);

  // Debounced search
  useEffect(() => {
    // Skip refetch if we're restoring from cache and query hasn't changed
    if (isRestoringCache && searchQuery === lastSearchQuery) {
      return;
    }

    // Skip if query hasn't actually changed
    if (previousSearchQuery.current === searchQuery) {
      return;
    }

    // Clear previous data immediately when user starts typing
    if (previousSearchQuery.current !== searchQuery && data) {
      resetData();
    }

    previousSearchQuery.current = searchQuery;

    const timerId = setTimeout(() => {
      const query = searchQuery.trim();
      if (query.length > 0) {
        inputRef.current?.blur();
        dispatch(addToRecentSearch(query));

        refetch();
      } else {
        resetData();
      }
    }, 700);
    return () => clearTimeout(timerId);
  }, [searchQuery]);

  // Initialize with last search results on mount
  useEffect(() => {
    if (!isInitialized && lastSearchResults.length > 0) {
      setData(lastSearchResults);
      setIsInitialized(true);
      // Mark cache restoration as complete after a short delay
      setTimeout(() => {
        setIsRestoringCache(false);
      }, 100);
    } else if (!lastSearchResults.length) {
      setIsRestoringCache(false);
    }
  }, []);

  // Auto-focus input on mount (only if no previous search)
  useEffect(() => {
    const timeout = setTimeout(() => {
      // Only focus if there's no previous search query
      if (!lastSearchQuery) {
        inputRef.current?.focus();
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, []);

  // Save search state to Redux whenever it changes
  useEffect(() => {
    if (data && searchQuery.trim().length > 0) {
      dispatch(
        setLastSearchState({
          query: searchQuery,
          results: data,
        })
      );
    }
  }, [data, searchQuery, dispatch]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    if (searchQuery.trim().length > 0) {
      setRefreshing(true);
      await refetch();
      setRefreshing(false);
    }
  }, [searchQuery, refetch]);

  // Handle scroll to top
  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  // Show/hide scroll to top button based on scroll position
  const handleScroll = useCallback(
    Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        setShowScrollTop(offsetY > 300);
      },
    }),
    []
  );

  // Render song item
  const renderSongItem = useCallback(
    ({ item }: { item: Video }) => <SongTile data={item} />,
    []
  );

  // Key extractor
  const keyExtractor = useCallback((item: Video) => item.id, []);

  // Item separator
  const ItemSeparator = useCallback(() => <View style={{ height: 12 }} />, []);

  // List header
  const ListHeader = useMemo(() => {
    if (loading) return <SongLoadingSkeleton />;
    if (searchQuery.length > 0 && !loading && data?.length === 0) {
      return (
        <View className="py-12">
          <Ionicons
            name="search-outline"
            size={64}
            color="#737373"
            style={{ alignSelf: "center", marginBottom: 16 }}
          />
          <Text className="text-center text-neutral-500 text-lg font-semibold">
            No results found
          </Text>
          <Text className="text-center text-neutral-600 text-sm mt-2">
            Try searching with different keywords
          </Text>
        </View>
      );
    }
    return null;
  }, [loading, searchQuery, data]);

  // List footer
  const ListFooter = useMemo(() => {
    if (data && data.length > 0) {
      return (
        <View className="py-4">
          <Text className="text-center text-neutral-600 text-sm">
            {data.length} {data.length === 1 ? "song" : "songs"} found
          </Text>
        </View>
      );
    }
    return null;
  }, [data]);

  // Empty component (for recent history)
  const EmptyComponent = useMemo(() => {
    if (!data?.length && !loading && searchQuery.length === 0) {
      return (
        <RecentSongHistroy
          onPress={(text) => {
            setSearchQuery(text);
            Keyboard.dismiss();
          }}
        />
      );
    }
    return null;
  }, [data, loading, searchQuery]);

  return (
    <View className="flex flex-col flex-1 min-h-[100vh] justify-between">
      <View className="flex-1">
        {/* Search Input */}
        <View className="px-4 py-2">
          <CustomInput
            inputRef={inputRef}
            placeholder="Search for songs"
            value={searchQuery}
            onChangeText={(text) => {
              // Clear cache restoration flag when user types
              if (isRestoringCache && text !== lastSearchQuery) {
                setIsRestoringCache(false);
              }
              setSearchQuery(text);
            }}
            icon={<Ionicons name="search-outline" size={20} color="#16a34a" />}
          />
        </View>

        {/* FlatList */}
        <FlatList
          ref={flatListRef}
          data={data || []}
          renderItem={renderSongItem}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={ItemSeparator}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          ListEmptyComponent={EmptyComponent}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 4,
            paddingBottom: 100, // Space for player
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#16a34a"
              colors={["#16a34a"]}
            />
          }
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
        />

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <Pressable
            onPress={scrollToTop}
            className="absolute bottom-28 right-6 bg-green-600 rounded-full p-3 shadow-lg"
            style={{
              elevation: 5,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
            }}
          >
            <Ionicons name="arrow-up" size={24} color="#fff" />
          </Pressable>
        )}
      </View>

      <SongPlayer />
    </View>
  );
};

export default SongSearchBar;
