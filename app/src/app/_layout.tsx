import SafeScreen from "@/components/main/SafeScreen";
import "../global.css";
import { Slot } from "expo-router";
import { Provider } from "react-redux";
import { persistor, store } from "@/redux/store";
import { PersistGate } from "redux-persist/integration/react";
import Toast from "react-native-toast-message";
import { toastConfig } from "@/components/sub/CustomToast";
export default function Layout() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeScreen>
          {/* @ts-ignore */}
          <Toast config={toastConfig} />
          <Slot />
        </SafeScreen>
      </PersistGate>
    </Provider>
  );
}
