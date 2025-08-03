import { View, Text } from "react-native";
import React from "react";
import Navbar from "@/components/main/Navbar";
import DummySearchBar from "@/components/sub/DummySearchBar";
import FadeInBox from "@/components/sub/FadeIn";
import SongPlayer from "@/components/main/SongPlayer";

const Home = () => {
  return (
    <View className="bg-primary min-h-[100vh]">
      <Navbar />
      <DummySearchBar />
    </View>
  );
};

export default Home;
