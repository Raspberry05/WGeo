export function formatNetworkError(err: unknown): string {
  if (!(err instanceof Error)) return String(err);

  const parts: string[] = [err.message];
  let current: unknown = err.cause;

  for (let depth = 0; depth < 4 && current; depth += 1) {
    if (current instanceof Error) {
      parts.push(current.message);
      const code = (current as NodeJS.ErrnoException).code;
      if (code) parts.push(code);
      current = current.cause;
    } else if (typeof current === "string") {
      parts.push(current);
      break;
    } else {
      break;
    }
  }

  return parts.filter(Boolean).join(" | ");
}
