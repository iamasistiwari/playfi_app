import { View, Text, Image } from "react-native";
import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { usePlayer } from "@/hooks/usePlayer";
import { CustomButton } from "@/components/sub/CustomButton";
import { Ionicons } from "@expo/vector-icons";
import Loader from "@/components/sub/Loader";
import SongSlider from "@/components/sub/SongSlider";
import CustomMenu from "@/components/sub/Menu";
import { playNextAsync } from "@/redux/thunks/songThunk";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import SongImage from "@/components/sub/SongImage";

const Song = () => {
  const { currentSong, loading } = useSelector(
    (state: RootState) => state.songPlayer
  );
  const {
    togglePlayPause,
    isPlaying,
    playerState: { isBuffering },
    seekTo,
  } = usePlayer();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
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

  const panGesture = Gesture.Pan()
    .activeOffsetY([20, 9999]) // must move vertically at least 20px
    .failOffsetX([-20, 20]) // if user moves too much horizontally, cancel this gesture
    .onEnd((event) => {
      if (event.translationY > 100 && event.velocityY > 500) {
        runOnJS(router.back)();
      }
    });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[animatedStyle, { flex: 1 }]}>
        <View className="px-10 pt-20 flex-1">
          <View className="absolute right-4 top-4">
            <CustomMenu video={currentSong?.video} />
          </View>
          <View>
            <SongImage
              url={currentSong?.video?.thumbnails?.at(-1)?.url || ""}
              width={300}
              height={300}
            />
            <View className="flex flex-col items-center justify-center my-10 overflow-hidden">
              <Text
                numberOfLines={1}
                className="text-center text-white text-2xl font-bold max-w-[70vw]"
              >
                {currentSong?.video?.title || "No title"}
              </Text>
              <Text numberOfLines={1} className="text-neutral-400 text-lg">
                {currentSong?.video?.channel?.name || "No channel"}
              </Text>
            </View>
          </View>

          <SongSlider />

          <View className="flex flex-row gap-x-4 min-w-full items-center justify-center">
            <CustomButton
              className="px-0 py-0 h-full opacity-70"
              variant={"ghost"}
              icon={
                <Ionicons name="play-skip-back" size={30} color="#e5e5e5" />
              }
              onPress={(e) => {
                e.stopPropagation();
                seekTo(0);
              }}
            />

            {loading || isBuffering ? (
              <Loader size={50} />
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
              className="px-0 py-0 h-full opacity-70"
              variant={"ghost"}
              icon={
                <Ionicons name="play-skip-forward" size={30} color="#e5e5e5" />
              }
              onPress={(e) => {
                e.stopPropagation();
                dispatch(playNextAsync());
              }}
            />
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

export default Song;
