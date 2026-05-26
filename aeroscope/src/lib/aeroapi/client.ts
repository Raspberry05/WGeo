import { AEROAPI_BASE_URL, AEROAPI_TIMEOUT_MS } from "./timeouts";

export function getAeroApiKey(): string | undefined {
  const key = process.env.AEROAPI_API_KEY?.trim();
  return key ? key : undefined;
}

export function isAeroApiConfigured(): boolean {
  return Boolean(getAeroApiKey());
}

export class AeroApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AeroApiError";
  }
}

export async function aeroFetch<T>(
  path: string,
  options: {
    method?: string;
    searchParams?: Record<string, string>;
    timeoutMs?: number;
  } = {},
): Promise<T> {
  const apiKey = getAeroApiKey();
  if (!apiKey) {
    throw new AeroApiError("AEROAPI_API_KEY is not configured", 503);
  }

  const url = new URL(
    path.startsWith("http") ? path : `${AEROAPI_BASE_URL}${path}`,
  );
  if (options.searchParams) {
    for (const [k, v] of Object.entries(options.searchParams)) {
      url.searchParams.set(k, v);
    }
  }

  const timeoutMs = options.timeoutMs ?? AEROAPI_TIMEOUT_MS;
  const response = await fetch(url.toString(), {
    method: options.method ?? "GET",
    headers: {
      "x-apikey": apiKey,
      Accept: "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new AeroApiError(
      `AeroAPI ${response.status}: ${text.slice(0, 300)}`,
      response.status,
    );
  }

  if (!text) return {} as T;
  return JSON.parse(text) as T;
}
