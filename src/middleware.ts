import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getAllowedExtensionOrigin(): string | null {
  // Edge middleware can't import ~/env, read directly from process.env
  const extensionId = process.env.CHROME_EXTENSION_ID;
  if (!extensionId) return null;
  return `chrome-extension://${extensionId}`;
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");
  const allowedOrigin = getAllowedExtensionOrigin();

  if (!origin || !allowedOrigin || origin !== allowedOrigin) {
    return NextResponse.next();
  }

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const response = NextResponse.next();
  response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  return response;
}

export const config = {
  matcher: "/api/((?!auth).*)",
};
