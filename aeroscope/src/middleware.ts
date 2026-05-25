import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { corsHeaders, handleCorsPreflight } from "@/lib/apiCors";

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const preflight = handleCorsPreflight(request);
  if (preflight) {
    return preflight;
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(corsHeaders(request))) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
