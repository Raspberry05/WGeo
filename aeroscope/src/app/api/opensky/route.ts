import { NextRequest, NextResponse } from "next/server";
import { applyCors, handleCorsPreflight } from "@/lib/apiCors";
import { fetchOpenSkyStates } from "@/lib/opensky/states";
import {
  OPENSKY_API_MAX_DURATION,
  OPENSKY_API_REGIONS,
} from "./region";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = OPENSKY_API_REGIONS;
export const maxDuration = OPENSKY_API_MAX_DURATION;

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflight(request) ?? new Response(null, { status: 204 });
}

export async function GET(request: NextRequest) {
  const query = Object.fromEntries(request.nextUrl.searchParams.entries());
  const result = await fetchOpenSkyStates(query);
  return applyCors(
    request,
    NextResponse.json(result.data, { status: result.status }),
  );
}
