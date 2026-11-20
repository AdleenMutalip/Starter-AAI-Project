// Shared request list (design leave §5 theme + §6): one translucent row per
// request inside the page card; the whole row links to the detail page. The
// role pages differ only in which rows they pass and where the rows link
// (hrefBase), per rule 19 — the scoping happens in the query, not here.
import { daysInclusive, formatDateOnly, type LeaveStatus } from "@/lib/leave";
import StatusBadge from "./status-badge";

export type RequestListRow = {
  id: number;
  typeLabel: string; // leave type name, with the Other description when set
  startDate: Date;
  endDate: Date;
  status: LeaveStatus;
  remarks: string[]; // supervisor / HR remarks, only when set
  subtitle?: string; // e.g. who submitted (HR/admin variants)
};

export default function RequestTable({
  requests,
  hrefBase,
  emptyText,
}: {
  requests: RequestListRow[];
  // e.g. "/employee/leave" — rows link to `${hrefBase}/${id}`.
  // Omitted for the view-only admin table: rows are plain cards.
  hrefBase?: string;
  emptyText: string;
}) {
  if (requests.length === 0) {
    return <p className="mt-6 text-sm text-white/75">{emptyText}</p>;
  }
  return (
    <ul className="mt-6 space-y-3">
      {requests.map((r) => {
        const days = daysInclusive(r.startDate, r.endDate);
        const body = (
          <>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-white">{r.typeLabel}</span>
              <StatusBadge status={r.status} />
            </div>
            {r.subtitle ? (
              <p className="mt-0.5 text-xs text-white/70">{r.subtitle}</p>
            ) : null}
            <p className="mt-1 text-sm text-white/90">
              {formatDateOnly(r.startDate)} → {formatDateOnly(r.endDate)} ({days}{" "}
              {days === 1 ? "day" : "days"})
            </p>
            {r.remarks.length > 0 ? (
              <div className="mt-1 space-y-0.5">
                {r.remarks.map((remark, i) => (
                  <p key={i} className="text-xs text-white/70">
                    {remark}
                  </p>
                ))}
              </div>
            ) : null}
          </>
        );
        return (
          <li key={r.id}>
            {hrefBase ? (
              <a
                href={`${hrefBase}/${r.id}`}
                className="block rounded-2xl border border-white/20 bg-white/10 px-5 py-4 transition-colors hover:bg-white/20"
              >
                {body}
              </a>
            ) : (
              <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4">
                {body}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
