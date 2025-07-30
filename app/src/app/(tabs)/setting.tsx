import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import SignoutButton from "@/components/sub/SignoutButton";

const setting = () => {

  return (
    <View className="bg-primary min-h-screen flex items-center justify-center">
      <SignoutButton />
    </View>
  );
};

export default setting;
