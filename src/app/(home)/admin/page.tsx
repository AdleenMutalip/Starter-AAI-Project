// Admin overview (Task 18, design leave §5; FR-08, L14, AC-26): every
// request, newest submittedAt first, read-only. The status filter is a GET
// form so it works without JavaScript and the URL stays bookmarkable
// (?status=APPROVED). No control under /admin changes data.
import { requireRole } from "@/lib/auth";
import {
  LEAVE_STATUS_VALUES,
  listAllRequests,
  STATUS_LABELS,
  type LeaveStatus,
} from "@/lib/leave";
import RequestTable, { type RequestListRow } from "@/components/leave/request-table";

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("ADMIN");
  const { status } = await searchParams;
  // Only a known status code reaches the query; anything else means "all".
  const filter: LeaveStatus | undefined = LEAVE_STATUS_VALUES.includes(
    status as LeaveStatus
  )
    ? (status as LeaveStatus)
    : undefined;
  const requests = await listAllRequests(filter);
  const rows: RequestListRow[] = requests.map((r) => ({
    id: r.id,
    typeLabel: `${r.leaveType.name}${
      r.otherTypeText ? ` — "${r.otherTypeText}"` : ""
    }`,
    startDate: r.startDate,
    endDate: r.endDate,
    status: r.status as RequestListRow["status"],
    subtitle: `${r.employee.name} — ${r.employee.division} · Supervisor: ${r.supervisor.name}`,
    remarks: [
      ...(r.supervisorRemark ? [`Supervisor: ${r.supervisorRemark}`] : []),
      ...(r.hrRemark ? [`HR: ${r.hrRemark}`] : []),
    ],
  }));
  return (
    <section>
      <h1 className="text-2xl font-bold text-white">All leave requests</h1>
      <p className="mt-2 text-sm text-white/75">
        View only — nothing here changes data.
      </p>
      {/* GET form: the dropdown writes ?status= into the URL, no JS needed. */}
      <form method="get" action="/admin" className="mt-6 flex items-end gap-3">
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
        emptyText="No requests match this filter."
      />
    </section>
  );
}
