import { CustomButton } from "@/components/sub/CustomButton";
import Loader from "@/components/sub/Loader";
import SongImage from "@/components/sub/SongImage";
import SongSlider from "@/components/sub/SongSlider";
import CustomMenu from "@/components/sub/SongTileMenu";
import { usePlayer } from "@/hooks/usePlayer";
import { AppDispatch, RootState } from "@/redux/store";
import { playNextAsync } from "@/redux/thunks/songThunk";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useDispatch, useSelector } from "react-redux";

const Song = () => {
  const { currentSong, loading, queue } = useSelector(
    (state: RootState) => state.songPlayer
  );
  const {
    togglePlayPause,
    playerState,
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
          <View className="flex flex-col items-center justify-center">
            <View className="flex flex-row items-center justify-center ">
              <SongImage
                url={currentSong?.highResImageUrl || currentSong?.video?.thumbnails?.at(-1)?.url || ""}
                width={200}
                height={200}
              />
            </View>
            <View className="flex flex-col items-center justify-center overflow-hidden">
              <Text
                numberOfLines={1}
                className="text-center text-white text-4xl font-bold max-w-[70vw] mt-10"
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
                <Ionicons name="play-skip-back" size={35} color="#e5e5e5" />
              }
              onPress={() => {
                seekTo(0);
              }}
            />

            {loading || playerState.isBuffering ? (
              <Loader size={50} />
            ) : (
              <CustomButton
                className="px-0 py-0 h-full"
                variant={"ghost"}
                icon={
                  playerState.isPlaying ? (
                    <Ionicons name="pause-circle" size={75} color="#16a34a" />
                  ) : (
                    <Ionicons name="play-circle" size={75} color="#e5e5e5" />
                  )
                }
                onPress={() => {
                  togglePlayPause();
                }}
              />
            )}

            <CustomButton
              className="px-0 py-0 h-full opacity-70"
              variant={"ghost"}
              icon={
                <Ionicons name="play-skip-forward" size={35} color="#e5e5e5" />
              }
              onPress={() => {
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
