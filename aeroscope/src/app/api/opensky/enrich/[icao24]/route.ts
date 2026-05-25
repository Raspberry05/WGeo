import { NextRequest, NextResponse } from "next/server";
import { applyCors, handleCorsPreflight } from "@/lib/apiCors";
import { fetchAircraftEnrichment, isValidIcao24 } from "@/lib/opensky/enrich";
import {
  OPENSKY_API_MAX_DURATION,
  OPENSKY_API_REGIONS,
} from "../../region";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = OPENSKY_API_REGIONS;
export const maxDuration = OPENSKY_API_MAX_DURATION;

type RouteContext = { params: Promise<{ icao24: string }> };

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflight(request) ?? new Response(null, { status: 204 });
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { icao24 } = await context.params;
  const normalized = String(icao24 ?? "")
    .toLowerCase()
    .trim();

  if (!isValidIcao24(normalized)) {
    return applyCors(
      request,
      NextResponse.json({ error: "Invalid icao24" }, { status: 400 }),
    );
  }

  const data = await fetchAircraftEnrichment(normalized);
  return applyCors(request, NextResponse.json(data));
}
