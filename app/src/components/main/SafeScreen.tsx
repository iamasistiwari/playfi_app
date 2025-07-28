import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SafeScreen = ({ children }) => {
  const inset = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingTop: inset.top,
        flex: 1,
        paddingBottom: inset.bottom,
        paddingHorizontal: 8,
        backgroundColor: "#121212",
      }}
    >
      {children}
    </View>
  );
};

export default SafeScreen;
