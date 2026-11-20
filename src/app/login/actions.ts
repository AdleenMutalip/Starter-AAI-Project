"use server";
// Sign-in server action (design §5). Rate limiting runs in front of the
// password check (Task 8, design rule 7).
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { verifyPassword, DUMMY_HASH } from "@/lib/passwords";
import { createSession, HOME_BY_ROLE } from "@/lib/auth";
import {
  isRateLimited,
  recordFailedAttempt,
  RATE_LIMIT_MESSAGE,
} from "@/lib/rateLimit";

export type LoginState = { error?: string };

const WORK_EMAIL_SUFFIX = "@budiman.com";

export async function signIn(
  _previous: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";

  // Rate limit per IP + email, checked before the password check (rule 7).
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (isRateLimited(ip, email)) {
    return { error: RATE_LIMIT_MESSAGE };
  }

  // Format check first: never query the database with a non-Budiman email (rule 1).
  if (
    !email.endsWith(WORK_EMAIL_SUFFIX) ||
    email.length <= WORK_EMAIL_SUFFIX.length ||
    email.length > 254 ||
    /\s/.test(email)
  ) {
    return { error: "Please use your @budiman.com work email" };
  }

  const user = await db.user.findUnique({ where: { email } });
  // Always run a bcrypt compare, even for unknown emails, so response time
  // does not reveal which accounts exist (rule 3, no enumeration).
  const passwordOk = verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !passwordOk) {
    recordFailedAttempt(ip, email);
    return { error: "Email or password is wrong" };
  }

  await createSession({ id: user.id, role: user.role }, remember);
  redirect(HOME_BY_ROLE[user.role]);
}
