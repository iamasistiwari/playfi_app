import { View, Text } from "react-native";
import React, { useEffect } from "react";
import { CustomButton } from "@/components/sub/CustomButton";
import {
  AudioPro,
  AudioProContentType,
  AudioProState,
  useAudioPro,
} from "react-native-audio-pro";

const track = {
  id: "0_9TCak--cw",
  url: "https://pagalall.com/wp-content/uploads/all/Pal Pal Afusic (pagalall.com).mp3",
  title: "Pal Pal",
  artwork:
    "https://lh3.googleusercontent.com/GoaPJH-3iAmrBnIQrELduHeCjzRHy45rHb3AbNEncitKZGaZQwMkeu5sYDyvW5VgvpPZSD_VsAjmEOv9=w120-h120-l90-rj",
  artist: "Afusic",
};

const Test = () => {
  // Use the hook to get reactive state
  const playingTrack = useAudioPro((s) => s.trackPlaying);

  useEffect(() => {
    AudioPro.configure({
      contentType: AudioProContentType.MUSIC,
      debug: false
    });
  }, []);

  const handlePlayPause = () => {
    AudioPro.play(track);
  };

  return (
    <View>
      <Text className="text-white">{playingTrack?.title || "null"}</Text>
      <Text className="text-white">{playingTrack?.artist || "null"}</Text>
      <Text className="text-white">{playingTrack?.artwork || "null"}</Text>
      <Text className="text-white">{playingTrack?.id || "null"}</Text>
      <Text className="text-white">{playingTrack?.url || "null"}</Text>
      <CustomButton className="text-white" onPress={handlePlayPause}>
        Done
      </CustomButton>
    </View>
  );
};

export default Test;
