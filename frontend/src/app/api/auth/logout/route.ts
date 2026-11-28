import { NextResponse } from "next/server";
import { BACKEND_API_URL, clearSessionCookies, getServerAuthToken } from "@/lib/server-auth";

export async function POST() {
  const token = await getServerAuthToken();
  if (token) {
    try {
      await fetch(`${BACKEND_API_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Vẫn xóa cookie phía trình duyệt nếu backend tạm không phản hồi
    }
  }

  const response = NextResponse.json({ message: "Đăng xuất thành công" });
  clearSessionCookies(response);
  return response;
}
