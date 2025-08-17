import { RootState } from "@/redux/store";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import React, { useRef } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { useSelector } from "react-redux";
import { CustomButton } from "../sub/CustomButton";
import Loader from "../sub/Loader";
import LoadingSkeleton from "../sub/LoadingSkeleton";
import { MarqueeText } from "../sub/MarqueeText";
import { usePlayer } from "@/hooks/usePlayer";
import { formatTime } from "@/lib/customfn";

const SongPlayer = () => {
  const pathname = usePathname();
  const router = useRouter();
  const renderTimes = useRef(0);
  const { currentSong, queue, loading } = useSelector(
    (state: RootState) => state.songPlayer
  );
  const {
    togglePlayPause,
    isPlaying,
    player,
    playerState: { isBuffering, position, duration },
  } = usePlayer();
  renderTimes.current++;
  return (
    <Pressable
      onPress={() => {
        if (pathname !== "/song") {
          router.push(`/song`);
        }
      }}
      className="backdrop-blur-3xl"
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
            <Image
              src={currentSong?.video?.thumbnails?.[0]?.url}
              width={60}
              height={60}
              className="rounded-xl"
            />
            <View className="flex flex-col px-2 justify-center">
              <MarqueeText text={currentSong?.video?.title || ""} />
              <View className="flex-row items-center gap-2">
                <Text className="text-neutral-500 text-sm font-medium">
                  {currentSong?.video?.channel?.name}
                </Text>
                <View className="flex flex-row ">
                  <Text className="text-neutral-400 text-sm">
                    {formatTime(position)}
                  </Text>
                  <Text className="text-neutral-400 text-sm">
                    {" "}
                    / {formatTime(duration)}
                  </Text>
                </View>
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
              if (player.currentTime < 10) {
                player.seekTo(0);
              } else {
                // add logic to go to previous song
              }
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
            }}
          />
        </View>
      </LinearGradient>
    </Pressable>
  );
};

export default SongPlayer;
