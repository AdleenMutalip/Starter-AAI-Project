// Employee home (docs/specs/02-design.md §4). Placeholder until the
// leave-request stories (FR-02, FR-04, FR-06) are specified.
import { requireRole } from "@/lib/auth";

export default async function EmployeeHome() {
  await requireRole("EMPLOYEE");
  return (
    <section>
      <h1 className="text-2xl font-bold text-white">Employee home</h1>
      <p className="mt-2 text-white/85">
        Leave request screens will appear here once their requirements are
        built.
      </p>
    </section>
  );
}
