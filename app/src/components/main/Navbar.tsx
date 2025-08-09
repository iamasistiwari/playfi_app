import { View, Text } from "react-native";
import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

const Navbar = () => {
  const user = useSelector((state: RootState) => state.user);
  return (
    <View className="py-6  flex flex-col gap-y-2 px-4">
      <Text className="font-bold text-4xl text-secondary">Hi There,</Text>
      <Text className="font-medium text-xl text-white">{user.name}</Text>
    </View>
  );
};

export default Navbar;
