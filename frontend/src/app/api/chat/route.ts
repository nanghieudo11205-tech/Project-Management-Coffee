import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { BACKEND_API_URL, getServerAuthToken } from "@/lib/server-auth";

interface ChatMessage {
  role: "user" | "ai" | string;
  content: string;
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set in the environment variables.");
}
const genAI = new GoogleGenerativeAI(apiKey || "dummy_key");

export async function POST(req: Request) {
  const token = await getServerAuthToken();
  if (!token) {
    return NextResponse.json({ error: "Bạn cần đăng nhập để sử dụng Trợ lý AI" }, { status: 401 });
  }

  try {
    const meRes = await fetch(`${BACKEND_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!meRes.ok) {
      return NextResponse.json({ error: "Phiên đăng nhập không hợp lệ" }, { status: 401 });
    }
    const me = (await meRes.json()) as { role?: string };
    if (me.role !== "ADMIN" && me.role !== "MANAGER") {
      return NextResponse.json({ error: "Bạn không có quyền sử dụng Trợ lý AI" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Không thể xác thực quyền truy cập" }, { status: 502 });
  }

  try {
    const { message, contextData, history } = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemInstruction = `
    Bạn là một trợ lý ảo thông minh (AI Assistant) chuyên phân tích dữ liệu kinh doanh cho một quán Cà Phê. 
    Bạn được cung cấp dữ liệu thực tế về doanh thu, các đơn hàng (bao gồm chi tiết món), và danh sách sản phẩm từ hệ thống.
    
    Dữ liệu hệ thống hiện tại để bạn tham khảo:
    ${JSON.stringify(contextData)}
    
    Yêu cầu:
    1. Dựa vào dữ liệu trên (đặc biệt là 'topSellingProducts' và 'recentOrdersWithDetails') để trả lời câu hỏi của Quản lý một cách chính xác.
    2. Nếu được hỏi "món nào bán chạy nhất", hãy dùng 'topSellingProducts' để liệt kê tên món, số lượng bán ra và tổng doanh thu mang lại.
    3. Đưa ra lời khuyên kinh doanh sâu sắc (món nào bán chạy, doanh thu ngày nào thấp, gợi ý combo...).
    4. Trình bày bằng tiếng Việt, ngắn gọn, súc tích, dễ hiểu.
    5. Nếu câu hỏi không liên quan đến quán cà phê hoặc không có trong dữ liệu, hãy lịch sự từ chối hoặc trả lời chung chung.
    `;

    let fullPrompt = `${systemInstruction}\n\nLịch sử trò chuyện:\n`;
    if (history && history.length > 0) {
      history.forEach((msg: ChatMessage) => {
        fullPrompt += `${msg.role === "user" ? "Quản lý" : "Trợ lý AI"}: ${msg.content}\n`;
      });
    }

    fullPrompt += `\nQuản lý: ${message}\nTrợ lý AI:`;

    const result = await model.generateContent(fullPrompt);
    const responseText = result.response.text();

    return NextResponse.json({ reply: responseText });
  } catch (error: unknown) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi kết nối với AI (Kiểm tra lại GEMINI_API_KEY)" },
      { status: 500 },
    );
  }
}
