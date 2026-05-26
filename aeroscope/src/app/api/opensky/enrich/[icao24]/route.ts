import { NextRequest, NextResponse } from "next/server";
import { fetchAircraftEnrichment, isValidIcao24 } from "@/lib/opensky/enrich";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

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
