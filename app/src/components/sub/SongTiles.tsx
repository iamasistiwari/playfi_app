import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import React, { useEffect } from "react";
import { Video } from "@/types/song";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { setSongAsync } from "@/redux/thunks/songThunk";
import CustomMenu from "./Menu";
import { cn } from "@/lib/utils";
import SongImage from "./SongImage";

const SongTile = ({ data }: { data: Video }) => {
  const { currentSong } = useSelector((state: RootState) => state.songPlayer);
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
          source={{ uri: data.thumbnails?.at(-1).url }}
          className={cn("w-[60px] h-[60px] rounded-lg", {
            "border-2 border-[#16a34a]": currentSong?.video?.id === data.id,
          })}
          resizeMode="cover"
        />
        <View style={styles.infoContainer}>
          <Text
            numberOfLines={1}
            style={{
              color: currentSong?.video?.id === data.id ? "#16a34a" : "#fff",
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            {data.title}
          </Text>
          <Text style={styles.channel}>{data.channel.name}</Text>
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
