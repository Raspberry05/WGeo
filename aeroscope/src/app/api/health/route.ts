import { NextResponse } from "next/server";
import { getStatesCacheSize } from "@/lib/opensky/states";
import {
  isOpenSkyConfigured,
  isOpenSkyTokenCached,
  probeOpenSkyAuth,
} from "@/lib/opensky/tokenManager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = ["fra1", "cdg1", "ams1", "lhr1"];
export const maxDuration = 30;

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
      vercelRegion: auth.vercelRegion,
      preferredRegions: ["fra1", "cdg1", "ams1", "lhr1"],
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
