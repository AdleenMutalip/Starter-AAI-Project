// Supervisor home (docs/specs/02-design.md §4). Placeholder until the
// leave-request stories (FR-03, FR-06) are specified.
import { requireRole } from "@/lib/auth";

export default async function SupervisorHome() {
  await requireRole("SUPERVISOR");
  return (
    <section>
      <h1 className="text-2xl font-bold text-white">
        Supervisor home
      </h1>
      <p className="mt-2 text-white/85">
        Requests to sign will appear here once their requirements are built.
      </p>
    </section>
  );
}
