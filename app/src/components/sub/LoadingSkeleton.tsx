import { View, Text } from "react-native";
import React from "react";
import { cn } from "@/lib/utils";

const LoadingSkeleton = ({ className }: { className?: string }) => {
  return (
    <View
      className={cn(
        "bg-neutral-700 animate-pulse w-40 h-10 rounded-3xl",
        className
      )}
    ></View>
  );
};

export default LoadingSkeleton;

export const HistroySongLoadingSkeleton = ({
  className,
}: {
  className?: string;
}) => {
  return (
    <View
      className={cn(
        "flex flex-row flex-wrap gap-2 mt-8 items-center",
        className
      )}
    >
      <LoadingSkeleton className="w-56" />
      <LoadingSkeleton className="w-32" />
      <LoadingSkeleton className="w-32" />
      <LoadingSkeleton className="w-56" />
      <LoadingSkeleton className="w-52" />
      <LoadingSkeleton className="w-32" />
      <LoadingSkeleton className="w-32" />
      <LoadingSkeleton className="w-60" />
    </View>
  );
};

export const SongLoadingSkeleton = ({ className }: { className?: string }) => {
  return (
    <View
      className={cn(
        "flex flex-row flex-wrap gap-4 mt-8 items-center px-2",
        className
      )}
    >
      <LoadingSkeleton className="w-full h-[75px] bg-neutral-800" />
      <LoadingSkeleton className="w-full h-[75px] bg-neutral-800" />

      <LoadingSkeleton className="w-full h-[75px] bg-neutral-800" />
      <LoadingSkeleton className="w-full h-[75px] bg-neutral-800" />
      <LoadingSkeleton className="w-full h-[75px] bg-neutral-800" />
    </View>
  );
};
