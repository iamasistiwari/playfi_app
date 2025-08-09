import { ActivityIndicator } from "react-native";
import React from "react";

const Loader = ({ size = 20 }: { size?: number }) => {
  return <ActivityIndicator size={size} color={"#e5e5e5"} />;
};

export default Loader;
