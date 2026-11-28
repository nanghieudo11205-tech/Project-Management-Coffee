import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export const BACKEND_API_URL =
  process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export const TOKEN_COOKIE_NAME = "qlcafe_token";

export function isHttpsRequest(req?: Request): boolean {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (!req) return false;
  const forwardedProto = req.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0].trim().toLowerCase() === "https";
  }
  return req.url.startsWith("https://");
}

export function setSessionCookies(
  response: NextResponse,
  session: { token: string; username: string; role: string },
  req?: Request,
) {
  const isSecure = isHttpsRequest(req);
  const maxAge = 60 * 60 * 24; // 24h matching JWT expiration

  response.cookies.set(TOKEN_COOKIE_NAME, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
    path: "/",
    maxAge,
  });

  response.cookies.set("role", session.role, {
    httpOnly: false,
    sameSite: "lax",
    secure: isSecure,
    path: "/",
    maxAge,
  });

  response.cookies.set("username", session.username, {
    httpOnly: false,
    sameSite: "lax",
    secure: isSecure,
    path: "/",
    maxAge,
  });

  // Clean up any legacy JS-accessible token cookie
  response.cookies.delete("token");
}

export function clearSessionCookies(response: NextResponse) {
  response.cookies.delete(TOKEN_COOKIE_NAME);
  response.cookies.delete("token");
  response.cookies.delete("role");
  response.cookies.delete("username");
}

export async function getServerAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_COOKIE_NAME)?.value ?? null;
}
