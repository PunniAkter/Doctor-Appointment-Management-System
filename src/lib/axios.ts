import axios, { AxiosError, AxiosRequestHeaders } from "axios";

export const api = axios.create({
  baseURL: "https://appointment-manager-node.onrender.com/api/v1",
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token && token !== "undefined" && token !== "null") {
      const headers = (config.headers ?? {}) as AxiosRequestHeaders;
      headers.Authorization = `Bearer ${token}`;
      config.headers = headers;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error: unknown) => {
    const ax = error as AxiosError;
    const status = ax.response?.status;

    if ((status === 401 || status === 403) && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");

      const current = window.location.pathname + window.location.search;
      if (!current.startsWith("/auth/")) {
        window.location.href = `/auth/login?redirect=${encodeURIComponent(current)}`;
      }
    }
    return Promise.reject(error);
  }
);
