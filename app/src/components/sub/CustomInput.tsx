import { View, Text, TextInput, TextInputProps } from "react-native";
import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface CustomInputProps extends Omit<TextInputProps, 'className'> {
  label?: string;
  className?: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  icon?: React.ReactNode;
  iconClassName?: string;
  inputRef?: React.RefObject<TextInput>;
}

const CustomInput = ({
  label,
  placeholder,
  value,
  className,
  onChangeText,
  icon,
  iconClassName,
  inputRef,
  ...textInputProps
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
          "flex-row items-center rounded-lg h-14 transition-all duration-500 ease-in-out",
          isFocused
            ? "border-2 border-secondary bg-neutral-900"
            : "border border-neutral-800 bg-neutral-800",
          className
        )}
      >
        {icon && <View className={cn("pl-4 pr-2", iconClassName)}>{icon}</View>}

        <TextInput
          className={cn(
            "flex-1 h-full text-white placeholder:font-semibold tracking-wide placeholder:text-neutral-400 placeholder:text-xl",
            icon ? "pr-4" : "px-4"
          )}
          ref={inputRef} 
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor="#94a3b8"
          style={{ color: "#ffffff" }}
          selectionColor="#94a3b8"
          {...textInputProps}
        />
      </View>
    </View>
  );
};

export default CustomInput;
