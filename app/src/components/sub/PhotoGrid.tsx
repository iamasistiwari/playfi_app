import { View, Image, Text } from "react-native";
import React from "react";

const PhotoGrid = ({ collageImages }: { collageImages: string[] }) => {
  if (collageImages.length === 0)
    return (
      <View
        style={{
          width: 120,
          height: 120,
          borderRadius: 8,
          overflow: "hidden",
          backgroundColor: "transparent",
          borderColor: "#737373",
          borderWidth: 0.5,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text className="text-neutral-500 text-sm font-medium">No Songs</Text>
      </View>
    );
  return (
    <View
      style={{ width: 120, height: 120, borderRadius: 8, overflow: "hidden" }}
    >
      {collageImages.length === 1 && (
        <Image
          source={{ uri: collageImages[0] }}
          style={{ width: "100%", height: "100%" }}
        />
      )}

      {collageImages.length === 2 && (
        <View style={{ flex: 1, flexDirection: "row" }}>
          {collageImages.map((img, idx) => (
            <Image
              key={idx}
              source={{ uri: img }}
              style={{ width: "50%", height: "100%" }}
            />
          ))}
        </View>
      )}

      {collageImages.length === 3 && (
        <View style={{ flex: 1 }}>
          <Image
            source={{ uri: collageImages[0] }}
            style={{ width: "100%", height: "60%" }}
          />
          <View style={{ flexDirection: "row", height: "40%" }}>
            {collageImages.slice(1).map((img, idx) => (
              <Image
                key={idx}
                source={{ uri: img }}
                style={{ width: "50%", height: "100%" }}
              />
            ))}
          </View>
        </View>
      )}

      {collageImages.length === 4 && (
        <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap" }}>
          {collageImages.map((img, idx) => (
            <Image
              key={idx}
              source={{ uri: img }}
              style={{ width: "50%", height: "50%" }}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default PhotoGrid;
