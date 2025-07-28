// src/app/(tabs)/layout.tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface TabItem {
    name: string;
    title: string;
    icon: string;
}

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarStyle: {
                    backgroundColor: "transparent",
                    borderColor: "transparent",
                    position: 'absolute',
                    elevation: 0,
                    shadowOpacity: 0,
                },
                tabBarActiveTintColor: "#16a34a",
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: "Home",
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="setting"
                options={{
                    title: "Settings",
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="settings" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}