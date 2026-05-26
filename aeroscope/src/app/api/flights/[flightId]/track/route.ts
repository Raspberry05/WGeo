import { NextRequest, NextResponse } from "next/server";
import { isValidFaFlightId } from "@/lib/aeroapi/flightDetail";
import { fetchFlightTrack } from "@/lib/aeroapi/track";
import { AeroApiError } from "@/lib/aeroapi/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

type RouteContext = { params: Promise<{ flightId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { flightId } = await context.params;
  const normalized = decodeURIComponent(String(flightId ?? "")).trim();

  if (!isValidFaFlightId(normalized)) {
    return NextResponse.json({ error: "Invalid flight id" }, { status: 400 });
  }

  try {
    const data = await fetchFlightTrack(normalized);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Aeroscope] flight track error:", message);

    if (err instanceof AeroApiError && err.status === 404) {
      return NextResponse.json({ positions: [] }, { status: 200 });
    }

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
