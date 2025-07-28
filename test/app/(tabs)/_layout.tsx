// src/app/(tabs)/layout.tsx
import { Tabs } from "expo-router";

export default function TabsLayout() {
    return (
        <Tabs>
            <Tabs.Screen name="index" options={{ title: "Home" }} />
            <Tabs.Screen name="profile" options={{ title: "Profile" }} />
            <Tabs.Screen name="setting" options={{ title: "Settings" }} />
        </Tabs>
    );
}
