import { CustomButton } from "@/components/sub/CustomButton";
import CustomInput from "@/components/sub/CustomInput";
import { post } from "@/lib/api";
import { AppDispatch, RootState } from "@/redux/store";
import { setUser } from "@/redux/user-slice";
import { Ionicons } from "@expo/vector-icons";
import { AxiosError } from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { useDispatch, useSelector } from "react-redux";
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
  const router = useRouter();
  const token = useSelector((state: RootState) => state.user.token);
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setloading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [userDetails, setUserDetails] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = async () => {
    try {
      setloading(true);
      if (!isSignup) {
        const zodValidate = loginSchema.safeParse(userDetails);
        if (!zodValidate.success) {
          return Toast.show({
            type: "error",
            text1: "Invalid data.Try again",
            position: "top",
          });
        }
        const res = await post("/api/auth/login", {
          email: userDetails.email,
          password: userDetails.password,
        });
        const token = res?.responseData?.token;

        if (token) {
          dispatch(
            setUser({
              token,
              email: res?.responseData?.user?.email,
              name: res?.responseData?.user?.name,
            })
          );
        }
      } else {
        const zodValidate = signUpSchema.safeParse(userDetails);
        if (!zodValidate.success) {
          return Toast.show({
            type: "error",
            text1: "Invalid data. Try again",
            position: "top",
          });
        }
        await post("/api/auth/signup", {
          name: userDetails.name,
          email: userDetails.email,
          password: userDetails.password,
        });
        Toast.show({
          type: "success",
          text1: "Signup Successful! Now Login...",
          position: "top",
        });
        setUserDetails({ name: "", email: "", password: "" });
        setIsSignup(false);
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.data?.responseData?.email) {
          return Toast.show({
            type: "error",
            text1: error.response?.data?.responseData?.email,
            position: "top",
          });
        }
        if (error.response?.data?.responseData?.password) {
          return Toast.show({
            type: "error",
            text1: error.response?.data?.responseData?.password,
            position: "top",
          });
        }
      }
    } finally {
      setloading(false);
    }
  };

  useEffect(() => {
    if (token) {
      router.replace("/home");
    }
  }, [token, router]);

  return (
    <View className="min-h-[100vh] items-center justify-center w-full p-4">
      {!token && (
        <View className="w-full flex flex-col rounded-lg p-4 gap-y-4 mb-20">
          <View>
            <Text className="text-neutral-50 text-3xl text-center font-semibold">
              Welcome to PlayFi
            </Text>
            {isSignup ? (
              <View className="flex flex-row items-center justify-center ">
                <Text className="text-neutral-50 ml-3">
                  Already have an account?
                </Text>
                <CustomButton
                  className="relative -left-2"
                  variant={"link"}
                  title="signin"
                  titleClassName="text-blue-600 underline"
                  onPress={() => setIsSignup(false)}
                />
              </View>
            ) : (
              <View className="flex flex-row items-center justify-center ">
                <Text className="text-neutral-50 ml-3">New To PlayFi?</Text>
                <CustomButton
                  className="relative -left-2"
                  variant={"link"}
                  title="signup"
                  titleClassName="text-blue-600 underline"
                  onPress={() => setIsSignup(true)}
                />
              </View>
            )}
          </View>
          {isSignup && (
            <CustomInput
              label="Name"
              placeholder="Enter your name"
              value={userDetails.name}
              onChangeText={(text) =>
                setUserDetails({ ...userDetails, name: text })
              }
            />
          )}
          <CustomInput
            label="Email"
            placeholder="Enter your email"
            value={userDetails.email}
            onChangeText={(text) =>
              setUserDetails({ ...userDetails, email: text })
            }
          />
          <CustomInput
            label="Passoword"
            placeholder="Enter your passoword"
            value={userDetails.password}
            onChangeText={(text) =>
              setUserDetails({ ...userDetails, password: text })
            }
          />
          <CustomButton
            loading={loading}
            title="Save"
            icon={<Ionicons name="log-in" size={20} color="white" />}
            onPress={handleSubmit}
          />
          <Text className="text-white">{token}</Text>
        </View>
      )}
    </View>
  );
};

export default Index;
