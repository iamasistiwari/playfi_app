import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import React, { useEffect } from "react";
import { Video } from "@/types/song";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { setSongAsync } from "@/redux/thunks/songThunk";
import CustomMenu from "./Menu";

const SongTile = ({ data }: { data: Video }) => {
  const translateX = useSharedValue(-20);
  const opacity = useSharedValue(0);
  const dispatch = useDispatch<AppDispatch>();

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
    translateX.value = withTiming(0, { duration: 500 });
  }, []);

  const handlePlay = () => {
    dispatch(setSongAsync(data));
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePlay}
        className="flex flex-row items-center justify-center"
      >
        <Image
          source={{ uri: data.thumbnails?.[0]?.url }}
          className="w-[60px] h-[60px] rounded-lg"
          resizeMode="cover"
        />
        <View style={styles.infoContainer}>
          <Text numberOfLines={2} style={styles.title}>
            {data.title.slice(0, 25)}
          </Text>
          <Text style={styles.channel}>{data.channel.name}</Text>
          <Text style={styles.views}>
            {data.viewCount.short} • {data.publishedTime}
          </Text>
        </View>
        <CustomMenu video={data} />
      </Pressable>
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
