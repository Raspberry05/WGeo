import { NextRequest, NextResponse } from "next/server";
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

export async function GET(_request: NextRequest, context: RouteContext) {
  const { icao24 } = await context.params;
  const normalized = String(icao24 ?? "")
    .toLowerCase()
    .trim();

  if (!isValidIcao24(normalized)) {
    return NextResponse.json({ error: "Invalid icao24" }, { status: 400 });
  }

  const data = await fetchAircraftEnrichment(normalized);
  return NextResponse.json(data);
}
