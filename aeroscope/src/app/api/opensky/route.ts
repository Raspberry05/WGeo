import { NextRequest, NextResponse } from "next/server";
import { fetchOpenSkyStates } from "@/lib/opensky/states";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = ["fra1", "cdg1", "ams1", "lhr1"];
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const query = Object.fromEntries(request.nextUrl.searchParams.entries());
  const result = await fetchOpenSkyStates(query);
  return NextResponse.json(result.data, { status: result.status });
}
