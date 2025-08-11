import { View, Text } from "react-native";
import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import PlaylistFolder from "../sub/PlaylistFolder";

const Playlists = () => {
  const { globalPlaylists, userPlaylists, loading } = useSelector(
    (state: RootState) => state.playlist
  );

  return (
    <View>
      {/* user playlists */}

      {/* downloaded playlists */}

      {/* global playlists */}
      <View>
        {globalPlaylists.map((playlist) => {
          if (playlist.songs.length === 0) {
            return null;
          }
          return <PlaylistFolder key={playlist.id} playlist={playlist} />;
        })}
      </View>
    </View>
  );
};

export default Playlists;
