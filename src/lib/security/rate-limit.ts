interface RateLimitInfo {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitInfo>();

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 10;

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = store.get(ip);

  if (!record || record.resetAt < now) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_REQUESTS) {
    return false;
  }

  record.count += 1;
  return true;
}
