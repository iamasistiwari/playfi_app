import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import { usePlayer } from "@/hooks/usePlayer";
import { formatTime } from "@/lib/customfn";

const SongSlider = () => {
  const {
    playerState: { position, duration },
    seekTo,
  } = usePlayer();

  return (
    <View style={styles.container}>
      <Slider
        style={{
          width: "100%",
          height: 50,
          borderRadius: 4,
          transform: [{ scale: 1.5 }],
        }}
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

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 30,
    marginTop: 90,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -10,
  },
  time: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default SongSlider;
