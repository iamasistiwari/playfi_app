import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PlayerProvider } from "@/hooks/usePlayer";
// import { ProPlayerProvider } from "@/hooks/a";

const SafeScreen = ({ children }) => {
  const inset = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: "#121212" }}>
      {/* StatusBar background (iOS + Android) */}
      <View style={{ height: inset.top, backgroundColor: "#121212" }} />

      {/* Main content */}
      <View
        style={{
          flex: 1,
          backgroundColor: "#121212",
          paddingBottom: inset.bottom,
        }}
      >
        {/* <ProPlayerProvider> */}
          <PlayerProvider>
          {children}
          </PlayerProvider>
        {/* </ProPlayerProvider> */}
      </View>
    </View>
  );
};

export default SafeScreen;
