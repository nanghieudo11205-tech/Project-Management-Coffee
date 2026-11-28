import { NextResponse } from "next/server";
import { BACKEND_API_URL } from "@/lib/server-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const backendRes = await fetch(`${BACKEND_API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await backendRes.json().catch(() => ({ message: "Yêu cầu thất bại" }));
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json({ message: "Không thể kết nối tới máy chủ" }, { status: 502 });
  }
}
