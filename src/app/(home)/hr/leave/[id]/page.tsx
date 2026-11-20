// HR queue detail (Task 15, design leave §5): one request the queue has
// seen — Approve / Reject (remark required) behind confirm panels while
// PENDING_HR; decided items show the officer and dates with no actions
// (rules 17/18, AC-20). Requests that never reached the queue read like
// missing ids (rule 19, AC-23).
import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import ConfirmAction from "@/components/leave/confirm-action";
import RemarkField from "@/components/leave/remark-field";
import StatusBadge from "@/components/leave/status-badge";
import {
  daysInclusive,
  findHrRequest,
  formatDateOnly,
  REMARK_REQUIRED_MESSAGE,
  STATUSES,
  type LeaveStatus,
} from "@/lib/leave";
import {
  approveLeaveRequest,
  confirmApproveLeaveRequest,
  confirmRejectAsHrLeaveRequest,
  rejectAsHrLeaveRequest,
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

export default async function HrLeaveDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    confirm?: string;
    approved?: string;
    rejected?: string;
    err?: string;
    remark?: string;
  }>;
}) {
  const user = await requireRole("HR");
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) redirect("/hr");

  const request = await findHrRequest(id);
  if (!request) {
    return (
      <section>
        <h1 className="text-2xl font-bold text-white">Request not found</h1>
        <p className="mt-2 text-sm text-white/85">
          This request does not exist or is not in the HR queue.
        </p>
        <a
          href="/hr"
          className="mt-6 inline-block rounded-full border border-white/40 bg-white/15 px-5 py-2 text-sm font-bold text-white hover:bg-white/25"
        >
          Back to the queue
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
  const summaryBase = `${typeLabel}, ${dateRange} (${days} ${
    days === 1 ? "day" : "days"
  })`;
  const search = await searchParams;
  // Any HR user decides any queue item; never their own submission
  // (rule 21 — a submitter is never HR, but the guard matches the actions).
  const canDecide =
    status === STATUSES.PENDING_HR && request.employeeId !== user.userId;

  if (search.confirm === "approve" && canDecide) {
    return (
      <section>
        <h1 className="text-2xl font-bold text-white">Leave request #{request.id}</h1>
        <div className="mt-6">
          <ConfirmAction
            summary={`Approve this request from ${request.employee.name}: ${summaryBase}?`}
            action={confirmApproveLeaveRequest}
            confirmLabel="Approve"
            cancelHref={`/hr/leave/${request.id}`}
          >
            <input type="hidden" name="id" value={request.id} />
          </ConfirmAction>
        </div>
      </section>
    );
  }
  if (search.confirm === "reject" && canDecide) {
    const remark = search.remark ? decodeURIComponent(search.remark) : "";
    return (
      <section>
        <h1 className="text-2xl font-bold text-white">Leave request #{request.id}</h1>
        <div className="mt-6">
          <ConfirmAction
            summary={`Reject this request from ${request.employee.name}: ${summaryBase}? Remark: “${remark}”.`}
            action={confirmRejectAsHrLeaveRequest}
            confirmLabel="Reject request"
            cancelHref={`/hr/leave/${request.id}`}
          >
            <input type="hidden" name="id" value={request.id} />
            <input type="hidden" name="remark" value={remark} />
          </ConfirmAction>
        </div>
      </section>
    );
  }

  const error =
    search.err === "remark"
      ? REMARK_REQUIRED_MESSAGE
      : search.err === "stale"
        ? "This request can no longer be actioned."
        : null;

  return (
    <section>
      <h1 className="text-2xl font-bold text-white">Leave request #{request.id}</h1>
      {search.approved === "1" ? (
        <p className="mt-4 rounded-xl bg-emerald-500/75 px-4 py-3 text-sm text-white">
          Leave request approved.
        </p>
      ) : null}
      {search.rejected === "1" ? (
        <p className="mt-4 rounded-xl bg-emerald-500/75 px-4 py-3 text-sm text-white">
          Leave request rejected. The remark is stored with the request.
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
        <Field label="Employee" value={`${request.employee.name} — ${request.employee.division}`} />
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
        {request.supervisorRemark ? (
          <Field label="Supervisor remark" value={request.supervisorRemark} />
        ) : null}
        {request.hrRemark ? (
          <Field label="HR remark" value={request.hrRemark} />
        ) : null}
      </dl>
      <div className="mt-8 flex flex-col gap-4">
        {canDecide ? (
          <>
            <form action={approveLeaveRequest} className="flex items-center gap-3">
              <input type="hidden" name="id" value={request.id} />
              <button
                type="submit"
                className="rounded-full bg-emerald-500/80 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-500"
              >
                Approve
              </button>
            </form>
            <form
              action={rejectAsHrLeaveRequest}
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
        <div>
          <a
            href="/hr"
            className="rounded-full border border-white/40 bg-white/15 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-white/25"
          >
            Back
          </a>
        </div>
      </div>
    </section>
  );
}
