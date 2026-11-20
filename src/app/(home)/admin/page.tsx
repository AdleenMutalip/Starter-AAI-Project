// Admin home (docs/specs/02-design.md §4). Placeholder until the admin
// overview (FR-08, view only) is specified.
import { requireRole } from "@/lib/auth";

export default async function AdminHome() {
  await requireRole("ADMIN");
  return (
    <section>
      <h1 className="text-2xl font-bold text-white">Admin home</h1>
      <p className="mt-2 text-white/85">
        The read-only list of leave records will appear here once its
        requirements are built.
      </p>
    </section>
  );
}
