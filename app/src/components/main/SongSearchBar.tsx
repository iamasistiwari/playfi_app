import { View, Text } from "react-native";
import React from "react";
import CustomInput from "../sub/CustomInput";
import { Ionicons } from "@expo/vector-icons";

const SongSearchBar = () => {
  const [searchQuery, setSearchQuery] = React.useState("");
  return (
    <View>
      <CustomInput
        label="Search"
        placeholder="Search here..."
        value={searchQuery}
        onChangeText={(text) => {
          setSearchQuery(text);
        }}
        icon={<Ionicons name="log-in" size={20} color="white" />}
      />
    </View>
  );
};

export default SongSearchBar;
