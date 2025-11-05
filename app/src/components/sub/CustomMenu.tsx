import React, { useEffect, ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector, ScrollView, GestureHandlerRootView } from "react-native-gesture-handler";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface MenuItem {
  title: string;
  onPress: () => void | Promise<void>;
  icon?: ReactNode;
  disabled?: boolean;
}

type CustomMenuProps = {
  visible: boolean;
  onClose: () => void;
  items: MenuItem[];
  title?: string;
};

const CustomMenu: React.FC<CustomMenuProps> = ({
  visible,
  onClose,
  items,
  title,
}) => {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const gestureTranslateY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Reset gesture value when opening
      gestureTranslateY.value = 0;
      backdropOpacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, {
        damping: 30,
        stiffness: 200,
      });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
      // Reset gesture value when closing
      gestureTranslateY.value = 0;
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value + gestureTranslateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const panGesture = Gesture.Pan()
    .enabled(true)
    .activeOffsetY([-5, 5])
    .failOffsetX([-30, 30])
    .minDistance(0)
    .onBegin(() => {
      'worklet';
    })
    .onStart(() => {
      'worklet';
    })
    .onUpdate((event) => {
      'worklet';
      if (event.translationY > 0) {
        gestureTranslateY.value = event.translationY * 0.8;
      }
    })
    .onEnd((event) => {
      'worklet';
      if (event.translationY > 120 || event.velocityY > 600) {
        gestureTranslateY.value = withSpring(SCREEN_HEIGHT, {
          velocity: event.velocityY,
          damping: 50,
        });
        runOnJS(onClose)();
      } else {
        gestureTranslateY.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
        });
      }
    })
    .onFinalize(() => {
      'worklet';
    });

  const handleItemPress = async (onPress: () => void | Promise<void>) => {
    await onPress();
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.container}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[styles.sheet, animatedStyle]}
          >
            <View
              style={styles.dragArea}
            >
              <View style={styles.handleBar} />
            </View>

            {/* Header */}
            {title && (
              <View style={styles.header}>
                <Text style={styles.headerTitle}>{title}</Text>
                <Pressable onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </Pressable>
              </View>
            )}

            {/* Menu Items */}
            <ScrollView
              style={styles.menuItems}
              showsVerticalScrollIndicator={false}
            >
              {items.map((item, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.menuItem,
                    item.disabled && styles.menuItemDisabled,
                  ]}
                  onPress={() =>
                    !item.disabled && handleItemPress(item.onPress)
                  }
                  disabled={item.disabled}
                >
                  {item.icon && (
                    <View style={styles.iconContainer}>{item.icon}</View>
                  )}
                  <Text
                    style={[
                      styles.menuItemText,
                      item.disabled && styles.menuItemTextDisabled,
                    ]}
                  >
                    {item.title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#282828",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.7,
    paddingBottom: 40,
  },
  dragArea: {
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 28,
    color: "#fff",
  },
  menuItems: {
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
  },
  menuItemTextDisabled: {
    color: "rgba(255, 255, 255, 0.5)",
  },
});

export default CustomMenu;
