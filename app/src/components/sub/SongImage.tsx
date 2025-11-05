import React from "react";
import { Image, ImageContentFit } from "expo-image";
import { ImageStyle, StyleProp } from "react-native";

type SongImageProps = {
  url: string;
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
};

const SongImageComponent: React.FC<SongImageProps> = ({
  url,
  width = 50,
  height = 50,
  style,
  contentFit = "cover",
}) => {
  return (
    <Image
      style={style}
      source={{ uri: url }}
      contentFit={contentFit} 
      transition={200}
      cachePolicy="disk"
      priority="high"
      recyclingKey={url}
    />
  );
};

const SongImage = React.memo(
  SongImageComponent,
  (prevProps, nextProps) => prevProps.url === nextProps.url
);

export default SongImage;
