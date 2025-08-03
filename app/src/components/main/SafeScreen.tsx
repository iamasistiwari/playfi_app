import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SongPlayer from "./SongPlayer";
const SafeScreen = ({ children }) => {
  const inset = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingTop: inset.top,
        flex: 1,
        paddingBottom: inset.bottom,
        // paddingHorizontal: 12,
        backgroundColor: "#121212",
      }}
    >
      {children}
      <SongPlayer />
    </View>
  );
};

export default SafeScreen;
