import AsyncStorage from "@react-native-async-storage/async-storage";
let cachedToken: string | null = null;

export const resetStorage = async () => {
  cachedToken = null;
  await AsyncStorage.clear();
};
export const getToken = async (): Promise<string | null> => {
  try {
    if (cachedToken) {
      return cachedToken;
    }
    const json = await AsyncStorage.getItem("persist:root");
    if (!json) return null;

    const rootState = JSON.parse(json);
    const user = JSON.parse(rootState.user || "{}");
    cachedToken = user.token || null;
    return cachedToken;
  } catch (e) {
    return null;
  }
};
