import React, { useEffect } from "react";
import { View, StyleSheet, Text, Image, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  runOnJS,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type CustomSplashScreenProps = {
  onFinish: () => void;
};

const CustomSplashScreen: React.FC<CustomSplashScreenProps> = ({
  onFinish,
}) => {
  // Logo
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);

  // Ring pulse
  const ringScale = useSharedValue(0.8);
  const ringOpacity = useSharedValue(0);

  // Text
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(30);
  const taglineOpacity = useSharedValue(0);

  // Bars (equalizer)
  const bar1Height = useSharedValue(0);
  const bar2Height = useSharedValue(0);
  const bar3Height = useSharedValue(0);
  const bar4Height = useSharedValue(0);
  const barsOpacity = useSharedValue(0);

  // Screen exit
  const screenScale = useSharedValue(1);
  const screenOpacity = useSharedValue(1);

  // Glow
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    // Phase 1: Logo entrance (0-500ms)
    logoOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    logoScale.value = withSpring(1, {
      damping: 12,
      stiffness: 100,
      mass: 0.8,
    });

    // Phase 2: Ring pulse (300-800ms)
    ringOpacity.value = withDelay(300,
      withSequence(
        withTiming(0.6, { duration: 400, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 600, easing: Easing.in(Easing.ease) })
      )
    );
    ringScale.value = withDelay(300,
      withTiming(1.8, { duration: 1000, easing: Easing.out(Easing.ease) })
    );

    // Glow behind logo
    glowOpacity.value = withDelay(200,
      withSequence(
        withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) }),
        withDelay(800,
          withTiming(0.4, { duration: 600 })
        )
      )
    );

    // Phase 3: Title entrance (500-1000ms)
    titleOpacity.value = withDelay(500,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) })
    );
    titleTranslateY.value = withDelay(500,
      withSpring(0, { damping: 15, stiffness: 120 })
    );

    // Phase 4: Tagline (700-1100ms)
    taglineOpacity.value = withDelay(700,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) })
    );

    // Phase 5: Equalizer bars (800-1600ms)
    barsOpacity.value = withDelay(800,
      withTiming(1, { duration: 300 })
    );

    const barAnimation = (delay: number, heights: number[]) =>
      withDelay(800 + delay,
        withSequence(
          withTiming(heights[0], { duration: 200, easing: Easing.out(Easing.ease) }),
          withTiming(heights[1], { duration: 250, easing: Easing.inOut(Easing.ease) }),
          withTiming(heights[2], { duration: 200, easing: Easing.inOut(Easing.ease) }),
          withTiming(heights[3], { duration: 300, easing: Easing.inOut(Easing.ease) }),
          withTiming(heights[1], { duration: 250, easing: Easing.inOut(Easing.ease) }),
        )
      );

    bar1Height.value = barAnimation(0, [14, 22, 10, 18]);
    bar2Height.value = barAnimation(80, [22, 12, 26, 16]);
    bar3Height.value = barAnimation(40, [18, 28, 14, 24]);
    bar4Height.value = barAnimation(120, [12, 20, 24, 14]);

    // Phase 6: Exit (2000-2500ms)
    screenScale.value = withDelay(2000,
      withTiming(1.1, { duration: 400, easing: Easing.in(Easing.ease) })
    );
    screenOpacity.value = withDelay(2000,
      withTiming(0, {
        duration: 400,
        easing: Easing.in(Easing.ease),
      }, (finished) => {
        if (finished) {
          runOnJS(onFinish)();
        }
      })
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const barsContainerStyle = useAnimatedStyle(() => ({
    opacity: barsOpacity.value,
  }));

  const bar1Style = useAnimatedStyle(() => ({ height: bar1Height.value }));
  const bar2Style = useAnimatedStyle(() => ({ height: bar2Height.value }));
  const bar3Style = useAnimatedStyle(() => ({ height: bar3Height.value }));
  const bar4Style = useAnimatedStyle(() => ({ height: bar4Height.value }));

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
    transform: [{ scale: screenScale.value }],
  }));

  return (
    <Animated.View style={[styles.container, screenStyle]}>
      <View style={styles.background}>
        <LinearGradient
          colors={["#000000", "#0a0a0a", "#000000"]}
          style={StyleSheet.absoluteFill}
        />

        {/* Subtle radial glow */}
        <Animated.View style={[styles.glow, glowStyle]}>
          <LinearGradient
            colors={["rgba(29,185,84,0.12)", "rgba(29,185,84,0.04)", "transparent"]}
            style={styles.glowGradient}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 0.5, y: 1 }}
          />
        </Animated.View>
      </View>

      <View style={styles.content}>
        {/* Ring pulse effect */}
        <Animated.View style={[styles.ring, ringStyle]} />

        {/* Logo */}
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <Image
            source={require("../../assets/app.jpg")}
            style={styles.logoImage}
            resizeMode="cover"
          />
        </Animated.View>

        {/* App Name */}
        <Animated.View style={[styles.titleContainer, titleStyle]}>
          <Text style={styles.appName}>
            Play<Text style={styles.appNameAccent}>Fi</Text>
          </Text>
        </Animated.View>

        {/* Equalizer Bars */}
        <Animated.View style={[styles.barsContainer, barsContainerStyle]}>
          <Animated.View style={[styles.bar, bar1Style]} />
          <Animated.View style={[styles.bar, bar2Style]} />
          <Animated.View style={[styles.bar, bar3Style]} />
          <Animated.View style={[styles.bar, bar4Style]} />
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={taglineStyle}>
          <Text style={styles.tagline}>Your Music, Your Vibe</Text>
        </Animated.View>
      </View>
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
    zIndex: 999,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  glow: {
    position: "absolute",
    top: SCREEN_HEIGHT * 0.25,
    left: SCREEN_WIDTH * 0.1,
    right: SCREEN_WIDTH * 0.1,
    height: SCREEN_HEIGHT * 0.35,
  },
  glowGradient: {
    flex: 1,
    borderRadius: SCREEN_WIDTH,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  ring: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "rgba(29,185,84,0.4)",
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#111",
    shadowColor: "#1DB954",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  titleContainer: {
    marginTop: 28,
  },
  appName: {
    fontSize: 42,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    letterSpacing: 3,
  },
  appNameAccent: {
    color: "#1DB954",
  },
  barsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    height: 30,
    marginTop: 20,
  },
  bar: {
    width: 4,
    backgroundColor: "#1DB954",
    borderRadius: 2,
    minHeight: 4,
  },
  tagline: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.35)",
    textAlign: "center",
    marginTop: 16,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});

export default CustomSplashScreen;
