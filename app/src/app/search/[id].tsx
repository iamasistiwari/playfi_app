import { View } from "react-native";
import React, { useEffect } from "react";
import { useLocalSearchParams } from "expo-router";
import SongSearchBar from "@/components/main/SongSearchBar";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

const SearchComp = () => {
  const { id } = useLocalSearchParams();
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
    <View className="flex-1 pt-8 bg-primary">
      <Animated.View style={animatedStyle}>
        <SongSearchBar />
      </Animated.View>
    </View>
  );
};

export default SearchComp;
