// Root redirect (docs/specs/02-design.md §4): logged in → own role home,
// not logged in → /login. No content of its own.
import { redirect } from "next/navigation";
import { getCurrentUser, HOME_BY_ROLE } from "@/lib/auth";

export default async function RootPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  redirect(HOME_BY_ROLE[user.role] ?? "/login");
}
