import { NextResponse } from "next/server";
import { getStatesCacheSize } from "@/lib/opensky/states";
import {
  isOpenSkyConfigured,
  isOpenSkyTokenCached,
  probeOpenSkyAuth,
} from "@/lib/opensky/tokenManager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await probeOpenSkyAuth();

  return NextResponse.json({
    status: "online",
    endpoint: "/api/opensky?lamin=&lomin=&lamax=&lomax=",
    cachedRegions: getStatesCacheSize(),
    opensky: {
      configured: isOpenSkyConfigured(),
      tokenCached: isOpenSkyTokenCached(),
      authOk: auth.ok,
      authError: auth.error ?? null,
    },
  });
}
