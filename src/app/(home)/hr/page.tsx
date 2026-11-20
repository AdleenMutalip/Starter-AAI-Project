// HR home (docs/specs/02-design.md §4). Placeholder until the leave-request
// stories (FR-05, FR-06) are specified.
import { requireRole } from "@/lib/auth";

export default async function HrHome() {
  await requireRole("HR");
  return (
    <section>
      <h1 className="text-2xl font-bold text-white">HR home</h1>
      <p className="mt-2 text-white/85">
        The shared HR queue will appear here once its requirements are built.
      </p>
    </section>
  );
}
