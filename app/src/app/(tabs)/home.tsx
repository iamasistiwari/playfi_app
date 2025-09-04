import { View } from "react-native";
import React from "react";
import Navbar from "@/components/main/Navbar";
import DummySearchBar from "@/components/sub/DummySearchBar";
import Playlists from "@/components/main/Playlists";
import SongPlayer from "@/components/main/SongPlayer";

const Home = () => {
  return (
    <View className="bg-primary min-h-[100vh]">
      <Navbar />
      <DummySearchBar />
      <Playlists />
      <SongPlayer />
    </View>
  );
};

export default Home;
