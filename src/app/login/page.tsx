// Login page shell (docs/specs/02-design.md §4). A logged-in user is bounced
// to their own home page here (Task 6); the form itself lives in
// login-form.tsx and posts to the sign-in server action in actions.ts.
import { getCurrentUser, HOME_BY_ROLE } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ signedOut?: string }>;
}) {
  // A signed-in user never sees the form again (interview Q4/AC-10).
  const user = await getCurrentUser();
  if (user) {
    redirect(HOME_BY_ROLE[user.role] ?? "/");
  }
  const { signedOut } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#86C7F2_0%,#5D93E8_45%,#6C5DD3_70%,#432E9E_100%)]">
      <div className="w-96 rounded-3xl border border-white/25 bg-indigo-400/25 p-8 shadow-2xl backdrop-blur-md">
        <h1 className="mb-6 text-center text-3xl font-bold text-white">
          Login
        </h1>
        {signedOut === "1" ? (
          <p className="mb-4 rounded-xl bg-emerald-500/75 px-4 py-2 text-sm text-white">
            Signed out. See you again.
          </p>
        ) : null}
        <LoginForm />
      </div>
    </main>
  );
}
