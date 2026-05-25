import type { NextRequest } from "next/server";

const ALLOW_METHODS = "GET, POST, OPTIONS";
const ALLOW_HEADERS = "Content-Type, Authorization";

function parseAllowedOrigins(): string[] {
  const fromEnv = process.env.CORS_ALLOWED_ORIGINS?.trim();
  const list: string[] = [];

  if (fromEnv) {
    list.push(
      ...fromEnv
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean),
    );
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    list.push(`https://${vercelUrl}`);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) {
    list.push(appUrl.replace(/\/$/, ""));
  }

  return list;
}

function isOriginAllowed(origin: string, request: NextRequest): boolean {
  if (origin === request.nextUrl.origin) {
    return true;
  }

  if (process.env.NODE_ENV === "development") {
    return (
      origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:")
    );
  }

  const allowed = parseAllowedOrigins();
  return allowed.includes(origin);
}

/** CORS headers for /api routes (browser clients on other origins). */
export function corsHeaders(
  request: NextRequest,
): Record<string, string> {
  const origin = request.headers.get("origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": ALLOW_METHODS,
    "Access-Control-Allow-Headers": ALLOW_HEADERS,
    "Access-Control-Max-Age": "86400",
  };

  if (origin && isOriginAllowed(origin, request)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }

  return headers;
}

export function applyCors(
  request: NextRequest,
  response: Response,
): Response {
  const headers = corsHeaders(request);
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

export function handleCorsPreflight(request: NextRequest): Response | null {
  if (request.method !== "OPTIONS") {
    return null;
  }

  return new Response(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}
