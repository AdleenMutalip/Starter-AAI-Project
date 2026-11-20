// Supervisor detail (Task 13, design leave §5). Two modes on one page
// (rule 19): an assigned request offers Sign / Reject (remark required)
// behind confirm panels; the supervisor's own submission opens in submitter
// mode — decision fields read-only, never Sign/Reject (rule 21) — with
// Cancel while Pending supervisor and Send to HR while Signed, both reusing
// the employee server actions.
import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import ConfirmAction from "@/components/leave/confirm-action";
import RemarkField from "@/components/leave/remark-field";
import StatusBadge from "@/components/leave/status-badge";
import {
  daysInclusive,
  findSupervisorRequest,
  formatDateOnly,
  REMARK_REQUIRED_MESSAGE,
  STATUSES,
  type LeaveStatus,
} from "@/lib/leave";
import {
  cancelLeaveRequest,
  confirmCancelLeaveRequest,
  confirmSendToHr,
  sendToHr,
} from "../../../employee/leave/[id]/actions";
import {
  confirmRejectLeaveRequest,
  confirmSignLeaveRequest,
  rejectLeaveRequest,
  signLeaveRequest,
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

export default async function SupervisorLeaveDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    confirm?: string;
    signed?: string;
    rejected?: string;
    cancelled?: string;
    sent?: string;
    err?: string;
    remark?: string;
  }>;
}) {
  const user = await requireRole("SUPERVISOR");
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) redirect("/supervisor");

  const request = await findSupervisorRequest(user.userId, id);
  if (!request) {
    // "Not assigned to you and not yours" reads exactly like "does not
    // exist" — no leak of its existence (rule 19, AC-17).
    return (
      <section>
        <h1 className="text-2xl font-bold text-white">Request not found</h1>
        <p className="mt-2 text-sm text-white/85">
          This request does not exist or is not yours.
        </p>
        <a
          href="/supervisor"
          className="mt-6 inline-block rounded-full border border-white/40 bg-white/15 px-5 py-2 text-sm font-bold text-white hover:bg-white/25"
        >
          Back to my list
        </a>
      </section>
    );
  }

  const status = request.status as LeaveStatus;
  const isOwn = request.employeeId === user.userId;
  const isAssigned = request.supervisorId === user.userId;
  const days = daysInclusive(request.startDate, request.endDate);
  const typeLabel = `${request.leaveType.name}${
    request.otherTypeText ? ` — "${request.otherTypeText}"` : ""
  }`;
  const dateRange = `${formatDateOnly(request.startDate)} → ${formatDateOnly(
    request.endDate
  )}`;
  const summaryBase = `${typeLabel}, ${dateRange} (${days} ${
    days === 1 ? "day" : "days"
  })`;
  const search = await searchParams;
  const pending = status === STATUSES.PENDING_SUPERVISOR;

  // Confirm steps (rule 20) — each renders only in its allowed mode.
  if (search.confirm === "sign" && isAssigned && !isOwn && pending) {
    return (
      <section>
        <h1 className="text-2xl font-bold text-white">Leave request #{request.id}</h1>
        <div className="mt-6">
          <ConfirmAction
            summary={`Sign this request from ${request.employee.name}: ${summaryBase}?`}
            action={confirmSignLeaveRequest}
            confirmLabel="Sign"
            cancelHref={`/supervisor/leave/${request.id}`}
          >
            <input type="hidden" name="id" value={request.id} />
          </ConfirmAction>
        </div>
      </section>
    );
  }
  if (search.confirm === "reject" && isAssigned && !isOwn && pending) {
    const remark = search.remark ? decodeURIComponent(search.remark) : "";
    return (
      <section>
        <h1 className="text-2xl font-bold text-white">Leave request #{request.id}</h1>
        <div className="mt-6">
          <ConfirmAction
            summary={`Reject this request from ${request.employee.name}: ${summaryBase}? Remark: “${remark}”.`}
            action={confirmRejectLeaveRequest}
            confirmLabel="Reject request"
            cancelHref={`/supervisor/leave/${request.id}`}
          >
            <input type="hidden" name="id" value={request.id} />
            <input type="hidden" name="remark" value={remark} />
          </ConfirmAction>
        </div>
      </section>
    );
  }
  if (
    search.confirm === "send" &&
    isOwn &&
    status === STATUSES.SIGNED
  ) {
    return (
      <section>
        <h1 className="text-2xl font-bold text-white">Leave request #{request.id}</h1>
        <div className="mt-6">
          <ConfirmAction
            summary={`Send this request to the HR queue: ${summaryBase}?`}
            action={confirmSendToHr}
            confirmLabel="Send to HR"
            cancelHref={`/supervisor/leave/${request.id}`}
          >
            <input type="hidden" name="id" value={request.id} />
          </ConfirmAction>
        </div>
      </section>
    );
  }
  if (search.confirm === "cancel" && isOwn && pending) {
    return (
      <section>
        <h1 className="text-2xl font-bold text-white">Leave request #{request.id}</h1>
        <div className="mt-6">
          <ConfirmAction
            summary={`Cancel this request: ${summaryBase}, supervisor: ${request.supervisor.name}?`}
            action={confirmCancelLeaveRequest}
            confirmLabel="Cancel request"
            cancelHref={`/supervisor/leave/${request.id}`}
          >
            <input type="hidden" name="id" value={request.id} />
          </ConfirmAction>
        </div>
      </section>
    );
  }

  const error =
    search.err === "remark"
      ? REMARK_REQUIRED_MESSAGE
      : search.err === "cancel"
        ? "This request can no longer be cancelled."
        : search.err === "stale"
          ? "This request can no longer be actioned."
          : null;

  return (
    <section>
      <h1 className="text-2xl font-bold text-white">Leave request #{request.id}</h1>
      {search.signed === "1" ? (
        <p className="mt-4 rounded-xl bg-emerald-500/75 px-4 py-3 text-sm text-white">
          Leave request signed. The employee can now send it to HR.
        </p>
      ) : null}
      {search.rejected === "1" ? (
        <p className="mt-4 rounded-xl bg-emerald-500/75 px-4 py-3 text-sm text-white">
          Leave request rejected. The remark is stored with the request.
        </p>
      ) : null}
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
      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-rose-600/75 px-4 py-3 text-sm text-white"
        >
          {error}
        </p>
      ) : null}
      <div className="mt-4">
        <StatusBadge status={status} />
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4">
        <Field label="Employee" value={request.employee.name} />
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
      <div className="mt-8 flex flex-col gap-4">
        {/* Decision mode: assigned to me, not my own submission, still
            waiting (rules 15/19/21 — the actions re-check all of this). */}
        {isAssigned && !isOwn && pending ? (
          <>
            <form action={signLeaveRequest} className="flex items-center gap-3">
              <input type="hidden" name="id" value={request.id} />
              <button
                type="submit"
                className="rounded-full bg-[#2CABE7] px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-[#1B95D3]"
              >
                Sign
              </button>
            </form>
            <form
              action={rejectLeaveRequest}
              className="rounded-2xl border border-white/20 bg-white/10 p-4"
            >
              <input type="hidden" name="id" value={request.id} />
              <RemarkField
                name="remark"
                label="Remark (required to reject)"
                defaultValue={search.err === "remark" && search.remark ? decodeURIComponent(search.remark) : ""}
              />
              <button
                type="submit"
                className="mt-3 rounded-full bg-rose-600/80 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-rose-600"
              >
                Reject
              </button>
            </form>
          </>
        ) : null}
        {/* Submitter mode: own submission — Cancel only (Send to HR comes
            with Task 14). Never Sign/Reject (rule 21). */}
        {isOwn && pending ? (
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
        {/* Submitter mode while Signed: Send to HR, reusing the employee
            server action (L13, AC-19/AC-24). */}
        {isOwn && status === STATUSES.SIGNED ? (
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
        <div>
          <a
            href="/supervisor"
            className="rounded-full border border-white/40 bg-white/15 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-white/25"
          >
            Back
          </a>
        </div>
      </div>
    </section>
  );
}
