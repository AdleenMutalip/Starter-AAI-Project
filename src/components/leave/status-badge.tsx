// Status badge (design leave §5 theme): colour always accompanied by the
// status text, never colour alone.
import { STATUS_LABELS, type LeaveStatus } from "@/lib/leave";

const BADGE_CLASS: Record<LeaveStatus, string> = {
  PENDING_SUPERVISOR: "bg-amber-500/80",
  SIGNED: "bg-sky-500/80",
  PENDING_HR: "bg-indigo-500/80",
  APPROVED: "bg-emerald-500/80",
  REJECTED_SUPERVISOR: "bg-rose-600/80",
  REJECTED_HR: "bg-rose-600/80",
  CANCELLED: "bg-slate-500/80",
};

export default function StatusBadge({ status }: { status: LeaveStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-bold text-white ${BADGE_CLASS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
