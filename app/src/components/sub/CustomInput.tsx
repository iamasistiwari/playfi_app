import { View, Text, TextInput } from "react-native";
import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface CustomInputProps {
  label?: string;
  className?: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  icon?: React.ReactNode; // 👈 Optional icon prop
}

const CustomInput = ({
  label,
  placeholder,
  value,
  className,
  onChangeText,
  icon,
}: CustomInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className={cn("flex flex-col space-y-1")}>
      {label && (
        <Text id="label" className="text-neutral-50 text-base font-semibold">
          {label}
        </Text>
      )}

      <View
        className={cn(
          "flex-row items-center rounded-lg h-14",
          isFocused
            ? "border-2 border-secondary bg-neutral-900"
            : "border border-neutral-800 bg-neutral-800",
          className
        )}
      >
        {icon && <View className="pl-4 pr-2">{icon}</View>}

        <TextInput
          className={cn(
            "flex-1 h-full text-white placeholder:font-semibold tracking-wide placeholder:text-neutral-400 placeholder:text-xl",
            icon ? "pr-4" : "px-4"
          )}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor="#94a3b8"
          style={{ color: "#ffffff" }}
          selectionColor="#94a3b8"
        />
      </View>
    </View>
  );
};

export default CustomInput;
