import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

export default function TabsLayout() {
  const { isAdmin } = useSelector((state: RootState) => state.user);

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "transparent",
          borderColor: "transparent",
          position: "absolute",
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
      {isAdmin && (
        <Tabs.Screen
          name="dev"
          options={{
            title: "Dev",
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="code" size={size} color={color} />
            ),
          }}
        />
      )}
    </Tabs>
  );
}
