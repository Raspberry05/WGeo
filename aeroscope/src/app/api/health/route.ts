import { NextResponse } from "next/server";
import { getStatesCacheSize } from "@/lib/opensky/states";
import {
  OPENSKY_PRIMARY_VERCEL_REGION,
  OPENSKY_VERCEL_REGIONS,
  isOpenSkyVercelRegion,
} from "@/lib/opensky/regions";
import {
  isOpenSkyConfigured,
  isOpenSkyTokenCached,
  probeOpenSkyAuth,
} from "@/lib/opensky/tokenManager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  const auth = await probeOpenSkyAuth();
  const vercelRegion = auth.vercelRegion;
  const regionMismatch = !isOpenSkyVercelRegion(vercelRegion);

  return NextResponse.json({
    status: "online",
    endpoint: "/api/opensky?lamin=&lomin=&lamax=&lomax=",
    cachedRegions: getStatesCacheSize(),
    opensky: {
      configured: isOpenSkyConfigured(),
      tokenCached: isOpenSkyTokenCached(),
      authOk: auth.ok,
      authError: auth.error ?? null,
      vercelRegion,
      expectedRegions: [...OPENSKY_VERCEL_REGIONS],
      primaryRegion: OPENSKY_PRIMARY_VERCEL_REGION,
      regionConfigSource: "vercel.json regions + functions.regions",
      regionMismatch,
      regionHint: regionMismatch
        ? `Function ran in ${vercelRegion ?? "unknown"} but OpenSky needs EU (e.g. ${OPENSKY_PRIMARY_VERCEL_REGION}). Commit vercel.json with "regions": ["fra1"], redeploy, or set Vercel → Project → Settings → Functions → Function Region to Frankfurt.`
        : null,
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
