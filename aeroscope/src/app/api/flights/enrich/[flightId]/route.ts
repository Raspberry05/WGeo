import { NextRequest, NextResponse } from "next/server";
import {
  fetchFlightDetail,
  isValidFaFlightId,
} from "@/lib/aeroapi/flightDetail";

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
    const data = await fetchFlightDetail(normalized);
    if (!data) {
      return NextResponse.json({ error: "Flight not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Aeroscope] flight detail error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
