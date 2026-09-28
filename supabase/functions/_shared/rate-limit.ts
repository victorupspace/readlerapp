// Fixed-window counters kept in memory. Every Edge Function instance has its own
// map, so this is a best-effort brake on bursts from one IP, not a global quota.
interface Counter {
  used: number;
  resetAt: number;
}

const counters = new Map<string, Counter>();

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-real-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown"
  );
}

/**
 * Spends `cost` units from the window identified by `key`.
 * Returns 0 when allowed, otherwise the number of seconds until the window resets.
 */
export function consume(key: string, cost: number, limit: number, windowMs: number): number {
  const now = Date.now();

  if (counters.size > 5000) {
    for (const [k, counter] of counters) {
      if (counter.resetAt <= now) counters.delete(k);
    }
  }

  let counter = counters.get(key);
  if (!counter || counter.resetAt <= now) {
    counter = { used: 0, resetAt: now + windowMs };
    counters.set(key, counter);
  }

  if (counter.used + cost > limit) {
    return Math.max(1, Math.ceil((counter.resetAt - now) / 1000));
  }
  counter.used += cost;
  return 0;
}
