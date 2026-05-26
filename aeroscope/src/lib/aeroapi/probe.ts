import { AeroApiError, aeroFetch, isAeroApiConfigured } from "./client";

export type AeroApiProbeResult = {
  configured: boolean;
  ok: boolean;
  error: string | null;
  status: number | null;
};

export async function probeAeroApi(): Promise<AeroApiProbeResult> {
  const configured = isAeroApiConfigured();
  if (!configured) {
    return {
      configured: false,
      ok: false,
      error: "AEROAPI_API_KEY not set",
      status: null,
    };
  }

  try {
    await aeroFetch<{ total_calls?: number }>("/account/usage", {
      searchParams: { all_keys: "false" },
    });
    return { configured: true, ok: true, error: null, status: 200 };
  } catch (err) {
    const status = err instanceof AeroApiError ? err.status : null;
    const message = err instanceof Error ? err.message : String(err);
    return {
      configured: true,
      ok: false,
      error: message,
      status,
    };
  }
}
