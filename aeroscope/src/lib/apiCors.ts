import type { NextRequest } from "next/server";

/**
 * CORS for /api/* — see https://vercel.com/kb/guide/how-to-enable-cors
 * Aeroscope UI calls same-origin /api/opensky; these headers help preview/custom domains.
 */

const ALLOW_METHODS = "GET, POST, OPTIONS";
const ALLOW_HEADERS = "Content-Type, Authorization";

function deploymentOrigins(): string[] {
  const list: string[] = [];
  const add = (url: string | undefined) => {
    if (!url) return;
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    list.push(normalized.replace(/\/$/, ""));
  };

  add(process.env.NEXT_PUBLIC_APP_URL);
  add(process.env.VERCEL_URL);
  add(process.env.VERCEL_BRANCH_URL);
  add(process.env.VERCEL_PROJECT_PRODUCTION_URL);

  const extra = process.env.CORS_ALLOWED_ORIGINS?.trim();
  if (extra) {
    list.push(
      ...extra
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean),
    );
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

  return deploymentOrigins().includes(origin);
}

export function corsHeaders(request: NextRequest): Record<string, string> {
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

export function applyCors(request: NextRequest, response: Response): Response {
  for (const [key, value] of Object.entries(corsHeaders(request))) {
    response.headers.set(key, value);
  }
  return response;
}

/** OPTIONS preflight — must succeed when Vercel Deployment Protection is enabled. */
export function corsPreflightResponse(request: NextRequest): Response {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(request),
  });
}
