import React from "react";
import { Image } from "react-native";

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
    <Image source={{ uri: url }} style={{ width, height, borderRadius: 12 }} />
  );
};

const SongImage = React.memo(
  SongImageComponent,
  (prevProps, nextProps) => prevProps.url === nextProps.url
);

export default SongImage;
