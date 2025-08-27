import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SongPlayer from "./SongPlayer";
import { usePathname } from "expo-router";
import { PlayerProvider } from "@/hooks/usePlayer";

const SafeScreen = ({ children }) => {
  const inset = useSafeAreaInsets();
  const pathname = usePathname();
  const songPlayerContextHidePages = ["/"];
  // const songPlayerHidePages = [...songPlayerContextHidePages, "/song"];
  const songPlayerHidePages = ["/", "/song"];

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
        {/* {!songPlayerContextHidePages.includes(pathname) ? (
          <PlayerProvider>
            {children}
            {!songPlayerHidePages.includes(pathname) && <SongPlayer />}
          </PlayerProvider>
        ) : (
          children
        )} */}
        <PlayerProvider>
          {children}
          {!songPlayerHidePages.includes(pathname) && <SongPlayer />}
        </PlayerProvider>
      </View>
    </View>
  );
};

export default SafeScreen;
