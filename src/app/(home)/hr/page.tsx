// HR home (Task 15, design leave §5; stories L8/L9). The shared queue is
// every PENDING_HR request regardless of division, plus the past decisions
// (rule 19, AC-21). Rows that never reached HR are absent entirely (AC-23).
import { requireRole } from "@/lib/auth";
import { hrLists } from "@/lib/leave";
import RequestTable, { type RequestListRow } from "@/components/leave/request-table";

export default async function HrHome() {
  await requireRole("HR");
  const { queue, decided } = await hrLists();
  const toRows = (
    requests: Awaited<ReturnType<typeof hrLists>>["queue"]
  ): RequestListRow[] =>
    requests.map((r) => ({
      id: r.id,
      typeLabel: `${r.leaveType.name}${
        r.otherTypeText ? ` — "${r.otherTypeText}"` : ""
      }`,
      startDate: r.startDate,
      endDate: r.endDate,
      status: r.status as RequestListRow["status"],
      subtitle: `${r.employee.name} — ${r.employee.division}`,
      remarks: [
        ...(r.supervisorRemark ? [`Supervisor: ${r.supervisorRemark}`] : []),
        ...(r.hrRemark ? [`HR: ${r.hrRemark}`] : []),
      ],
    }));
  return (
    <section>
      <h1 className="text-2xl font-bold text-white">HR</h1>
      <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-white/80">
        HR queue
      </h2>
      <RequestTable
        requests={toRows(queue)}
        hrefBase="/hr/leave"
        emptyText="No requests are waiting for a decision."
      />
      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-white/80">
        Past decisions
      </h2>
      <RequestTable
        requests={toRows(decided)}
        hrefBase="/hr/leave"
        emptyText="No decisions made yet."
      />
    </section>
  );
}
