// Shared leave-request logic (design leave §6): status codes, scoped queries,
// the overlap check (rule 12), supervisor options (rule 13) and the validation
// + transition helpers. No 'use server' here — actions call into these.
import { db } from "@/lib/db";

export const STATUSES = {
  PENDING_SUPERVISOR: "PENDING_SUPERVISOR",
  SIGNED: "SIGNED",
  PENDING_HR: "PENDING_HR",
  APPROVED: "APPROVED",
  REJECTED_SUPERVISOR: "REJECTED_SUPERVISOR",
  REJECTED_HR: "REJECTED_HR",
  CANCELLED: "CANCELLED",
} as const;

export type LeaveStatus = (typeof STATUSES)[keyof typeof STATUSES];

export const LEAVE_STATUS_VALUES: LeaveStatus[] = [
  STATUSES.PENDING_SUPERVISOR,
  STATUSES.SIGNED,
  STATUSES.PENDING_HR,
  STATUSES.APPROVED,
  STATUSES.REJECTED_SUPERVISOR,
  STATUSES.REJECTED_HR,
  STATUSES.CANCELLED,
];

// Everything that is not a final status (rules 12, 18).
export const ACTIVE_STATUSES: LeaveStatus[] = [
  STATUSES.PENDING_SUPERVISOR,
  STATUSES.SIGNED,
  STATUSES.PENDING_HR,
];

export const FINAL_STATUSES: LeaveStatus[] = [
  STATUSES.APPROVED,
  STATUSES.REJECTED_SUPERVISOR,
  STATUSES.REJECTED_HR,
  STATUSES.CANCELLED,
];

// Human labels (design leave §2).
export const STATUS_LABELS: Record<LeaveStatus, string> = {
  PENDING_SUPERVISOR: "Pending supervisor",
  SIGNED: "Signed",
  PENDING_HR: "Pending HR",
  APPROVED: "Approved",
  REJECTED_SUPERVISOR: "Rejected by supervisor",
  REJECTED_HR: "Rejected by HR",
  CANCELLED: "Cancelled",
};

// Only these roles may submit (rule 14, interview Q4).
export const SUBMITTER_ROLES = ["EMPLOYEE", "SUPERVISOR"];

export const MAX_TEXT_LENGTH = 500; // remarks and otherTypeText (rule 16)

export const OTHER_TYPE_NAME = "Other";

// A form day is stored as UTC midnight so display never shifts with the TZ.
export function parseDateOnly(value: FormDataEntryValue | string | null): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
  return date;
}

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Rule 11: calendar days, start and end inclusive.
export function daysInclusive(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

export type SubmitDraft = {
  employeeId: number;
  supervisorId: number;
  leaveTypeId: number;
  otherTypeText: string | null;
  startDate: Date;
  endDate: Date;
};

export type ValidationError =
  | "dates"
  | "otherText"
  | "type"
  | "supervisor"
  | "division"
  | "overlap"
  | "session";

export const VALIDATION_MESSAGES: Record<ValidationError, string> = {
  dates: "End date cannot be before the start date",
  otherText: "For Other leave, write what it is for",
  type: "Choose one of the leave types",
  supervisor: "Choose a supervisor from your own division",
  division: "Your division has no supervisor yet, so leave cannot be submitted. Ask HR to add one.",
  overlap: "These dates overlap one of your active requests",
  session: "Please sign in again",
};

// Supervisor options: SUPERVISOR users of the submitter's own division,
// excluding the submitter (rules 13 and 21).
export async function supervisorOptions(division: string, excludeUserId: number) {
  return db.user.findMany({
    where: { role: "SUPERVISOR", division, id: { not: excludeUserId } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, designation: true },
  });
}

export async function findLeaveTypes() {
  return db.leaveType.findMany({ orderBy: { id: "asc" } });
}

// Rule 12: overlap against the submitter's own non-final requests.
export async function findConflictingRequest(employeeId: number, start: Date, end: Date) {
  return db.leaveRequest.findFirst({
    where: {
      employeeId,
      status: { notIn: FINAL_STATUSES },
      startDate: { lte: end },
      endDate: { gte: start },
    },
    include: { leaveType: true },
  });
}

export type ValidatedSubmission =
  | { ok: true; draft: SubmitDraft }
  | { ok: false; error: ValidationError; detail?: string };

// Validates everything a submit needs; called by BOTH the first POST and the
// confirm POST (design leave §7: the overlap check runs again at the confirm
// step, so two fast submissions cannot both slip in).
export async function validateSubmission(
  session: { userId: number; role: string } | null,
  formData: FormData
): Promise<ValidatedSubmission> {
  if (!session || !SUBMITTER_ROLES.includes(session.role)) {
    return { ok: false, error: "session" };
  }
  const submitter = await db.user.findUnique({ where: { id: session.userId } });
  if (!submitter || !SUBMITTER_ROLES.includes(submitter.role)) {
    return { ok: false, error: "session" };
  }

  const leaveTypeId = Number(formData.get("leaveTypeId"));
  const leaveType = Number.isInteger(leaveTypeId)
    ? await db.leaveType.findUnique({ where: { id: leaveTypeId } })
    : null;
  if (!leaveType) return { ok: false, error: "type" };

  const startDate = parseDateOnly(formData.get("startDate"));
  const endDate = parseDateOnly(formData.get("endDate"));
  if (!startDate || !endDate || endDate.getTime() < startDate.getTime()) {
    return { ok: false, error: "dates" };
  }

  let otherTypeText: string | null = null;
  if (leaveType.name === OTHER_TYPE_NAME) {
    const raw = formData.get("otherTypeText");
    otherTypeText = typeof raw === "string" ? raw.trim() : "";
    if (!otherTypeText || otherTypeText.length > MAX_TEXT_LENGTH) {
      return { ok: false, error: "otherText" };
    }
  }

  // Rule 13 + 21: the supervisor must be a SUPERVISOR of the submitter's own
  // division and never the submitter. Never trust the dropdown from the
  // browser — this is the check that refuses a tampered value (AC-14, AC-24).
  const supervisorId = Number(formData.get("supervisorId"));
  const supervisor = Number.isInteger(supervisorId)
    ? await db.user.findUnique({ where: { id: supervisorId } })
    : null;
  if (
    !supervisor ||
    supervisor.role !== "SUPERVISOR" ||
    supervisor.division !== submitter.division ||
    supervisor.id === submitter.id
  ) {
    return { ok: false, error: "supervisor" };
  }

  const conflict = await findConflictingRequest(submitter.id, startDate, endDate);
  if (conflict) {
    // AC-15: the refusal message names the conflicting request.
    const label = `${conflict.leaveType.name}${
      conflict.otherTypeText ? ` — "${conflict.otherTypeText}"` : ""
    }, ${formatDateOnly(conflict.startDate)} → ${formatDateOnly(conflict.endDate)}`;
    return { ok: false, error: "overlap", detail: label };
  }

  return {
    ok: true,
    draft: {
      employeeId: submitter.id,
      supervisorId: supervisor.id,
      leaveTypeId: leaveType.id,
      otherTypeText,
      startDate,
      endDate,
    },
  };
}

// The only writer that creates a row (the submit transition, rule 15).
export async function createLeaveRequest(draft: SubmitDraft) {
  return db.leaveRequest.create({
    data: {
      ...draft,
      status: STATUSES.PENDING_SUPERVISOR,
      submittedAt: new Date(),
    },
  });
}

// Rule 19: the employee list is built with a server-side filter on the
// session user — the page never receives all rows and hides some. The
// optional status (Task 20, L15) is applied in the same server-side query.
export async function listMyRequests(userId: number, status?: LeaveStatus) {
  return db.leaveRequest.findMany({
    where: { employeeId: userId, ...(status ? { status } : {}) },
    orderBy: { submittedAt: "desc" },
    include: { leaveType: true },
  });
}

// Rule 19: an out-of-scope id returns null — the detail page then behaves
// exactly like a request that does not exist (no leak of its existence).
export async function findOwnRequest(userId: number, id: number) {
  return db.leaveRequest.findFirst({
    where: { id, employeeId: userId },
    include: {
      leaveType: true,
      supervisor: { select: { name: true } },
      hrOfficer: { select: { name: true } },
    },
  });
}

// The Cancel transition (rule 15): submitter only, only while
// PENDING_SUPERVISOR, enforced in the WHERE clause so a stale confirm POST
// changes nothing (rule 18). Returns false when nothing matched.
export async function cancelRequest(userId: number, id: number): Promise<boolean> {
  const result = await db.leaveRequest.updateMany({
    where: { id, employeeId: userId, status: STATUSES.PENDING_SUPERVISOR },
    data: { status: STATUSES.CANCELLED, cancelledAt: new Date() },
  });
  return result.count === 1;
}

// AC-18/AC-20: the exact refusal for an empty rejection remark (rule 16).
export const REMARK_REQUIRED_MESSAGE = "Remark is required";

export function validRemark(raw: FormDataEntryValue | null): string | null {
  const remark = typeof raw === "string" ? raw.trim() : "";
  if (remark.length === 0 || remark.length > MAX_TEXT_LENGTH) return null;
  return remark;
}

// Rule 19: the supervisor reaches a request only when it is assigned to them
// or they submitted it — anything else returns null (reads like a missing id).
export async function findSupervisorRequest(userId: number, id: number) {
  return db.leaveRequest.findFirst({
    where: { id, OR: [{ supervisorId: userId }, { employeeId: userId }] },
    include: {
      leaveType: true,
      supervisor: { select: { name: true } },
      employee: { select: { name: true } },
      hrOfficer: { select: { name: true } },
    },
  });
}

// The supervisor home is three scoped queries, never one list with hidden
// rows (rule 19, AC-21): waiting, past assigned, and their own submissions.
export async function supervisorLists(userId: number) {
  const [waiting, past, own] = await Promise.all([
    db.leaveRequest.findMany({
      where: { supervisorId: userId, status: STATUSES.PENDING_SUPERVISOR },
      orderBy: { submittedAt: "desc" },
      include: { leaveType: true },
    }),
    db.leaveRequest.findMany({
      where: { supervisorId: userId, status: { not: STATUSES.PENDING_SUPERVISOR } },
      orderBy: { submittedAt: "desc" },
      include: { leaveType: true },
    }),
    db.leaveRequest.findMany({
      where: { employeeId: userId },
      orderBy: { submittedAt: "desc" },
      include: { leaveType: true },
    }),
  ]);
  return { waiting, past, own };
}

// Admin scope (rule 19): every request, newest submittedAt first; the
// optional status filter comes from ?status= after validation (FR-08/L14).
export async function listAllRequests(status?: LeaveStatus) {
  return db.leaveRequest.findMany({
    where: status ? { status } : {},
    orderBy: { submittedAt: "desc" },
    include: {
      leaveType: true,
      employee: { select: { name: true, division: true } },
      supervisor: { select: { name: true } },
      hrOfficer: { select: { name: true } },
    },
  });
}

// Send-to-HR transition (rule 15): submitter only, only while SIGNED.
export async function sendRequestToHr(userId: number, id: number): Promise<boolean> {
  const result = await db.leaveRequest.updateMany({
    where: { id, employeeId: userId, status: STATUSES.SIGNED },
    data: { status: STATUSES.PENDING_HR, sentToHrAt: new Date() },
  });
  return result.count === 1;
}

// Sign transition (rule 15): assigned supervisor only, only while
// PENDING_SUPERVISOR, and never their own request (rule 21 — the guard in
// the WHERE clause, not just in the rendered buttons).
export async function signRequest(supervisorId: number, id: number): Promise<boolean> {
  const result = await db.leaveRequest.updateMany({
    where: {
      id,
      supervisorId,
      employeeId: { not: supervisorId },
      status: STATUSES.PENDING_SUPERVISOR,
    },
    data: { status: STATUSES.SIGNED, signedAt: new Date() },
  });
  return result.count === 1;
}

// HR home scoping (rule 19): the whole PENDING_HR queue regardless of
// division, plus the decisions already made (AC-21). Requests that never
// reached HR (supervisor-rejected / cancelled) appear in no HR view (AC-23).
export async function hrLists() {
  const [queue, decided] = await Promise.all([
    db.leaveRequest.findMany({
      where: { status: STATUSES.PENDING_HR },
      orderBy: { sentToHrAt: "desc" },
      include: { leaveType: true, employee: { select: { name: true, division: true } } },
    }),
    db.leaveRequest.findMany({
      where: { status: { in: [STATUSES.APPROVED, STATUSES.REJECTED_HR] } },
      orderBy: { decidedAt: "desc" },
      include: { leaveType: true, employee: { select: { name: true, division: true } } },
    }),
  ]);
  return { queue, decided };
}

// HR detail access (rule 19): the queue and all decisions. Anything that
// never entered the queue reads like a missing id.
export async function findHrRequest(id: number) {
  return db.leaveRequest.findFirst({
    where: {
      id,
      status: {
        in: [STATUSES.PENDING_HR, STATUSES.APPROVED, STATUSES.REJECTED_HR],
      },
    },
    include: {
      leaveType: true,
      supervisor: { select: { name: true } },
      employee: { select: { name: true, division: true } },
      hrOfficer: { select: { name: true } },
    },
  });
}

// Approve (rule 15 + 17): any HR user while PENDING_HR, never the submitter
// (rule 21). Stamps hrOfficerId + decidedAt once — the status guard makes a
// second decision impossible, so officer and date are immutable after that.
export async function approveByHr(hrUserId: number, id: number): Promise<boolean> {
  const result = await db.leaveRequest.updateMany({
    where: {
      id,
      status: STATUSES.PENDING_HR,
      employeeId: { not: hrUserId },
    },
    data: { status: STATUSES.APPROVED, hrOfficerId: hrUserId, decidedAt: new Date() },
  });
  return result.count === 1;
}

// HR rejection (rule 15 + 16 + 17): same guards, remark stored with the
// decision and never edited afterwards.
export async function rejectByHr(
  hrUserId: number,
  id: number,
  remark: string
): Promise<boolean> {
  const result = await db.leaveRequest.updateMany({
    where: {
      id,
      status: STATUSES.PENDING_HR,
      employeeId: { not: hrUserId },
    },
    data: {
      status: STATUSES.REJECTED_HR,
      hrOfficerId: hrUserId,
      hrRemark: remark,
      decidedAt: new Date(),
    },
  });
  return result.count === 1;
}

// Supervisor rejection (rule 15 + 16): same guards, remark stored once and
// never edited afterwards.
export async function rejectAsSupervisor(
  supervisorId: number,
  id: number,
  remark: string
): Promise<boolean> {
  const result = await db.leaveRequest.updateMany({
    where: {
      id,
      supervisorId,
      employeeId: { not: supervisorId },
      status: STATUSES.PENDING_SUPERVISOR,
    },
    data: { status: STATUSES.REJECTED_SUPERVISOR, supervisorRemark: remark },
  });
  return result.count === 1;
}
