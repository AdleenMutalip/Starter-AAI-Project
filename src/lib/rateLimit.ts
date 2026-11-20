// In-memory login-attempt counter (design rule 7, OWASP A07).
// At most MAX_ATTEMPTS failed attempts per minute, per IP address + email
// (interview Q3). Lost on server restart — acceptable for a laptop-run app.
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;

const failedAttempts = new Map<string, number[]>();

function attemptTimes(ip: string, email: string): number[] {
  const key = `${ip}|${email}`;
  const now = Date.now();
  const recent = (failedAttempts.get(key) ?? []).filter(
    (t) => now - t < WINDOW_MS
  );
  failedAttempts.set(key, recent);
  return recent;
}

export function isRateLimited(ip: string, email: string): boolean {
  return attemptTimes(ip, email).length >= MAX_ATTEMPTS;
}

export function recordFailedAttempt(ip: string, email: string): void {
  attemptTimes(ip, email).push(Date.now());
}

export const RATE_LIMIT_MESSAGE = "Too many attempts, try again later";
