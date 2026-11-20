// Employee detail (Task 12 + Task 14, design leave §5): one own request —
// all fields, the date trail, remarks — plus Cancel while PENDING_SUPERVISOR
// and Send to HR while SIGNED, each behind a confirm panel (rule 20).
// Out-of-scope ids render exactly like missing ones (rule 19).
import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import ConfirmAction from "@/components/leave/confirm-action";
import StatusBadge from "@/components/leave/status-badge";
import {
  daysInclusive,
  findOwnRequest,
  formatDateOnly,
  STATUSES,
  type LeaveStatus,
} from "@/lib/leave";
import {
  cancelLeaveRequest,
  confirmCancelLeaveRequest,
  confirmSendToHr,
  sendToHr,
} from "./actions";

function formatStamp(date: Date): string {
  return `${formatDateOnly(date)} ${date.toISOString().slice(11, 16)} UTC`;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-white/60">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-white">{value}</dd>
    </div>
  );
}

export default async function EmployeeLeaveDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    confirm?: string;
    cancelled?: string;
    sent?: string;
    err?: string;
  }>;
}) {
  const user = await requireRole("EMPLOYEE");
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) redirect("/employee");

  const request = await findOwnRequest(user.userId, id);
  if (!request) {
    // Same page for "not yours" and "does not exist" (rule 19, AC-24 pattern).
    return (
      <section>
        <h1 className="text-2xl font-bold text-white">Request not found</h1>
        <p className="mt-2 text-sm text-white/85">
          This request does not exist or is not yours.
        </p>
        <a
          href="/employee"
          className="mt-6 inline-block rounded-full border border-white/40 bg-white/15 px-5 py-2 text-sm font-bold text-white hover:bg-white/25"
        >
          Back to my requests
        </a>
      </section>
    );
  }

  const status = request.status as LeaveStatus;
  const days = daysInclusive(request.startDate, request.endDate);
  const typeLabel = `${request.leaveType.name}${
    request.otherTypeText ? ` — "${request.otherTypeText}"` : ""
  }`;
  const dateRange = `${formatDateOnly(request.startDate)} → ${formatDateOnly(
    request.endDate
  )}`;
  const search = await searchParams;

  // Confirm step (rule 20) for Send to HR (Task 14, L7/AC-19).
  if (search.confirm === "send" && status === STATUSES.SIGNED) {
    return (
      <section>
        <h1 className="text-2xl font-bold text-white">Leave request #{request.id}</h1>
        <div className="mt-6">
          <ConfirmAction
            summary={`Send this request to the HR queue: ${typeLabel}, ${dateRange} (${days} ${
              days === 1 ? "day" : "days"
            })?`}
            action={confirmSendToHr}
            confirmLabel="Send to HR"
            cancelHref={`/employee/leave/${request.id}`}
          >
            <input type="hidden" name="id" value={request.id} />
          </ConfirmAction>
        </div>
      </section>
    );
  }

  // Confirm step (rule 20): the Cancel POST landed here; the panel's Confirm
  // is the only POST that changes the status.
  if (search.confirm === "cancel" && status === STATUSES.PENDING_SUPERVISOR) {
    return (
      <section>
        <h1 className="text-2xl font-bold text-white">Leave request #{request.id}</h1>
        <div className="mt-6">
          <ConfirmAction
            summary={`Cancel this request: ${typeLabel}, ${dateRange} (${days} ${
              days === 1 ? "day" : "days"
            }), supervisor: ${request.supervisor.name}?`}
            action={confirmCancelLeaveRequest}
            confirmLabel="Cancel request"
            cancelHref={`/employee/leave/${request.id}`}
          >
            <input type="hidden" name="id" value={request.id} />
          </ConfirmAction>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h1 className="text-2xl font-bold text-white">Leave request #{request.id}</h1>
      {search.cancelled === "1" ? (
        <p className="mt-4 rounded-xl bg-emerald-500/75 px-4 py-3 text-sm text-white">
          Leave request cancelled.
        </p>
      ) : null}
      {search.sent === "1" ? (
        <p className="mt-4 rounded-xl bg-emerald-500/75 px-4 py-3 text-sm text-white">
          Leave request sent to HR. It is now in the HR queue.
        </p>
      ) : null}
      {search.err === "cancel" ? (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-rose-600/75 px-4 py-3 text-sm text-white"
        >
          This request can no longer be cancelled.
        </p>
      ) : null}
      {search.err === "stale" ? (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-rose-600/75 px-4 py-3 text-sm text-white"
        >
          This request can no longer be actioned.
        </p>
      ) : null}
      <div className="mt-4">
        <StatusBadge status={status} />
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4">
        <Field label="Leave type" value={typeLabel} />
        <Field label="Supervisor" value={request.supervisor.name} />
        <Field label="Dates" value={dateRange} />
        <Field
          label="Duration"
          value={`${days} ${days === 1 ? "day" : "days"}`}
        />
        <Field label="Submitted" value={formatStamp(request.submittedAt)} />
        {request.signedAt ? (
          <Field label="Signed" value={formatStamp(request.signedAt)} />
        ) : null}
        {request.sentToHrAt ? (
          <Field label="Sent to HR" value={formatStamp(request.sentToHrAt)} />
        ) : null}
        {request.hrOfficer ? (
          <Field label="HR officer" value={request.hrOfficer.name} />
        ) : null}
        {request.decidedAt ? (
          <Field label="Decided" value={formatStamp(request.decidedAt)} />
        ) : null}
        {request.cancelledAt ? (
          <Field label="Cancelled" value={formatStamp(request.cancelledAt)} />
        ) : null}
        {request.supervisorRemark ? (
          <Field label="Supervisor remark" value={request.supervisorRemark} />
        ) : null}
        {request.hrRemark ? (
          <Field label="HR remark" value={request.hrRemark} />
        ) : null}
      </dl>
      <div className="mt-8 flex items-center gap-3">
        {/* Rule 15/18: Cancel exists only while PENDING_SUPERVISOR — a Signed
            or final request renders no action (AC-23). */}
        {status === STATUSES.PENDING_SUPERVISOR ? (
          <form action={cancelLeaveRequest}>
            <input type="hidden" name="id" value={request.id} />
            <button
              type="submit"
              className="rounded-full bg-rose-600/80 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-rose-600"
            >
              Cancel request
            </button>
          </form>
        ) : null}
        {/* Rule 15: Send to HR exists only while SIGNED — HR does not see
            the request until the submitter sends it (L7, AC-19). */}
        {status === STATUSES.SIGNED ? (
          <form action={sendToHr}>
            <input type="hidden" name="id" value={request.id} />
            <button
              type="submit"
              className="rounded-full bg-[#2CABE7] px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-[#1B95D3]"
            >
              Send to HR
            </button>
          </form>
        ) : null}
        <a
          href="/employee"
          className="rounded-full border border-white/40 bg-white/15 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-white/25"
        >
          Back
        </a>
      </div>
    </section>
  );
}
