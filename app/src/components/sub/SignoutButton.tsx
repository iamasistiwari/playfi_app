import React from "react";
import { CustomButton } from "./CustomButton";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { logout } from "@/redux/userSlice";

export default function SignoutButton() {
  const [loading, setloading] = React.useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const handleSignout = () => {
    setloading(true);
    dispatch(logout());
    setloading(false);
  };
  return (
    <CustomButton
      loading={loading}
      title="Signout"
      icon={<Ionicons name="log-out" size={20} color="white" />}
      onPress={handleSignout}
      variant={"outline"}
      className="border-neutral-600"
    />
  );
}
