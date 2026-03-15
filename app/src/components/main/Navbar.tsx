import { View, Text, StyleSheet } from "react-native";
import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

const Navbar = () => {
  const { name } = useSelector((state: RootState) => state.user);
  const currentHour = new Date().getHours();

  const getGreeting = () => {
    if (currentHour < 12) return "Good morning";
    if (currentHour < 18) return "Good afternoon";
    return "Good evening";
  };

  const firstName = name?.split(" ")[0] || "";

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>
        {getGreeting()}
        {firstName ? `, ${firstName}` : ""}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 30,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
});

export default Navbar;
