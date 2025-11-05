import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const DummySearchBar = () => {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push("/search")}
      activeOpacity={0.7}
    >
      <View style={styles.searchBar}>
        <Ionicons name="search" size={22} color="#000" />
        <Text style={styles.placeholder}>What do you want to listen to?</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  placeholder: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
});

export default DummySearchBar;
