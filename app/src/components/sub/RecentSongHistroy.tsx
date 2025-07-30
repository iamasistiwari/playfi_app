import { Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { fetchRecentSongs } from "@/actions/songs";
import { HistroySongLoadingSkeleton } from "./LoadingSkeleton";
import useFetch from "@/hooks/useFetch";

interface RecentSongHistroyProps {
  onPress: (text: string) => void;
}
const RecentSongHistroy = ({ onPress }: RecentSongHistroyProps) => {
  const { data, error, loading } = useFetch<string[]>(fetchRecentSongs, true);

  if (loading) {
    return <HistroySongLoadingSkeleton />;
  }

  return error?.length > 0 ? (
    <Text className="font-bold text-center my-10 text-red-500">{error}</Text>
  ) : (
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
