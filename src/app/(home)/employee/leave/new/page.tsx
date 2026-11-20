// New leave request (Task 11 — design leave rules 11–14, 20–21; AC-12–AC-15).
// A server component: with JavaScript disabled the forms still post natively,
// and the confirm panel is pure server render (rule 20). Employees and
// supervisors may submit their own requests (rule 14, L13) — this screen is
// the same for both roles.
import { getCurrentUser, HOME_BY_ROLE } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import ConfirmAction from "@/components/leave/confirm-action";
import {
  daysInclusive,
  findLeaveTypes,
  parseDateOnly,
  SUBMITTER_ROLES,
  supervisorOptions,
  VALIDATION_MESSAGES,
  type ValidationError,
} from "@/lib/leave";
import { confirmSubmitLeaveRequest, submitLeaveRequest } from "./actions";

const fieldClass =
  "w-full rounded-xl border border-white/20 bg-white/25 px-4 py-3 text-sm text-white placeholder-white/70 focus:border-white/60 focus:outline-none";
const labelClass = "mb-1 block text-sm font-semibold text-white";

export default async function NewLeaveRequestPage({
  searchParams,
}: {
  searchParams: Promise<{
    err?: string;
    conflict?: string;
    confirm?: string;
    submitted?: string;
    type?: string;
    start?: string;
    end?: string;
    sup?: string;
    other?: string;
  }>;
}) {
  const session = await getCurrentUser();
  if (!session) redirect("/login");
  if (!SUBMITTER_ROLES.includes(session.role)) {
    redirect(HOME_BY_ROLE[session.role] ?? "/login");
  }
  const submitter = await db.user.findUnique({ where: { id: session.userId } });
  if (!submitter || !SUBMITTER_ROLES.includes(submitter.role)) redirect("/login");

  const types = await findLeaveTypes();
  const supervisors = await supervisorOptions(submitter.division, submitter.id);
  const params = await searchParams;
  // Supervisors reach this same form from their home (L13) — Back goes to
  // their own home, not the employee's.
  const homeHref = HOME_BY_ROLE[submitter.role] ?? "/employee";

  let error: string | null = null;
  if (params.err && params.err in VALIDATION_MESSAGES) {
    error = VALIDATION_MESSAGES[params.err as ValidationError];
    if (params.err === "overlap" && params.conflict) {
      error = `${error} — conflicting request: ${params.conflict.slice(0, 200)}`;
    }
  }

  // Rule 13 / AC-14: no supervisor in the division → explain and block.
  if (supervisors.length === 0) {
    return (
      <section>
        <h1 className="text-2xl font-bold text-white">New leave request</h1>
        <p className="mt-4 rounded-xl bg-rose-600/75 px-4 py-3 text-sm text-white">
          {VALIDATION_MESSAGES.division}
        </p>
        <Link
          href={homeHref}
          className="mt-6 inline-block rounded-full border border-white/40 bg-white/15 px-5 py-2 text-sm font-bold text-white hover:bg-white/25"
        >
          Back
        </Link>
      </section>
    );
  }

  // Confirm step (rule 20): summarise, then the Confirm POST creates the row.
  if (params.confirm === "1") {
    const type = await db.leaveType.findUnique({
      where: { id: Number(params.type) },
    });
    const supervisor = await db.user.findUnique({ where: { id: Number(params.sup) } });
    const start = parseDateOnly(params.start ?? null);
    const end = parseDateOnly(params.end ?? null);
    const days = start && end ? daysInclusive(start, end) : 0;
    const summary = `Submit this request: ${type?.name ?? "?"}${
      params.other ? ` — "${params.other}"` : ""
    }, ${params.start ?? "?"} → ${params.end ?? "?"} (${days} ${
      days === 1 ? "day" : "days"
    }), supervisor: ${supervisor?.name ?? "?"}.`;
    return (
      <section>
        <h1 className="text-2xl font-bold text-white">New leave request</h1>
        <div className="mt-6">
          <ConfirmAction
            summary={summary}
            action={confirmSubmitLeaveRequest}
            confirmLabel="Confirm"
            cancelHref="/employee/leave/new"
          >
            <input type="hidden" name="leaveTypeId" value={params.type ?? ""} />
            <input type="hidden" name="startDate" value={params.start ?? ""} />
            <input type="hidden" name="endDate" value={params.end ?? ""} />
            <input type="hidden" name="supervisorId" value={params.sup ?? ""} />
            {params.other ? (
              <input type="hidden" name="otherTypeText" value={params.other} />
            ) : null}
          </ConfirmAction>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h1 className="text-2xl font-bold text-white">New leave request</h1>
      {params.submitted === "1" ? (
        <p className="mt-4 rounded-xl bg-emerald-500/75 px-4 py-3 text-sm text-white">
          Leave request submitted. It is now waiting for your supervisor.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-4 rounded-xl bg-rose-600/75 px-4 py-3 text-sm text-white">
          {error}
        </p>
      ) : null}
      <form action={submitLeaveRequest} className="mt-6 space-y-4">
        <div>
          <label htmlFor="leaveTypeId" className={labelClass}>
            Leave type
          </label>
          <select
            id="leaveTypeId"
            name="leaveTypeId"
            required
            defaultValue={params.type ?? ""}
            className={fieldClass}
          >
            <option value="" disabled>
              Choose a leave type
            </option>
            {types.map((t) => (
              <option key={t.id} value={t.id} className="text-slate-900">
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="otherTypeText" className={labelClass}>
            What is the leave for?{" "}
            <span className="font-normal text-white/70">(required only for &ldquo;Other&rdquo;)</span>
          </label>
          <textarea
            id="otherTypeText"
            name="otherTypeText"
            maxLength={500}
            defaultValue={params.other ?? ""}
            rows={2}
            placeholder="Only needed when the type is Other"
            className={fieldClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className={labelClass}>
              Start date
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              required
              defaultValue={params.start ?? ""}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="endDate" className={labelClass}>
              End date
            </label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              required
              defaultValue={params.end ?? ""}
              className={fieldClass}
            />
          </div>
        </div>
        <div>
          <label htmlFor="supervisorId" className={labelClass}>
            Supervisor (from your division)
          </label>
          <select
            id="supervisorId"
            name="supervisorId"
            required
            defaultValue={params.sup ?? ""}
            className={fieldClass}
          >
            <option value="" disabled>
              Choose a supervisor
            </option>
            {supervisors.map((s) => (
              <option key={s.id} value={s.id} className="text-slate-900">
                {s.name} — {s.designation}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="rounded-full bg-[#2CABE7] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1B95D3]"
          >
            Submit request
          </button>
          <Link
            href={homeHref}
            className="rounded-full border border-white/40 bg-white/15 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/25"
          >
            Back
          </Link>
        </div>
      </form>
    </section>
  );
}
