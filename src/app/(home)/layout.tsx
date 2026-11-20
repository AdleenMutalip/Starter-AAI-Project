// Shared shell for the four role home pages (design §5). The role guard runs
// in the layout and in each page (Task 6) — layouts alone do not re-render on
// client-side navigation, so pages keep their own check (Next.js auth guide).
// The Log out button calls the signOut server action (Task 7).
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import SignOutButton from "./sign-out-button";

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Logged-in check for the whole (home) group; each page also checks its
  // own role (server-side, design rule 6).
  if (!(await getCurrentUser())) {
    redirect("/login");
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#86C7F2_0%,#5D93E8_45%,#6C5DD3_70%,#432E9E_100%)] p-6">
      <div className="w-full max-w-[672px] rounded-3xl border border-white/25 bg-indigo-400/25 shadow-2xl backdrop-blur-md">
        <header className="flex items-center justify-between px-8 py-4">
          <span className="text-lg font-bold text-white">Budiman HRMS</span>
          <SignOutButton />
        </header>
        <div className="px-8 pb-10">{children}</div>
      </div>
    </main>
  );
}
