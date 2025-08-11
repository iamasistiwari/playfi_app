import { View, Text, FlatList } from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CustomButton } from "@/components/sub/CustomButton";
import { Ionicons } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { fetchSinglePlaylist } from "@/actions/playlist";
import { Playlist } from "@/types/song";
import Loader from "@/components/sub/Loader";
import SongTile from "@/components/sub/SongTiles";

const FullPlaylistView = () => {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const fetchPlaylist = async () => {
    setLoading(true);
    const res = await fetchSinglePlaylist(id as string);
    if (res) {
      setPlaylist(res);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlaylist();
  }, []);

  if (loading) {
    return (
      <View>
        <DummyNav />
        <View className="h-[60vh] flex items-center justify-center">
          <Loader size={50} />
        </View>
      </View>
    );
  }

  if (!playlist) {
    return (
      <View>
        <DummyNav />
        <View className="h-[60vh] flex items-center justify-center">
          <Text className="text-white">Playlist not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="px-4 pt-1">
      {/* navbar part */}
      <View className="h-16 flex-row items-center justify-between">
        <CustomButton
          loading={false}
          variant={"ghost"}
          className=" p-0"
          title=""
          icon={<Ionicons name="arrow-back" size={26} color="#d4d4d4" />}
          onPress={() => router.back()}
        />
        <Text className="text-white text-2xl font-bold">
          {playlist.playlistName.length > 25
            ? playlist.playlistName.slice(0, 25) + "..."
            : playlist.playlistName}
        </Text>
        <View className="flex flex-row gap-x-6">
          <CustomButton
            loading={false}
            className=" p-0"
            variant={"ghost"}
            title=""
            icon={<Ionicons name="search" size={24} color="white" />}
          />
          <CustomButton
            loading={false}
            variant={"ghost"}
            className="p-0"
            title=""
            icon={<Ionicons name="options-outline" size={24} color="white" />}
          />
        </View>
      </View>

      {/* second bar */}
      <View className="flex-row items-center justify-between">
        <Text className="text-white text-base font-medium">
          {playlist?.songs?.length} songs
        </Text>
        <View className="flex flex-row gap-x-6">
          <CustomButton
            loading={false}
            className="text-base p-0"
            variant={"ghost"}
            title="Shuffle"
            icon={<MaterialIcons name="shuffle" size={24} color="white" />}
          />
          <CustomButton
            loading={false}
            variant={"ghost"}
            className="p-0"
            title=""
            icon={<Ionicons name="play" size={24} color="white" />}
          />
        </View>
      </View>

      {/* song list */}
      <View className="h-[60vh]">
        <FlatList
          data={playlist?.songs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SongTile data={item} key={item.id} />}
        />
      </View>
    </View>
  );
};

export default FullPlaylistView;

function DummyNav() {
  const router = useRouter();
  return (
    <View className="h-16 flex-row items-center justify-between px-4 pt-1">
      <CustomButton
        loading={false}
        variant={"ghost"}
        className=" p-0"
        title=""
        icon={<Ionicons name="arrow-back" size={26} color="#d4d4d4" />}
        onPress={() => router.back()}
      />
      <View className="flex flex-row gap-x-6">
        <CustomButton
          loading={false}
          className=" p-0"
          variant={"ghost"}
          title=""
          icon={<Ionicons name="search" size={24} color="white" />}
        />
        <CustomButton
          loading={false}
          variant={"ghost"}
          className="p-0"
          title=""
          icon={<Ionicons name="options-outline" size={24} color="white" />}
        />
      </View>
    </View>
  );
}
