import { View, ScrollView, StyleSheet } from "react-native";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import Navbar from "@/components/main/Navbar";
import DummySearchBar from "@/components/sub/DummySearchBar";
import Playlists from "@/components/main/Playlists";
import SongPlayer from "@/components/main/SongPlayer";

const Home = () => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1a1a1a", "#121212", "#000000"]}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Navbar />
          <DummySearchBar />
          <Playlists />
        </ScrollView>
        <SongPlayer />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 150,
  },
});

export default Home;
