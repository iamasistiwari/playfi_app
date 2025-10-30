import { AppDispatch, RootState } from "@/redux/store";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { CustomButton } from "../sub/CustomButton";
import Loader from "../sub/Loader";
import LoadingSkeleton from "../sub/LoadingSkeleton";
import { usePlayer } from "@/hooks/usePlayer";
import { formatTime } from "@/lib/customfn";
import { playNextAsync } from "@/redux/thunks/songThunk";
import SongImage from "../sub/SongImage";

const SongPlayer = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { currentSong, loading } = useSelector(
    (state: RootState) => state.songPlayer
  );
  const dispatch = useDispatch<AppDispatch>();
  const {
    togglePlayPause,
    playerState: { isBuffering, position, duration, isPlaying },
    seekTo,
  } = usePlayer();

  return (
    <Pressable
      onPress={() => {
        if (pathname !== "/song") {
          router.push(`/song`);
        }
      }}
      className={"backdrop-blur-3xl absolute bottom-10 min-w-[100vw]"}
    >
      <LinearGradient
        colors={["#171717", "#121212", "#0a0a0a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingHorizontal: 8,
          width: "100%",
          height: 70,
          position: "absolute",
          bottom: pathname.includes("/playlist") ? 30 : 70,
          justifyContent: "space-between",
          alignItems: "center",
          borderRadius: 10,
          flexDirection: "row",
        }}
      >
        {loading ? (
          <LoadingSkeleton className="w-60 h-14 bg-neutral-800" />
        ) : (
          <View className="w-[220px]  flex flex-row overflow-hidden">
            <SongImage url={currentSong?.image_url} />
            <View className="flex flex-col px-2 justify-center">
              <Text
                numberOfLines={1}
                className="text-white text-base max-w-[40vw] font-medium"
              >
                {currentSong?.video?.title || "No Song Playing"}
              </Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-neutral-500 text-sm font-medium">
                  {currentSong?.video?.channel?.name || ""}
                </Text>

                {duration > 0 && (
                  <View className="flex flex-row ">
                    <Text className="text-neutral-400 text-sm">
                      {formatTime(position)}
                    </Text>
                    <Text className="text-neutral-400 text-sm">
                      {" "}
                      / {formatTime(duration)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        <View className="flex flex-row gap-x-4">
          <CustomButton
            className="px-0 py-0"
            variant={"ghost"}
            icon={<Ionicons name="play-skip-back" size={28} color="#e5e5e5" />}
            onPress={(e) => {
              e.stopPropagation();
              seekTo(0);
            }}
          />
          {loading || isBuffering ? (
            <Loader />
          ) : (
            <CustomButton
              className="px-0 py-0"
              variant={"ghost"}
              icon={
                isPlaying ? (
                  <Ionicons name="pause" size={28} color="#e5e5e5" />
                ) : (
                  <Ionicons name="play" size={28} color="#e5e5e5" />
                )
              }
              onPress={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
            />
          )}
          <CustomButton
            className="px-0 py-0"
            variant={"ghost"}
            icon={
              <Ionicons name="play-skip-forward" size={28} color="#e5e5e5" />
            }
            onPress={(e) => {
              e.stopPropagation();
              dispatch(playNextAsync());
            }}
          />
        </View>
      </LinearGradient>
    </Pressable>
  );
};

export default SongPlayer;
