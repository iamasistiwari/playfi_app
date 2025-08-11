import { View, Image } from "react-native";
import React from "react";

const PhotoGrid = ({ collageImages }: { collageImages: string[] }) => {
  if (collageImages.length === 0) return null;
  return (
    <View
      style={{ width: 130, height: 130, borderRadius: 8, overflow: "hidden" }}
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
