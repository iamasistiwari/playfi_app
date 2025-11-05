import React from "react";
import { Image } from "expo-image";

type SongImageProps = {
  url: string;
  width?: number;
  height?: number;
};

const SongImageComponent: React.FC<SongImageProps> = ({
  url,
  width = 50,
  height = 50,
}) => {
  return (
    <Image
      style={{ width, height, borderRadius: 12 }}
      source={{ uri: url }}
      contentFit="cover"
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
