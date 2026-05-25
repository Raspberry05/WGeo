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
      tokenUrl: auth.tokenUrl,
      authHostReachable: auth.authHostProbe.ok,
      authHostStatus: auth.authHostProbe.status ?? null,
      authHostError: auth.authHostProbe.error ?? null,
      apiHostReachable: auth.apiHostProbe.ok,
      apiHostStatus: auth.apiHostProbe.status ?? null,
      apiHostError: auth.apiHostProbe.error ?? null,
    },
  });
}
