import { AppDispatch } from "@/redux/store";
import { logout } from "@/redux/user-slice";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useDispatch } from "react-redux";
import { CustomButton } from "./CustomButton";
import { useRouter } from "expo-router";
import { resetSongPlayer } from "@/redux/song-player";
import { resetPlaylistAfterSignout } from "@/redux/playlist-slice";
import { resetStorage } from "@/lib/get-token";

export default function SignoutButton() {
  const [loading, setloading] = React.useState(false);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const handleSignout = async () => {
    setloading(true);
    dispatch(logout());
    dispatch(resetPlaylistAfterSignout());
    dispatch(resetSongPlayer());
    await resetStorage();
    await new Promise((resolve) => setTimeout(resolve, 500));
    router.push("/");
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
