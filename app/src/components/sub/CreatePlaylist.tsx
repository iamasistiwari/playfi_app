import { View, Text } from "react-native";
import React, { useState } from "react";
import CustomPortal from "./CustomPortal";
import CustomInput from "./CustomInput";
import { createPlaylistAsync } from "@/actions/playlist";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { userPlaylistAsync } from "@/redux/thunks/playlistThunk";

const CreatePlaylist = () => {
  const [playlistName, setPlaylistName] = useState("");
  const [valid, setValid] = useState(true);
  const [message, setmessage] = useState("");
  const dispatch = useDispatch<AppDispatch>();

  const handleCreatePlaylist = async () => {
    if (!valid || playlistName.trim().length === 0) {
      return;
    }
    const { status, message } = await createPlaylistAsync(playlistName);
    setmessage(message);
    setValid(status);
    if (status) {
      dispatch(userPlaylistAsync());
    }
  };

  return (
    <CustomPortal
      triggerTitle="Create new playlist ?"
      dialogTitle="Create new playlist"
      triggerVariant={"link"}
        triggerClassName=" justify-center items-center"
      dialogContent={
        <View>
          <CustomInput
            placeholder="Playlist name"
            value={playlistName}
            onChangeText={(text) => {
              setPlaylistName(text);
              setValid(text.trim().length > 3);
            }}
          />
          {!valid && playlistName.length > 0 && (
            <Text className="text-red-500 text-sm">
              {"Playlist name must be at least 4 characters long"}
            </Text>
          )}
          {valid && message.length > 0 && (
            <Text className="text-emerald-500 text-lg">{message}</Text>
          )}
          {!valid && message.length > 0 && (
            <Text className="text-red-500 text-sm">{message}</Text>
          )}
        </View>
      }
      autoClose={false}
      onSubmit={handleCreatePlaylist}
    />
  );
};

export default CreatePlaylist;
