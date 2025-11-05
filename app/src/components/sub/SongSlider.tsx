import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import { usePlayer } from "@/hooks/usePlayer";
import { formatTime } from "@/lib/customfn";

const SongSlider = () => {
  const {
    playerState: { position, duration },
    seekTo,
  } = usePlayer();
  const [isDragging, setIsDragging] = useState(false);
  const [tempPosition, setTempPosition] = useState(0);

  useEffect(() => {
    if (!isDragging) {
      setTempPosition(position);
    }
  }, [position, isDragging]);

  const handleValueChange = (value: number) => {
    setIsDragging(true);
    setTempPosition(value);
  };

  const handleSlidingComplete = (value: number) => {
    setIsDragging(false);
    seekTo(value);
  };

  const displayPosition = isDragging ? tempPosition : position;

  return (
    <View style={styles.container}>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={duration || 1}
        value={displayPosition}
        minimumTrackTintColor="#1DB954"
        maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
        thumbTintColor="#fff"
        tapToSeek={true}
        onValueChange={handleValueChange}
        onSlidingComplete={handleSlidingComplete}
      />
      <View style={styles.timeRow}>
        <Text style={styles.time}>{formatTime(displayPosition)}</Text>
        <Text style={styles.time}>{formatTime(duration)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 0,
    marginBottom: 0,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingHorizontal: 4,
  },
  time: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    fontWeight: "500",
  },
});

export default SongSlider;
