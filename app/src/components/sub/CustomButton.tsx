import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  TouchableOpacityProps,
} from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "flex flex-row items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-secondary text-white",
        destructive: "bg-red-600 text-white",
        outline: "border border-secondary text-white bg-transparent",
        ghost: "bg-transparent text-gray-600",
        link: "text-blue-600 underline",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 px-3 py-1 text-sm",
        lg: "h-12 px-6 py-3 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends TouchableOpacityProps,
    VariantProps<typeof buttonVariants> {
  title?: string;
  loading?: boolean;
  className?: string;
  titleClassName?: string;
  icon?: React.ReactNode;
}

const CustomButton = React.forwardRef<View, ButtonProps>(
  (
    {
      title,
      variant,
      size,
      disabled,
      loading = false,
      className,
      icon,
      titleClassName,
      ...props
    },
    ref
  ) => {
    return (
      <TouchableOpacity
        ref={ref}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            {icon && <View>{icon}</View>}
            {title && (
              <Text
                className={cn(
                  "text-base font-semibold text-white",
                  titleClassName
                )}
              >
                {title}
              </Text>
            )}
          </>
        )}
      </TouchableOpacity>
    );
  }
);

CustomButton.displayName = "Button";

export { CustomButton, buttonVariants };
