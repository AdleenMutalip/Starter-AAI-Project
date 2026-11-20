// Employee home — "My requests" (Task 12, design leave §5; stories L5/L9).
// The query is scoped to the logged-in user by identity (rule 19, AC-21):
// only their own requests are ever fetched. Status filter is Task 20 (L15),
// the same GET-form pattern as the admin filter so it works without
// JavaScript and the URL stays bookmarkable (?status=SIGNED).
import { requireRole } from "@/lib/auth";
import {
  LEAVE_STATUS_VALUES,
  listMyRequests,
  STATUS_LABELS,
  type LeaveStatus,
} from "@/lib/leave";
import Link from "next/link";
import RequestTable, { type RequestListRow } from "@/components/leave/request-table";

export default async function EmployeeHome({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireRole("EMPLOYEE");
  const { status } = await searchParams;
  // Only a known status code reaches the query; anything else means "all".
  const filter: LeaveStatus | undefined = LEAVE_STATUS_VALUES.includes(
    status as LeaveStatus
  )
    ? (status as LeaveStatus)
    : undefined;
  const requests = await listMyRequests(user.userId, filter);
  const rows: RequestListRow[] = requests.map((r) => ({
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
        <h1 className="text-2xl font-bold text-white">My leave requests</h1>
        <Link
          href="/employee/leave/new"
          className="rounded-full bg-[#2CABE7] px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-[#1B95D3]"
        >
          New leave request
        </Link>
      </div>
      {/* GET form: the dropdown writes ?status= into the URL, no JS needed. */}
      <form method="get" action="/employee" className="mt-6 flex items-end gap-3">
        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-semibold text-white">
            Filter by status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={filter ?? ""}
            className="rounded-xl border border-white/20 bg-white/25 px-4 py-2 text-sm text-white focus:border-white/60 focus:outline-none"
          >
            <option value="" className="text-slate-900">
              All statuses
            </option>
            {LEAVE_STATUS_VALUES.map((s) => (
              <option key={s} value={s} className="text-slate-900">
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-full bg-[#2CABE7] px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-[#1B95D3]"
        >
          Apply filter
        </button>
      </form>
      <RequestTable
        requests={rows}
        hrefBase="/employee/leave"
        emptyText={
          filter
            ? "No requests match this filter."
            : "No leave requests yet. Submit your first one with the button above."
        }
      />
    </section>
  );
}
