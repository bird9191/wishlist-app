import axios from "axios";
import Constants from "expo-constants";
import { tokenStorage } from "@/storage/token";

const apiUrl =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ||
  "http://localhost:8000";

export const api = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getApiBaseUrl = () => apiUrl;
