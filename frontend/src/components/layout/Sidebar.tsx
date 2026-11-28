"use client";
import Cookies from "js-cookie";
import {
  ClipboardList,
  Coffee,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { mutate } from "swr";
import { axiosFetcher } from "@/lib/swr";
import { useAuthStore } from "@/stores/useAuthStore";

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const storeRole = useAuthStore((s) => s.role);
  const [role, setRole] = useState<string | undefined>(undefined);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setRole(storeRole || Cookies.get("role"));
    setMounted(true);
  }, [storeRole]);

  const handleLogout = async () => {
    await logout();
    await mutate(() => true, undefined, { revalidate: false });
    onClose?.();
    router.push("/login");
  };

  const handlePrefetch = useCallback((keys: string[]) => {
    keys.forEach((key) => {
      mutate(key, axiosFetcher(key), { revalidate: false });
    });
  }, []);

  const navItems = [
    {
      name: "Trang chủ",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["ADMIN", "MANAGER"],
      prefetchKeys: ["/orders", "/products?size=1000", "/tables"],
    },
    {
      name: "Sản phẩm",
      href: "/products",
      icon: Coffee,
      roles: ["ADMIN", "MANAGER"],
      prefetchKeys: ["/products?page=0&size=10", "/categories"],
    },
    {
      name: "Sơ đồ bàn",
      href: "/tables",
      icon: UtensilsCrossed,
      roles: ["ADMIN", "MANAGER", "EMPLOYEE", "STAFF"],
      prefetchKeys: ["/tables", "/orders"],
    },
    {
      name: "Đặt hàng POS",
      href: "/orders",
      icon: UtensilsCrossed,
      roles: ["ADMIN", "MANAGER", "EMPLOYEE", "STAFF"],
      prefetchKeys: ["/products?size=1000", "/categories", "/tables"],
    },
    {
      name: "Lịch sử đơn hàng",
      href: "/staff-orders",
      icon: ClipboardList,
      roles: ["EMPLOYEE", "STAFF"],
      prefetchKeys: ["/orders"],
    },
    {
      name: "Quản lý đơn hàng",
      href: "/order-history",
      icon: ClipboardList,
      roles: ["ADMIN", "MANAGER"],
      prefetchKeys: ["/orders", "/tables"],
    },
    {
      name: "Quản lý tài khoản",
      href: "/accounts",
      icon: Users,
      roles: ["ADMIN"],
      prefetchKeys: ["/accounts"],
    },
    {
      name: "Chatbot AI",
      href: "/ai-assistant",
      icon: MessageSquareText,
      roles: ["ADMIN", "MANAGER"],
      prefetchKeys: [],
    },
  ];

  if (pathname === "/login") return null;

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`w-64 h-screen bg-slate-900 text-white flex flex-col fixed left-0 top-0 border-r border-slate-800 z-50 transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 p-2 rounded-lg text-slate-900 shadow-lg shadow-amber-500/20">
              <Coffee size={32} />
            </div>
            <span className="text-xl font-bold text-white tracking-wide">Coffee Chill</span>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng menu"
              className="md:hidden text-slate-400 hover:text-white p-1.5 rounded-lg"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1.5 mt-2 overflow-y-auto">
          {mounted &&
            navItems.map((item) => {
              if (!item.roles.includes(role || "EMPLOYEE")) return null;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  onMouseEnter={() => handlePrefetch(item.prefetchKeys)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-amber-500 text-slate-900 font-semibold shadow-lg shadow-amber-500/20"
                      : "hover:bg-slate-800 text-slate-300 hover:text-white"
                  }`}
                >
                  <item.icon size={20} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-medium cursor-pointer"
          >
            <LogOut size={20} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
}
