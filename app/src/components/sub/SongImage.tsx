import React from "react";
import FastImage from "react-native-fast-image";

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
    <FastImage
      style={{ width, height, borderRadius: 12 }}
      source={{
        uri: url,
      }}
      resizeMode={FastImage.resizeMode.contain}
    />
  );
};

const SongImage = React.memo(
  SongImageComponent,
  (prevProps, nextProps) => prevProps.url === nextProps.url
);

export default SongImage;
