// Supervisor home (Task 13, design leave §5; stories L5/L9/L13). Three
// server-side scoped queries — waiting for me, past assigned to me, and my
// own submissions (rule 19, AC-21). Rows link to the supervisor detail,
// which opens in decision or submitter mode by identity.
import { requireRole } from "@/lib/auth";
import { supervisorLists } from "@/lib/leave";
import Link from "next/link";
import RequestTable, { type RequestListRow } from "@/components/leave/request-table";

export default async function SupervisorHome() {
  const user = await requireRole("SUPERVISOR");
  const { waiting, past, own } = await supervisorLists(user.userId);
  const toRows = (
    requests: Awaited<ReturnType<typeof supervisorLists>>["waiting"]
  ): RequestListRow[] =>
    requests.map((r) => ({
      id: r.id,
      typeLabel: `${r.leaveType.name}${
        r.otherTypeText ? ` — "${r.otherTypeText}"` : ""
      }`,
      startDate: r.startDate,
      endDate: r.endDate,
      status: r.status as RequestListRow["status"],
      remarks: [
        ...(r.supervisorRemark ? [`Supervisor: ${r.supervisorRemark}`] : []),
        ...(r.hrRemark ? [`HR: ${r.hrRemark}`] : []),
      ],
    }));
  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">Supervisor</h1>
        <Link
          href="/employee/leave/new"
          className="rounded-full bg-[#2CABE7] px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-[#1B95D3]"
        >
          New leave request
        </Link>
      </div>
      <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-white/80">
        Waiting for me
      </h2>
      <RequestTable
        requests={toRows(waiting)}
        hrefBase="/supervisor/leave"
        emptyText="Nothing is waiting for your signature."
      />
      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-white/80">
        Past requests
      </h2>
      <RequestTable
        requests={toRows(past)}
        hrefBase="/supervisor/leave"
        emptyText="No past requests assigned to you yet."
      />
      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-white/80">
        My own submissions
      </h2>
      <RequestTable
        requests={toRows(own)}
        hrefBase="/supervisor/leave"
        emptyText="You have not applied for leave yet — use New leave request (supervisors apply on the same form, L13)."
      />
    </section>
  );
}
