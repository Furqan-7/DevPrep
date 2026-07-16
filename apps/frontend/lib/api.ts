import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token from localStorage on every request (client-side only)
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    console.log("[api] token from localStorage:", token ? `${token.slice(0, 20)}…` : "null (not logged in)");
    if (token) {
      config.headers["token"] = token;
    }
  }
  return config;
});

export default api;
