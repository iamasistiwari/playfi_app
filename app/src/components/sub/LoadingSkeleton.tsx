import { View, StyleSheet } from "react-native";
import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

export default function LoadingSkeleton({ className }: { className?: string }) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.6, 0.3]);
    return { opacity };
  });

  return (
    <Animated.View
      style={animatedStyle}
      className={cn(
        "bg-neutral-800 w-40 h-10 rounded-3xl overflow-hidden",
        className
      )}
    >
      <LinearGradient
        colors={["#262626", "#404040", "#262626"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

export const SongLoadingSkeleton = ({ className }: { className?: string }) => {
  return (
    <View
      className={cn(
        "flex flex-col gap-3 mt-4 px-2",
        className
      )}
    >
      {[1, 2, 3, 4, 5, 6].map((index) => (
        <View key={index} style={styles.songItem}>
          <LoadingSkeleton className="w-[60px] h-[60px] rounded-lg" />
          <View style={styles.songInfo}>
            <LoadingSkeleton className="w-[70%] h-[16px] rounded-md mb-2" />
            <LoadingSkeleton className="w-[50%] h-[12px] rounded-md" />
          </View>
          <LoadingSkeleton className="w-[32px] h-[32px] rounded-full" />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  songItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  songInfo: {
    flex: 1,
    justifyContent: "center",
  },
});
