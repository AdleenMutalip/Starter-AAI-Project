"use client";
// Client form posting to the sign-in server action (design §4, §5 + Visual
// theme: pill inputs with icons on the glass card, blue pill button).
// Interview Q7: no demo accounts or hints on this page.
import { useActionState } from "react";
import { signIn, type LoginState } from "./actions";

const pillInput =
  "w-full rounded-full border border-white/20 bg-white/25 py-3 pl-11 pr-4 text-sm text-white placeholder-white/70 backdrop-blur-sm focus:border-white/60 focus:outline-none";

function PersonIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/90"
    >
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.3 0-8 1.7-8 5v1h16v-1c0-3.3-4.7-5-8-5Z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/90"
    >
      <path d="M17 9V7a5 5 0 0 0-10 0v2H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V10a1 1 0 0 0-1-1Zm-8-2a3 3 0 0 1 6 0v2H9Zm3 7a1.5 1.5 0 0 1 .5 2.92V19a.5.5 0 0 1-1 0v-2.08A1.5 1.5 0 0 1 12 14Z" />
    </svg>
  );
}

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    signIn,
    {}
  );

  return (
    <form action={formAction}>
      <div className="relative mb-4">
        <PersonIcon />
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          aria-label="Work email"
          placeholder="Work email"
          className={pillInput}
        />
      </div>
      <div className="relative mb-4">
        <LockIcon />
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          aria-label="Password"
          placeholder="Password"
          className={pillInput}
        />
      </div>
      <div className="mb-6 flex items-center gap-2">
        <input
          id="remember"
          name="remember"
          type="checkbox"
          className="h-4 w-4 rounded border-white/40 bg-white/20 accent-indigo-600"
        />
        <label htmlFor="remember" className="text-sm text-white">
          Remember me
        </label>
      </div>
      {state.error ? (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-rose-600/75 px-4 py-2 text-sm text-white"
        >
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-[#2CABE7] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1B95D3] disabled:opacity-60"
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
