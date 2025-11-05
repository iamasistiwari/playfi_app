import SafeScreen from "@/components/main/SafeScreen";
import CustomSplashScreen from "@/components/main/CustomSplashScreen";
import "../global.css";
import { Slot } from "expo-router";
import { Provider } from "react-redux";
import { persistor, store } from "@/redux/store";
import { PersistGate } from "redux-persist/integration/react";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import { Provider as MenuProvider } from "react-native-paper";
import Toast from "react-native-toast-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "react-native";
import { useEffect, useState, useCallback } from "react";
import { AudioPro } from "react-native-audio-pro";
import * as SplashScreen from "expo-splash-screen";

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

// Keep the native splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const [showCustomSplash, setShowCustomSplash] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Add any initial loading logic here if needed
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  const handleSplashFinish = () => {
    setShowCustomSplash(false);
  };

  if (!appIsReady) {
    return null;
  }

  if (showCustomSplash) {
    return <CustomSplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <GestureHandlerRootView onLayout={onLayoutRootView}>
          <StatusBar barStyle="light-content" backgroundColor="#000000" />
          <SafeScreen>
            <MenuProvider>
              <Toast />
              <Slot />
            </MenuProvider>
          </SafeScreen>
        </GestureHandlerRootView>
      </PersistGate>
    </Provider>
  );
}
