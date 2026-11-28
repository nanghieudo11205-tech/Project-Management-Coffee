import { NextResponse } from "next/server";
import { BACKEND_API_URL, clearSessionCookies, getServerAuthToken } from "@/lib/server-auth";

export async function GET() {
  const token = await getServerAuthToken();
  if (!token) {
    return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
  }

  try {
    const backendRes = await fetch(`${BACKEND_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const data = await backendRes.json().catch(() => ({ message: "Phiên đăng nhập không hợp lệ" }));
    if (!backendRes.ok) {
      const res = NextResponse.json(data, { status: backendRes.status });
      if (backendRes.status === 401) {
        clearSessionCookies(res);
      }
      return res;
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: "Không thể xác thực phiên làm việc" }, { status: 502 });
  }
}
