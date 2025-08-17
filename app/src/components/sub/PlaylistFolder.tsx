import { View, Text, Pressable } from "react-native";
import React from "react";
import { Playlist } from "@/types/song";
import PhotoGrid from "./PhotoGrid";
import { useRouter } from "expo-router";

const PlaylistFolder = ({ playlist }: { playlist: Playlist }) => {
  const router = useRouter();
  const collageImages = (playlist?.songs || [])
    .map((song) => song?.thumbnails?.[0]?.url)
    .filter(Boolean)
    .slice(0, 4);

  return (
    <View className="max-w-40 items-center">
      <Pressable onPress={() => router.push(`/playlist/${playlist.id}`)}>
        <PhotoGrid collageImages={collageImages} />
      </Pressable>
      <Text className="text-neutral-400 text-sm text-center">
        {playlist.playlistName.length > 25
          ? playlist.playlistName.slice(0, 25) + "..."
          : playlist.playlistName}
      </Text>
    </View>
  );
};

export default PlaylistFolder;
