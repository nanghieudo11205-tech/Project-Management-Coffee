"use client";
import Cookies from "js-cookie";
import { Bell, Menu, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";

interface NavbarProps {
  onOpenSidebar?: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Quản trị viên",
  MANAGER: "Quản lý quán",
  EMPLOYEE: "Nhân viên",
  STAFF: "Nhân viên",
};

export default function Navbar({ onOpenSidebar }: NavbarProps) {
  const pathname = usePathname();
  const storeRole = useAuthStore((s) => s.role);
  const storeUsername = useAuthStore((s) => s.username);
  const [role, setRole] = useState<string | undefined>("");
  const [username, setUsername] = useState<string | undefined>("");

  useEffect(() => {
    setRole(storeRole || Cookies.get("role"));
    setUsername(storeUsername || Cookies.get("username"));
  }, [storeRole, storeUsername]);

  if (pathname === "/login") return null;

  const pageTitle =
    pathname === "/dashboard"
      ? "Bảng điều khiển"
      : pathname === "/tables"
        ? "Quản lý bàn"
        : pathname === "/orders"
          ? "Bán hàng POS"
          : pathname === "/products"
            ? "Quản lý sản phẩm"
            : pathname === "/accounts"
              ? "Quản lý tài khoản"
              : pathname === "/order-history"
                ? "Quản lý đơn hàng"
                : pathname === "/staff-orders"
                  ? "Lịch sử đơn hàng"
                  : "Trợ lý AI";

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {onOpenSidebar && (
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label="Mở menu điều hướng"
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <Menu size={24} />
          </button>
        )}
        <h2 className="text-xl md:text-2xl font-bold text-slate-800">{pageTitle}</h2>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <button
          type="button"
          aria-label="Thông báo"
          className="relative p-2 text-slate-400 hover:text-amber-500 transition-colors"
        >
          <Bell size={22} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
        </button>

        <div className="flex items-center gap-3 pl-4 md:pl-6 border-l border-slate-200">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
            <User size={20} />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-700">Hi, {username || "Người dùng"}</p>
            <p className="text-xs text-slate-500 font-medium">
              {ROLE_LABELS[role || ""] || "Nhân viên"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
