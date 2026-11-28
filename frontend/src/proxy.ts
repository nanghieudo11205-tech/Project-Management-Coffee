import { type NextRequest, NextResponse } from "next/server";

const TOKEN_COOKIE_NAME = "qlcafe_token";

const ADMIN_ONLY_ROUTES = ["/accounts"];
const MANAGER_AND_ADMIN_ROUTES = ["/dashboard", "/products", "/order-history", "/ai-assistant"];

function defaultHomeForRole(role: string | undefined): string {
  if (role === "EMPLOYEE" || role === "STAFF") {
    return "/orders";
  }
  return "/dashboard";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;
  const role = request.cookies.get("role")?.value?.toUpperCase();

  if (pathname === "/login") {
    if (token) {
      return NextResponse.redirect(new URL(defaultHomeForRole(role), request.url));
    }
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (ADMIN_ONLY_ROUTES.some((route) => pathname.startsWith(route)) && role !== "ADMIN") {
    return NextResponse.redirect(new URL(defaultHomeForRole(role), request.url));
  }

  if (
    MANAGER_AND_ADMIN_ROUTES.some((route) => pathname.startsWith(route)) &&
    role !== "ADMIN" &&
    role !== "MANAGER"
  ) {
    return NextResponse.redirect(new URL("/orders", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/tables/:path*",
    "/orders/:path*",
    "/products/:path*",
    "/order-history/:path*",
    "/staff-orders/:path*",
    "/accounts/:path*",
    "/ai-assistant/:path*",
  ],
};
