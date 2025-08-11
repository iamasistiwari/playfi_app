import { View, Text } from "react-native";
import React from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CustomButton } from "@/components/sub/CustomButton";
import { Ionicons } from "@expo/vector-icons";

const FullPlaylistView = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  return (
    <View>
      <View className="h-16 flex-row items-center justify-between px-4 pt-1">
        <CustomButton
          loading={false}
          variant={"ghost"}
          className=" p-0"
          title=""
          icon={<Ionicons name="arrow-back" size={24} color="white" />}
          onPress={() => router.back()}
        />
        <Text className="text-white text-2xl font-bold">
          {/* {playlist.playlistName.length > 25
            ? playlist.playlistName.slice(0, 25) + "..."
            : playlist.playlistName} */}
        </Text>
        <View className="flex flex-row gap-x-6">
          <CustomButton
            loading={false}
            className=" p-0"
            variant={"ghost"}
            title=""
            icon={<Ionicons name="search" size={24} color="white" />}
          />
          <CustomButton
            loading={false}
            variant={"ghost"}
            className="p-0"
            title=""
            icon={<Ionicons name="ellipsis-vertical" size={24} color="white" />}
          />
        </View>
      </View>
    </View>
  );
};

export default FullPlaylistView;
