import { NextRequest, NextResponse } from "next/server";
import { searchFlightsInBounds } from "@/lib/aeroapi/search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

export async function GET(request: NextRequest) {
  const query = Object.fromEntries(request.nextUrl.searchParams.entries());
  const result = await searchFlightsInBounds(query);

  if (result.error) {
    return NextResponse.json(
      {
        aircraft: result.aircraft,
        error: result.error,
        hint: result.hint,
      },
      { status: result.status },
    );
  }

  return NextResponse.json({ aircraft: result.aircraft }, { status: result.status });
}
