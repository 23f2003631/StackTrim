/**
 * Lightweight in-memory rate limiter to protect against basic abuse.
 * In a real production scenario with multiple serverless functions,
 * you would use Redis (e.g., Upstash) or Supabase Edge Functions.
 * This is a deliberate, pragmatic choice for this stage.
 */

interface RateLimitInfo {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitInfo>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // Max requests per minute per IP

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = store.get(ip);

  if (!record || record.resetAt < now) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true; // Allowed
  }

  if (record.count >= MAX_REQUESTS) {
    return false; // Rate limited
  }

  record.count += 1;
  return true; // Allowed
}
