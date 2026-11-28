import Cookies from "js-cookie";
import { create } from "zustand";

export type UserRole = "ADMIN" | "MANAGER" | "EMPLOYEE" | "STAFF";

export interface UserState {
  username: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  setAuth: (payload: { username: string; role: string }) => void;
  logout: () => Promise<void>;
  syncFromCookies: () => void;
}

/**
 * Zustand Store quản lý trạng thái người dùng (JWT được lưu trong HttpOnly cookie qlcafe_token)
 */
export const useAuthStore = create<UserState>((set) => ({
  username: null,
  role: null,
  isAuthenticated: false,

  setAuth: ({ username, role }) => {
    set({
      username,
      role: role as UserRole,
      isAuthenticated: true,
    });
  },

  logout: async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Bỏ qua lỗi mạng khi đăng xuất
    } finally {
      Cookies.remove("token");
      Cookies.remove("role");
      Cookies.remove("username");
      set({
        username: null,
        role: null,
        isAuthenticated: false,
      });
    }
  },

  syncFromCookies: () => {
    const role = (Cookies.get("role") as UserRole) || null;
    const username = Cookies.get("username") || null;
    set({
      role,
      username,
      isAuthenticated: Boolean(username && role),
    });
  },
}));
