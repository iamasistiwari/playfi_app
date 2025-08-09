import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import { usePlayer } from "@/hooks/usePlayer";

const SongSlider = () => {
  const {
    playerState: { position, duration },
    seekTo,
  } = usePlayer();

  return (
    <View style={styles.container}>
      <Slider
        style={{ width: "100%", height: 50, borderRadius: 4 }}
        minimumValue={0}
        maximumValue={duration}
        value={position}
        minimumTrackTintColor="#1DB954"
        maximumTrackTintColor="#888"
        thumbTintColor="#fff"
        onSlidingComplete={(value) => {
          seekTo(value);
        }}
      />
      <View style={styles.timeRow}>
        <Text style={styles.time}>{formatTime(position)}</Text>
        <Text style={styles.time}>{formatTime(duration)}</Text>
      </View>
    </View>
  );
};

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -8,
  },
  time: {
    color: "#fff",
    fontSize: 14,
  },
});

export default SongSlider;
