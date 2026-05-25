import { NextResponse } from "next/server";
import { getStatesCacheSize } from "@/lib/opensky/states";
import { getOpenSkyTokenManager } from "@/lib/opensky/tokenManager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const tokenManager = getOpenSkyTokenManager();
  return NextResponse.json({
    status: "online",
    endpoint: "/api/opensky?lamin=&lomin=&lamax=&lomax=",
    cachedRegions: getStatesCacheSize(),
    tokenConfigured: tokenManager.isConfigured(),
    tokenValid: tokenManager.isTokenValid(),
  });
}
