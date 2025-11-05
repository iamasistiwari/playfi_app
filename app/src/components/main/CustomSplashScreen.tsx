import React, { useEffect } from "react";
import { View, StyleSheet, Text, Image } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

type CustomSplashScreenProps = {
  onFinish: () => void;
};

const CustomSplashScreen: React.FC<CustomSplashScreenProps> = ({
  onFinish,
}) => {
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.5);
  const logoRotate = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);
  const iconOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0.8);
  const screenOpacity = useSharedValue(1);

  const logoAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: logoOpacity.value,
      transform: [
        { scale: logoScale.value },
      ],
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  const screenAnimatedStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  useEffect(() => {
    // Logo animations
    logoOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.ease),
    });

    logoScale.value = withSequence(
      withTiming(1.1, {
        duration: 500,
        easing: Easing.out(Easing.back(1.5)),
      }),
      withTiming(1, {
        duration: 200,
        easing: Easing.inOut(Easing.ease),
      })
    );

    logoRotate.value = withSequence(
      withTiming(5, { duration: 300 }),
      withTiming(-5, { duration: 300 }),
      withTiming(0, { duration: 200 })
    );

    // Text fade in
    textOpacity.value = withDelay(
      400,
      withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.ease),
      })
    );

    textTranslateY.value = withDelay(
      400,
      withTiming(0, {
        duration: 600,
        easing: Easing.out(Easing.ease),
      })
    );

    // Music icon pulse
    iconOpacity.value = withDelay(
      600,
      withTiming(1, { duration: 400 })
    );

    iconScale.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.9, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // Fade out the entire screen
    screenOpacity.value = withDelay(
      2200,
      withTiming(
        0,
        {
          duration: 500,
          easing: Easing.in(Easing.ease),
        },
        (finished) => {
          if (finished) {
            runOnJS(onFinish)();
          }
        }
      )
    );
  }, []);

  return (
    <Animated.View style={[styles.container, screenAnimatedStyle]}>
      <LinearGradient
        colors={["#0a0a0a", "#1a1a1a", "#0a0a0a"]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Logo */}
          <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
            <Image
              source={require("../../assets/app.jpg")}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </Animated.View>

          {/* App Name */}
          <Animated.View style={textAnimatedStyle}>
            <Text style={styles.appName}>PlayFi</Text>
            <Text style={styles.tagline}>Your Music, Your Vibe</Text>
          </Animated.View>

          {/* Music Icon */}
          <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
            <Ionicons name="musical-notes" size={24} color="#1DB954" />
          </Animated.View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    gap: 24,
  },
  logoContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: "hidden",
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#1DB954",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logoImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  appName: {
    fontSize: 36,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 14,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    marginTop: 4,
    letterSpacing: 1,
  },
  iconContainer: {
    marginTop: 8,
  },
});

export default CustomSplashScreen;
