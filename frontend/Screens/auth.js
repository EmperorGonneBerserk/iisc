import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api";

// Function to refresh JWT token
export const refreshToken = async () => {
  try {
    const refresh = await AsyncStorage.getItem("refresh_token");
    if (!refresh) throw new Error("No refresh token available");

    const response = await api.post("/token/refresh/", { refresh });

    const { access } = response.data;
    if (access) {
      await AsyncStorage.setItem("access_token", access);
      console.log("Token refreshed successfully");
      return access;
    }
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
};

// Function to get valid access token
export const getAccessToken = async () => {
  let access = await AsyncStorage.getItem("access_token");
  if (!access) return null; // No token, user must log in

  // Try making a test request with the current access token
  try {
    const response = await api.get("/protected-route/", {
      headers: { Authorization: `Bearer ${access}` },
    });
    if (response.status === 200) return access; // Token still valid
  } catch (error) {
    if (error.response?.status === 401) {
      console.log("Access token expired, refreshing...");
      return await refreshToken(); // Attempt to refresh token
    }
  }
  return null;
};
