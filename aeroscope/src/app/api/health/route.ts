import { NextResponse } from "next/server";
import {
  getOpenSkyStatesUrl,
  getOpenSkyTokenUrl,
  isOpenSkyProxyConfigured,
} from "@/lib/opensky/endpoints";
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
  const usingProxy = isOpenSkyProxyConfigured();
  const directUnreachable =
    !usingProxy &&
    !regionMismatch &&
    !auth.apiHostProbe.ok &&
    !auth.authHostProbe.ok;

  return NextResponse.json({
    status: "online",
    endpoint: "/api/opensky?lamin=&lomin=&lamax=&lomax=",
    cachedRegions: getStatesCacheSize(),
    opensky: {
      configured: isOpenSkyConfigured(),
      tokenCached: isOpenSkyTokenCached(),
      authOk: auth.ok,
      authError: auth.error ?? null,
      usingProxy,
      statesUrl: getOpenSkyStatesUrl(),
      tokenUrl: getOpenSkyTokenUrl(),
      vercelRegion,
      expectedRegions: [...OPENSKY_VERCEL_REGIONS],
      primaryRegion: OPENSKY_PRIMARY_VERCEL_REGION,
      regionConfigSource: "vercel.json regions + functions.regions",
      regionMismatch,
      regionHint: regionMismatch
        ? `Function ran in ${vercelRegion ?? "unknown"} but OpenSky needs EU (e.g. ${OPENSKY_PRIMARY_VERCEL_REGION}). Commit vercel.json with "regions": ["fra1"], redeploy, or set Vercel → Project → Settings → Functions → Function Region to Frankfurt.`
        : null,
      connectivityHint: directUnreachable
        ? "Region is EU but OpenSky still times out from Vercel. Deploy opensky-proxy to Railway (EU) and set OPENSKY_STATES_URL + OPENSKY_TOKEN_URL — see opensky-proxy/README.md."
        : !auth.ok && usingProxy
          ? "Proxy env vars are set but token or states failed. Verify the Railway service is up and URLs end with /states and /token."
          : null,
      authHostReachable: auth.authHostProbe.ok,
      authHostStatus: auth.authHostProbe.status ?? null,
      authHostError: auth.authHostProbe.error ?? null,
      apiHostReachable: auth.apiHostProbe.ok,
      apiHostStatus: auth.apiHostProbe.status ?? null,
      apiHostError: auth.apiHostProbe.error ?? null,
    },
  });
}
