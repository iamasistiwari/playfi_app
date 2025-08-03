import React, { useEffect, useRef, useState } from "react";
import { Animated, Text, View, StyleSheet, Dimensions } from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;

export const MarqueeText = ({ text }: { text: string }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [textWidth, setTextWidth] = useState(0);

  useEffect(() => {
    if (text.length > 20 && textWidth > 0) {
      scrollX.setValue(0); 
      Animated.loop(
        Animated.timing(scrollX, {
          toValue: -textWidth,
          duration: 12000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [text, textWidth]);

  if (text.length <= 20) {
    return <Text style={styles.normalText}>{text}</Text>;
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          flexDirection: "row",
          transform: [{ translateX: scrollX }],
        }}
      >
        {/* Repeat text twice for seamless loop */}
        <Text
          numberOfLines={1}
          onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}
          style={styles.marqueeText}
        >
          {text + " • "}
        </Text>
        <Text numberOfLines={1} style={styles.marqueeText}>
          {text + " • "}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    overflow: "hidden",
  },
  marqueeText: {
    color: "#f5f5f5",
    fontSize: 18,
    fontWeight: "bold",
  },
  normalText: {
    color: "#f5f5f5",
    fontSize: 18,
    fontWeight: "bold",
  },
});
