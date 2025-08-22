import { View, Text } from "react-native";
import React, { useState } from "react";
import CustomInput from "./CustomInput";
import { Video } from "@/types/song";
import CustomPortal from "./CustomPortal";
import { renameSongAction } from "@/actions/songs";
import Toast from "react-native-toast-message";

const RenameSongDialog = ({
  video,
  renameSongDialogVisible,
  setRenameSongDialogVisible,
}: {
  video: Video;
  renameSongDialogVisible: boolean;
  setRenameSongDialogVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [value, setValue] = useState(video.title);
  return (
    <CustomPortal
      visible={renameSongDialogVisible}
      dialogTitle="Rename Song"
      dialogContent={
        <View>
          <CustomInput
            placeholder="Enter new title"
            value={value}
            onChangeText={setValue}
          />
        </View>
      }
      handleClose={() => setRenameSongDialogVisible(false)}
      onSubmit={async () => {
        const isRenamed = await renameSongAction(video.id, value);
        if (isRenamed) {
          Toast.show({
            type: "success",
            text1: "Updated! Refresh App",
            position: "top",
            visibilityTime: 1000,
            topOffset: 100,
          });
        } else {
          Toast.show({
            type: "error",
            text1: "Failed to update",
            position: "top",
          });
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setRenameSongDialogVisible(false);
      }}
    />
  );
};

export default RenameSongDialog;
