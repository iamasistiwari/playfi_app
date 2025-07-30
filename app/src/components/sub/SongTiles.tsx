import { View, Text, Image, StyleSheet } from "react-native";
import React, { useEffect } from "react";
import { VideoItem } from "@/types/song";
import { formatSentence } from "@/lib/customfn";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const SongTile = ({ data }: { data: VideoItem }) => {
  const translateX = useSharedValue(-20);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
    translateX.value = withTiming(0, { duration: 500 });
  }, []);
  return (
    <Animated.View
      style={animatedStyle}
      className="flex flex-row items-center justify-center"
    >
      <Image
        source={{ uri: data.thumbnails?.[0]?.url }}
        className="w-[60px] h-[60px] rounded-lg"
        resizeMode="cover"
      />
      <View style={styles.infoContainer}>
        <Text numberOfLines={2} style={styles.title}>
          {formatSentence(data.title.slice(0, 25))}
        </Text>
        <Text style={styles.channel}>{data.channel.name}</Text>
        <Text style={styles.views}>
          {data.viewCount.short} • {data.publishedTime}
        </Text>
      </View>
      <Ionicons name="ellipsis-vertical" size={26} color="#d4d4d4" />
      <Ionicons
        className="mx-3"
        name="add-circle-outline"
        size={28}
        color="#16a34a"
      />
    </Animated.View>
  );
};

export default SongTile;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#121212",
    padding: 10,
    marginVertical: 6,
    marginHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    borderColor: "#fff",
  },
  thumbnail: {
    width: 100,
    height: 60,
    borderRadius: 8,
  },
  infoContainer: {
    marginLeft: 10,
    flex: 1,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  channel: {
    color: "#aaa",
    fontSize: 13,
    marginTop: 2,
  },
  views: {
    color: "#888",
    fontSize: 12,
    marginTop: 2,
  },
});
