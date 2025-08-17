import { View, Text, ScrollView } from "react-native";
import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import PlaylistFolder from "../sub/PlaylistFolder";

const Playlists = () => {
  const { globalPlaylists, userPlaylists, loading } = useSelector(
    (state: RootState) => state.playlist
  );

  if (loading) {
    return <Text className="text-white text-xl">Loading......</Text>;
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} className="max-h-[60vh] p-4">
      {[
        {
          id: 1,
          playlistName: "User Playlists",
          playlists: userPlaylists,
        },
        // {
        //   id: 2,
        //   playlistName: "Downloaded Playlists",
        //   playlists: [],
        // },
        {
          id: 3,
          playlistName: "Global Playlists",
          playlists: globalPlaylists,
        },
      ].map((item) => (
        <View className="gap-1 mt-4" key={item.id}>
          <Text className="text-white text-xl font-semibold">
            {item.playlistName}
          </Text>
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10 }}
          >
            {item.playlists.map((playlist) => {
              if (playlist.songs.length === 0) {
                return null;
              }
              return <PlaylistFolder key={playlist.id} playlist={playlist} />;
            })}
          </ScrollView>
        </View>
      ))}
    </ScrollView>
  );
};

export default Playlists;
