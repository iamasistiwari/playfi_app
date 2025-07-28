import SafeScreen from "@/components/main/SafeScreen";
import "../global.css";
import { Slot } from "expo-router";

export default function Layout() {
  return (
    <SafeScreen>
      <Slot />
    </SafeScreen>
  );
}
