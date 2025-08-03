import { TouchableOpacity } from "react-native";
import React from "react";
import CustomInput from "../sub/CustomInput";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
const DummySearchBar = () => {
  const router = useRouter();
  return (
    <TouchableOpacity className="px-4" onPress={() => router.push("/search/12")}>
      <CustomInput
        placeholder="Search for songs"
        value={""}
        onChangeText={(text) => {}}
        icon={<Ionicons name="search-outline" size={20} color="#16a34a" />}
        editable={false}
        pointerEvents="none"
      />
    </TouchableOpacity>
  );
};

export default DummySearchBar;
