import SafeScreen from "@/components/main/SafeScreen";
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

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

export default function Layout() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <GestureHandlerRootView>
          <SafeScreen>
            <Toast />
            <MenuProvider>
              <Slot />
            </MenuProvider>
          </SafeScreen>
        </GestureHandlerRootView>
      </PersistGate>
    </Provider>
  );
}
