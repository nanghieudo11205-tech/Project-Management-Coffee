import { NextResponse } from "next/server";
import { BACKEND_API_URL, setSessionCookies } from "@/lib/server-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const backendRes = await fetch(`${BACKEND_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json().catch(() => ({ message: "Đăng nhập thất bại" }));
    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    const response = NextResponse.json({
      username: data.username,
      role: data.role,
    });
    setSessionCookies(
      response,
      {
        token: data.token,
        username: data.username,
        role: data.role,
      },
      req,
    );
    return response;
  } catch {
    return NextResponse.json(
      { message: "Không thể kết nối tới máy chủ xác thực" },
      { status: 502 },
    );
  }
}
