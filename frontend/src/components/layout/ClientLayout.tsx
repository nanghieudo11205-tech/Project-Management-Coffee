"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import QueryProvider from "@/components/providers/QueryProvider";
import { setApiRedirectCallback } from "@/lib/api-client";
import { setRedirectCallback } from "@/lib/axios";
import { SWRProvider } from "@/lib/swr";
import { useAuthStore } from "@/stores/useAuthStore";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";
  const syncFromCookies = useAuthStore((s) => s.syncFromCookies);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    syncFromCookies();
    setRedirectCallback((path: string) => {
      router.push(path);
    });
    setApiRedirectCallback((path: string) => {
      router.push(path);
    });
  }, [router, syncFromCookies]);

  if (isLoginPage) {
    return (
      <QueryProvider>
        <main className="min-h-screen bg-slate-50">{children}</main>
      </QueryProvider>
    );
  }

  return (
    <QueryProvider>
      <SWRProvider>
        <div className="flex min-h-screen bg-slate-50 text-slate-900">
          <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
          <div className="flex-1 flex flex-col md:ml-64 min-h-screen relative min-w-0">
            <Navbar onOpenSidebar={() => setMobileMenuOpen(true)} />
            <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto w-full">{children}</main>
          </div>
        </div>
      </SWRProvider>
    </QueryProvider>
  );
}
