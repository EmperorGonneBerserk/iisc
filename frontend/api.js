import axios from "axios";

const API_URL = "http://127.0.0.1:5000/api/"; // Change to your Django backend

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Ensures cookies (including sessionid and csrftoken) are sent
});

export const getCsrfToken = async () => {
  try {
    const response = await api.get("csrf/");
    const csrfToken = response.data.csrfToken;
    console.log("CSRF Token:", csrfToken);
    return csrfToken;
  } catch (error) {
    console.error("Error fetching CSRF token:", error);
    return null;
  }
};

export default api;
