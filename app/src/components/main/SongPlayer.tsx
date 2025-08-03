import { RootState } from "@/redux/store";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { CustomButton } from "../sub/CustomButton";
import { View, Text, Image } from "react-native";
import { MarqueeText } from "../sub/MarqueeText";
import LoadingSkeleton from "../sub/LoadingSkeleton";
import Loader from "../sub/Loader";

const SongPlayer = () => {
  const firstMount = useRef(false);
  const { currentSong, queue, loading } = useSelector(
    (state: RootState) => state.songPlayer
  );
  const player = useAudioPlayer(currentSong?.musicUrl);
  const [isPlaying, setIsPlaying] = useState(player.playing);

  useEffect(() => {
    if (firstMount.current) {
      player.play();
      player.seekTo(0.5);
      setIsPlaying(true);
    } else {
      firstMount.current = true;
    }
  }, [currentSong?.musicUrl]);

  return (
    <LinearGradient
      colors={["#171717", "#121212", "#0a0a0a"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{
        paddingHorizontal: 8,
        width: "100%",
        height: 70,
        position: "absolute",
        bottom: 70,
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
            <MarqueeText text={currentSong?.video?.title} />
            <Text className="text-neutral-500 text-sm">
              {currentSong?.video?.channel?.name}
            </Text>
          </View>
        </View>
      )}

      <View className="flex flex-row gap-x-4">
        <CustomButton
          className="px-0 py-0"
          variant={"ghost"}
          icon={<Ionicons name="play-skip-back" size={28} color="#e5e5e5" />}
          onPress={() => {
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
            className="px-0 py-0"
            variant={"ghost"}
            icon={
              isPlaying ? (
                <Ionicons name="pause" size={28} color="#e5e5e5" />
              ) : (
                <Ionicons name="play" size={28} color="#e5e5e5" />
              )
            }
            onPress={() => {
              setIsPlaying(!isPlaying);
              if (isPlaying) {
                player.pause();
              } else {
                player.play();
              }
            }}
          />
        )}
        <CustomButton
          className="px-0 py-0"
          variant={"ghost"}
          icon={<Ionicons name="play-skip-forward" size={28} color="#e5e5e5" />}
          onPress={() => {}}
        />
      </View>
    </LinearGradient>
  );
};

export default SongPlayer;
