import AsyncStorage from "@react-native-async-storage/async-storage";
import Reactotron from "reactotron-react-native";
import axiosInstance from "./api/api";

if (__DEV__) {
  Reactotron.setAsyncStorageHandler(AsyncStorage)
    .configure({
      name: "Hana Market",
    })
    .useReactNative({
      asyncStorage: false,
      networking: {
        ignoreUrls: /symbolicate/,
      },
      editor: false,
      errors: { veto: () => false },
      overlay: false,
    })
    .connect();

  // Log API requests
  axiosInstance.interceptors.request.use((config) => {
    Reactotron.display({
      name: "⬆️ API Request",
      preview: `${config.method?.toUpperCase()} ${config.url}`,
      value: {
        url: config.baseURL + config.url,
        method: config.method,
        params: config.params,
        data: config.data,
      },
    });
    return config;
  });

  // Log API responses and errors
  axiosInstance.interceptors.response.use(
    (response) => {
      Reactotron.display({
        name: "⬇️ API Response",
        preview: `${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`,
        value: {
          status: response.status,
          url: response.config.url,
          data: response.data,
        },
      });
      return response;
    },
    (error) => {
      Reactotron.display({
        name: "❌ API Error",
        preview: `${error.config?.method?.toUpperCase()} ${error.config?.url} → ${error.response?.status ?? "Network Error"}`,
        value: {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        },
        important: true,
      });
      return Promise.reject(error);
    }
  );

  console.tron = Reactotron;
  console.log("[Reactotron] Connected — open Reactotron desktop app");
}