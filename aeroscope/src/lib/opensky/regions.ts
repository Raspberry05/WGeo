/** OpenSky is in Europe — Vercel functions should run in EU, not default iad1. */
export const OPENSKY_VERCEL_REGIONS = ["fra1", "cdg1", "ams1", "lhr1"] as const;

export const OPENSKY_PRIMARY_VERCEL_REGION = "fra1";

export function isOpenSkyVercelRegion(region: string | null): boolean {
  if (!region) return false;
  return (OPENSKY_VERCEL_REGIONS as readonly string[]).includes(region);
}
