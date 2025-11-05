import { View, Text, FlatList } from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CustomButton } from "@/components/sub/CustomButton";
import { Ionicons } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Loader from "@/components/sub/Loader";
import SongTile from "@/components/sub/SongTiles";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { setCurrentPlaylist } from "@/redux/playlist-slice";
import { setSongQueue } from "@/redux/song-player";
import { playNextAsync } from "@/redux/thunks/songThunk";
import PlaylistMenu from "@/components/sub/PlaylistMenu";
import SongPlayer from "@/components/main/SongPlayer";

const FullPlaylistView = () => {
  const { currentPlaylist: playlist, loading, likedSongsPlaylist } = useSelector(
    (state: RootState) => state.playlist
  );
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [playPlaylistLoading, setplayPlaylistLoading] = useState(false);
  const { currentSong } = useSelector((state: RootState) => state.songPlayer);
  const [isPlayPlaylistPressed, setIsPlayPlaylistPressed] = useState(false);

  useEffect(() => {
    const isPress = playlist?.songs?.some(
      (item) => item.id === currentSong?.video?.id
    );
    setIsPlayPlaylistPressed(isPress);
  }, [playlist, currentSong]);

  useEffect(() => {
    dispatch(setCurrentPlaylist(id as string));
  }, [id]);

  // Re-sync currentPlaylist when likedSongsPlaylist changes (for liked songs page)
  useEffect(() => {
    if (id === "likedSongs") {
      dispatch(setCurrentPlaylist(id as string));
    }
  }, [likedSongsPlaylist.songs.length]);

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
    <View className=" pt-1 bg-primary min-h-[100vh]">
      {/* navbar part */}
      <View className="h-16 flex-row items-center justify-between px-4">
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
          <PlaylistMenu playlistId={id as string} />
        </View>
      </View>

      {/* second bar */}
      <View className="flex-row items-center justify-between px-4">
        <Text className="text-neutral-400 text-base font-medium">
          {playlist?.songs?.length} songs
        </Text>
        <View className="flex flex-row gap-x-6">
          <CustomButton
            loading={false}
            className="text-base p-0 opacity-60"
            variant={"ghost"}
            title="Shuffle"
            icon={<MaterialIcons name="shuffle" size={24} color="white" />}
          />
          <CustomButton
            loading={playPlaylistLoading}
            variant={"ghost"}
            className="p-0"
            title=""
            icon={
              isPlayPlaylistPressed ? (
                <Ionicons name="pause" size={24} color="white" />
              ) : (
                <Ionicons name="play" size={24} color="white" />
              )
            }
            onPress={async () => {
              if (isPlayPlaylistPressed) {
                return;
              }
              setplayPlaylistLoading(true);
              dispatch(setSongQueue(playlist.songs));
              await new Promise((resolve) => setTimeout(resolve, 1000));
              dispatch(playNextAsync());
              setIsPlayPlaylistPressed(true);
              setplayPlaylistLoading(false);
            }}
            onLongPress={async () => {
              setplayPlaylistLoading(true);
              dispatch(setSongQueue(playlist.songs));
              await new Promise((resolve) => setTimeout(resolve, 1000));
              dispatch(playNextAsync());
              setIsPlayPlaylistPressed(true);
              setplayPlaylistLoading(false);
            }}
          />
        </View>
      </View>

      {/* song list */}
      <View className="h-[70vh] py-4 px-3">
        <FlatList
          data={playlist?.songs}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => <SongTile data={item} key={item.id} />}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <SongPlayer />
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
