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
  const songPlayerHidePages = [...songPlayerContextHidePages, "/song"];
  return (
    <View
      style={{
        paddingTop: inset.top,
        flex: 1,
        paddingBottom: inset.bottom,
        backgroundColor: "#121212",
      }}
    >
      {!songPlayerContextHidePages.includes(pathname) ? (
        <PlayerProvider>
          {children}
          {!songPlayerHidePages.includes(pathname) && <SongPlayer />}
        </PlayerProvider>
      ) : (
        children
      )}
    </View>
  );
};

export default SafeScreen;
