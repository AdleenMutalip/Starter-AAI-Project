// The only code that creates, reads or destroys the session (design rule 4).
// Session = one signed cookie `session` holding { userId, role, expiresAt },
// signed with HMAC-SHA256 from node:crypto — no extra packages.
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "session";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export type SessionPayload = {
  userId: number;
  role: string;
  // null = browser session: the cookie itself has no expiry, closing the
  // browser ends it (interview Q2).
  expiresAt: number | null;
};

function signingKey(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set — copy .env.example to .env");
  }
  return Buffer.from(secret, "utf8");
}

function hmac(data: string): string {
  return createHmac("sha256", signingKey()).update(data).digest("base64url");
}

// Internal helpers are exported so the checks in the task spec can exercise
// signing and tamper detection directly.
export function signPayload(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${hmac(body)}`;
}

export function verifySignedPayload(value: string): SessionPayload | null {
  const [body, signature] = value.split(".");
  if (!body || !signature) return null;
  const expected = Buffer.from(hmac(body));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return null; // tampered cookie — treat as not logged in (rule 4)
  }
  let payload: SessionPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (
    typeof payload?.userId !== "number" ||
    typeof payload?.role !== "string" ||
    !(payload.expiresAt === null || typeof payload.expiresAt === "number")
  ) {
    return null;
  }
  if (payload.expiresAt !== null && payload.expiresAt < Date.now()) {
    return null;
  }
  return payload;
}

export async function createSession(
  user: { id: number; role: string },
  remember: boolean
): Promise<void> {
  const expiresAt = remember ? Date.now() + THIRTY_DAYS_MS : null;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, signPayload({ userId: user.id, role: user.role, expiresAt }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt === null ? undefined : new Date(expiresAt),
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Returns the verified session, or null for missing/unsigned/expired cookies.
export async function getCurrentUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  if (!value) return null;
  return verifySignedPayload(value);
}

export const HOME_BY_ROLE: Record<string, string> = {
  EMPLOYEE: "/employee",
  SUPERVISOR: "/supervisor",
  HR: "/hr",
  ADMIN: "/admin",
};

// Server-side page guard (design rule 6): not logged in → /login; wrong role
// → own home page, silently (interview Q4/Q5 — no "access denied" page).
// Called by every home layout AND page: layouts do not re-render on
// client-side navigation, so each page keeps its own check as well.
export async function requireRole(role: string): Promise<SessionPayload> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== role) {
    redirect(HOME_BY_ROLE[user.role] ?? "/login");
  }
  return user;
}
