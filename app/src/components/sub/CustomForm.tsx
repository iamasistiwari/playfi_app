import { View, Text } from "react-native";
import React, { ReactNode } from "react";
import { FormProvider, type UseFormReturn } from "react-hook-form";

interface FormProviderWrapperProps {
  form: UseFormReturn<any>;
  onSubmit: (data: any) => void | Promise<void>;
  children: ReactNode;
  className?: string;
}

const CustomForm = ({
  form,
  onSubmit,
  children,
  className,
}: FormProviderWrapperProps) => {
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={className}>
        {children}
      </form>
    </FormProvider>
  );
};

export default CustomForm;
