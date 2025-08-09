import { View, TextInput, Text } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import CustomInput from "../sub/CustomInput";
import { Ionicons } from "@expo/vector-icons";
import RecentSongHistroy from "../sub/RecentSongHistroy";
import useFetch from "@/hooks/useFetch";
import { searchSongs } from "@/actions/songs";
import SongTile from "../sub/SongTiles";
import { SongLoadingSkeleton } from "../sub/LoadingSkeleton";
import { Video } from "@/types/song";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { addToRecentSearch } from "@/redux/song-player";

const SongSearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data, loading, refetch } = useFetch<Video[]>(() =>
    searchSongs(searchQuery.trim())
  );
  const dispatch = useDispatch<AppDispatch>();
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timerId = setTimeout(() => {
      const query = searchQuery.trim();
      if (query.length > 0) {
        inputRef.current?.blur();
        dispatch(addToRecentSearch(query));
        refetch();
      }
    }, 700);
    return () => clearTimeout(timerId);
  }, [searchQuery]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View className="px-4">
      <CustomInput
        inputRef={inputRef}
        placeholder="Search for songs"
        value={searchQuery}
        onChangeText={(text) => {
          setSearchQuery(text);
        }}
        icon={<Ionicons name="search-outline" size={20} color="#16a34a" />}
      />
      {loading && <SongLoadingSkeleton />}
      {searchQuery.length > 0 && !loading && data?.length < 1 && (
        <Text className="text-center text-neutral-500 mt-4 font-semibold">
          No results found
        </Text>
      )}
      {!loading && data?.length > 0 && (
        <View className="gap-6 mt-8">
          {data?.map((item) => (
            <SongTile data={item} key={`${item?.id}`} />
          ))}
        </View>
      )}
      {/* Song History List */}
      {!data?.length && !loading && searchQuery.length < 1 && (
        <RecentSongHistroy onPress={(text) => setSearchQuery(text)} />
      )}
    </View>
  );
};

export default SongSearchBar;
