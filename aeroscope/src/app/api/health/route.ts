import { type NextRequest, NextResponse } from "next/server";
import { applyCors, handleCorsPreflight } from "@/lib/apiCors";
import { getStatesCacheSize } from "@/lib/opensky/states";
import {
  isOpenSkyConfigured,
  isOpenSkyTokenCached,
  probeOpenSkyAuth,
} from "@/lib/opensky/tokenManager";
import {
  OPENSKY_API_MAX_DURATION,
  OPENSKY_API_REGIONS,
} from "../opensky/region";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = OPENSKY_API_REGIONS;
export const maxDuration = OPENSKY_API_MAX_DURATION;

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflight(request) ?? new Response(null, { status: 204 });
}

export async function GET(request: NextRequest) {
  const auth = await probeOpenSkyAuth();

  return applyCors(
    request,
    NextResponse.json({
    status: "online",
    endpoint: "/api/opensky?lamin=&lomin=&lamax=&lomax=",
    cachedRegions: getStatesCacheSize(),
    opensky: {
      configured: isOpenSkyConfigured(),
      tokenCached: isOpenSkyTokenCached(),
      authOk: auth.ok,
      authError: auth.error ?? null,
      vercelRegion: auth.vercelRegion,
      preferredRegions: OPENSKY_API_REGIONS,
      tokenUrl: auth.tokenUrl,
      authHostReachable: auth.authHostProbe.ok,
      authHostStatus: auth.authHostProbe.status ?? null,
      authHostError: auth.authHostProbe.error ?? null,
      apiHostReachable: auth.apiHostProbe.ok,
      apiHostStatus: auth.apiHostProbe.status ?? null,
      apiHostError: auth.apiHostProbe.error ?? null,
    },
    }),
  );
}
