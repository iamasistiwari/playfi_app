import { Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

interface RecentSongHistroyProps {
  onPress: (text: string) => void;
}
const RecentSongHistroy = ({ onPress }: RecentSongHistroyProps) => {
  const data = useSelector((state: RootState) => state.songPlayer.recentSearch);
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 12,
      }}
      style={{
        maxHeight: 300,
      }}
    >
      {data?.map((item, index) => (
        <TouchableOpacity
          onPress={() => {
            onPress(item);
          }}
          key={index}
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#404040",
            paddingHorizontal: 12,
            paddingVertical: 6,
            margin: 4,
            borderRadius: 6,
          }}
        >
          <Ionicons name="time-outline" size={18} color="#737373" />
          <Text
            style={{
              color: "#fff",
              marginLeft: 6,
              fontSize: 16,
              textAlign: "center",
            }}
          >
            {item}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default RecentSongHistroy;
