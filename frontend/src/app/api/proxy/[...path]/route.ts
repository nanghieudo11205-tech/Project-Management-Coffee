import { type NextRequest, NextResponse } from "next/server";
import { BACKEND_API_URL, clearSessionCookies, getServerAuthToken } from "@/lib/server-auth";

async function forwardRequest(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const token = await getServerAuthToken();
  if (!token) {
    return NextResponse.json(
      { status: 401, message: "Phiên đăng nhập đã hết hạn hoặc chưa đăng nhập" },
      { status: 401 },
    );
  }

  const { path } = await context.params;
  const targetPath = path.join("/");
  const search = req.nextUrl.search;
  const targetUrl = `${BACKEND_API_URL}/${targetPath}${search}`;

  const forwardHeaders = new Headers();
  forwardHeaders.set("Authorization", `Bearer ${token}`);
  const contentType = req.headers.get("content-type");
  if (contentType) {
    forwardHeaders.set("Content-Type", contentType);
  }

  const hasBody = !["GET", "HEAD"].includes(req.method.toUpperCase());
  const bodyBuffer = hasBody ? await req.arrayBuffer() : undefined;

  try {
    const backendRes = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: bodyBuffer && bodyBuffer.byteLength > 0 ? bodyBuffer : undefined,
      cache: "no-store",
    });

    const responseText = await backendRes.text();
    const resContentType = backendRes.headers.get("content-type") || "application/json";

    const nextRes = new NextResponse(responseText, {
      status: backendRes.status,
      headers: { "Content-Type": resContentType },
    });

    if (backendRes.status === 401) {
      clearSessionCookies(nextRes);
    }

    return nextRes;
  } catch {
    return NextResponse.json(
      { status: 502, message: "Không thể kết nối tới máy chủ Backend" },
      { status: 502 },
    );
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forwardRequest(req, context);
}

export async function POST(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forwardRequest(req, context);
}

export async function PUT(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forwardRequest(req, context);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forwardRequest(req, context);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forwardRequest(req, context);
}
