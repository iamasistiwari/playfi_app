import { Button, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const FadeInBox = () => {
  const opacity = useSharedValue(0); // state

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const fadeIn = () => {
    opacity.value = withTiming(1, { duration: 500 }); // animate to visible
  };

  return (
    <View className="flex-1 justify-center items-center">
      <Animated.View
        style={[
          { width: 100, height: 100, backgroundColor: "tomato" },
          animatedStyle,
        ]}
      />
      <Button title="Fade In" onPress={fadeIn} />
    </View>
  );
};

export default FadeInBox;
