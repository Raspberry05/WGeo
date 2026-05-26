import { NextResponse } from "next/server";
import { aeroFetch, isAeroApiConfigured } from "@/lib/aeroapi/client";
import { probeAeroApi } from "@/lib/aeroapi/probe";
import { getFlightsCacheSize } from "@/lib/aeroapi/search";
import type { AeroAccountUsageResponse } from "@/lib/aeroapi/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

async function fetchUsageSnippet(): Promise<Record<string, unknown> | null> {
  if (!isAeroApiConfigured()) return null;
  try {
    const usage = await aeroFetch<AeroAccountUsageResponse>("/account/usage");
    return {
      tier: usage.account?.tier ?? null,
      requests: usage.usage?.requests ?? null,
      limit: usage.usage?.limit ?? null,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const probe = await probeAeroApi();
  const usage = probe.ok ? await fetchUsageSnippet() : null;

  return NextResponse.json({
    status: "online",
    endpoint: "/api/flights?lamin=&lomin=&lamax=&lomax=",
    cachedRegions: getFlightsCacheSize(),
    aeroapi: {
      configured: isAeroApiConfigured(),
      authOk: probe.ok,
      authError: probe.error,
      lastStatus: probe.status,
      hint: !probe.configured
        ? "Set AEROAPI_API_KEY in Vercel → Project → Settings → Environment Variables (server-only), then redeploy."
        : !probe.ok
          ? "API key present but AeroAPI probe failed. Verify key in FlightAware → My AeroAPI."
          : null,
      usage,
    },
  });
}
