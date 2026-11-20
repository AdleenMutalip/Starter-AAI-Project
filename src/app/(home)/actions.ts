"use server";
// Sign-out server action (design §5, rule 5): deletes the session cookie and
// returns to /login. No server-side revocation — the signed cookie simply
// dies with the browser (interview Q2).
import { redirect } from "next/navigation";
import { destroySession, getCurrentUser } from "@/lib/auth";

export async function signOut(): Promise<void> {
  if (await getCurrentUser()) {
    await destroySession();
  }
  // FR-07 style: /login shows a "Signed out" confirmation (Task 7 check).
  redirect("/login?signedOut=1");
}
