"use client";
// Log out button in the shared header (design §4). Posts to the signOut
// server action via a plain form — server actions only, no client fetch.
import { signOut } from "./actions";

export default function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="rounded-full bg-[#2CABE7] px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-[#1B95D3]"
      >
        Log out
      </button>
    </form>
  );
}
