import { View, TextInput, Text } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import CustomInput from "../sub/CustomInput";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import RecentSongHistroy from "../sub/RecentSongHistroy";
import { VideoItem } from "@/types/song";
import useFetch from "@/hooks/useFetch";
import { searchSongs } from "@/actions/songs";
import SongTile from "../sub/SongTiles";
import { SongLoadingSkeleton } from "../sub/LoadingSkeleton";

const SongSearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data, loading, refetch } = useFetch<VideoItem[]>(() =>
    searchSongs(searchQuery)
  );
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timerId = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        inputRef.current?.blur();
        refetch();
      }
    }, 500);
    return () => clearTimeout(timerId);
  }, [searchQuery]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View>
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
      {searchQuery.length > 0 && !inputRef.current && !loading && !data && (
        <Text className="text-center text-neutral-500 mt-4 font-semibold">
          No results found
        </Text>
      )}
      {data?.length > 0 && (
        <View className="gap-5 mt-4">
          {data?.map((item, index) => (
            <SongTile data={item} key={index} />
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
