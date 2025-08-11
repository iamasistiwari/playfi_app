import { View, Text } from "react-native";
import React from "react";
import { cn } from "@/lib/utils";

export default function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <View
      className={cn(
        "bg-neutral-700 animate-pulse w-40 h-10 rounded-3xl",
        className
      )}
    ></View>
  );
}

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
