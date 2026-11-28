import axios from "axios";
import Cookies from "js-cookie";

const axiosInstance = axios.create({
  baseURL: "/api/proxy",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let redirectCallback: ((path: string) => void) | null = null;

export function setRedirectCallback(cb: (path: string) => void) {
  redirectCallback = cb;
}

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isLoginPage = typeof window !== "undefined" && window.location.pathname === "/login";
      if (!isLoginPage) {
        Cookies.remove("token");
        Cookies.remove("role");
        Cookies.remove("username");
        if (redirectCallback) {
          redirectCallback("/login");
        } else if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
