import axios, { AxiosRequestConfig, Method } from "axios";
import { getToken } from "./get-token";

export const BASE_URL = "https://playfi-primary-backend.ashishtiwari.net";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 100000,
  headers: {
    "Content-Type": "application/json",
  },
});

const apiCall = async <T = any>(
  method: Method,
  endpoint: string,
  payload: any,
  additionalConfig: AxiosRequestConfig = {}
): Promise<T> => {
  const token = await getToken();
  const headers: any = {
    ...additionalConfig.headers,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config: AxiosRequestConfig = {
    method,
    url: endpoint,
    ...additionalConfig,
    headers,
  };

  if (payload !== null) {
    if (method.toLowerCase() === "get") {
      config.params = payload;
    } else {
      config.data = payload;
    }
  }

  try {
    const response = await axiosInstance(config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const get = <T = any>(endpoint: string, params = null, config = {}) =>
  apiCall<T>("get", endpoint, params, config);

export const post = <T = any>(endpoint: string, data = {}, config = {}) =>
  apiCall<T>("post", endpoint, data, config);

export const put = <T = any>(endpoint: string, data = null, config = {}) =>
  apiCall<T>("put", endpoint, data, config);

export const del = <T = any>(endpoint: string, config = {}) =>
  apiCall<T>("delete", endpoint, null, config);

export default axiosInstance;
