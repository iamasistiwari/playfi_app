import { View, Text, Dimensions, Image } from "react-native";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { usePlayer } from "@/hooks/usePlayer";
import { CustomButton } from "@/components/sub/CustomButton";
import { Ionicons } from "@expo/vector-icons";
import Loader from "@/components/sub/Loader";

const Song = () => {
  const { currentSong, loading } = useSelector(
    (state: RootState) => state.songPlayer
  );
  const { togglePlayPause, isPlaying, player } = usePlayer();

  const translateY = useSharedValue(-20);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
    translateY.value = withTiming(0, { duration: 500 });
  }, []);

  return (
    <Animated.View style={[animatedStyle]}>
      <View className="px-10 pt-20">
        <Image
          source={{ uri: currentSong?.video?.thumbnails?.at(-1)?.url }}
          style={{
            width: "100%",
            height: 300,
            borderRadius: 10,
            opacity: 0.75,
          }}
        />
        <View className="flex flex-row gap-x-4 min-w-full items-center justify-center">
          <CustomButton
            className="px-0 py-0 h-full opacity-70"
            variant={"ghost"}
            icon={<Ionicons name="play-skip-back" size={30} color="#e5e5e5" />}
            onPress={(e) => {
              e.stopPropagation();
              if (player.currentTime < 10) {
                player.seekTo(0);
              } else {
              }
            }}
          />
          {loading ? (
            <Loader />
          ) : (
            <CustomButton
              className="px-0 py-0 h-full"
              variant={"ghost"}
              icon={
                isPlaying ? (
                  <Ionicons name="pause-circle" size={65} color="#e5e5e5" />
                ) : (
                  <Ionicons name="play-circle" size={65} color="#e5e5e5" />
                )
              }
              onPress={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
            />
          )}
          <CustomButton
            className="px-0 py-0 h-full  opacity-70"
            variant={"ghost"}
            icon={
              <Ionicons name="play-skip-forward" size={30} color="#e5e5e5" />
            }
            onPress={(e) => {
              e.stopPropagation();
            }}
          />
        </View>
      </View>
    </Animated.View>
  );
};

export default Song;
