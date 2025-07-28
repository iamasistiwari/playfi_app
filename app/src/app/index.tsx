import { View, Text } from "react-native";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});
const signUpSchema = z.object({
  name: z.string().min(4),
  email: z.email(),
  password: z.string().min(8),
});

const Index = () => {
  const [loading, setloading] = useState(false);
  const loginForm = useForm<{
    email: string;
    password: string;
  }>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const signUpForm = useForm<{
    name: string;
    email: string;
    password: string;
  }>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });
  return <View className="min-h-[100vh] border"></View>;
};

export default Index;
