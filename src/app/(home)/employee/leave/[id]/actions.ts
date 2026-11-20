// Cancel + Send-to-HR server actions, shared by the employee detail page and
// the supervisor's submitter mode (design leave §6 file map, L13). Every
// step re-checks the session, the ownership and the current status on the
// server — the hidden id and the rendered button are never trusted
// (rule 19, AC-22/AC-23/AC-19).
"use server";

import { getCurrentUser, HOME_BY_ROLE } from "@/lib/auth";
import {
  cancelRequest,
  findOwnRequest,
  sendRequestToHr,
  STATUSES,
  SUBMITTER_ROLES,
} from "@/lib/leave";
import { redirect } from "next/navigation";

function parseId(formData: FormData): number | null {
  const id = Number(formData.get("id"));
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Only EMPLOYEE/SUPERVISOR cancel their own requests (matrix). The detail
// page URL is derived from the session role — never from a form field, so a
// forged call can neither act as another role nor redirect to one.
async function requireSubmitterSession() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");
  if (!SUBMITTER_ROLES.includes(session.role)) {
    redirect(HOME_BY_ROLE[session.role] ?? "/login");
  }
  if (session.role === "SUPERVISOR") {
    return { ...session, homePath: "/supervisor", basePath: "/supervisor/leave" };
  }
  return { ...session, homePath: "/employee", basePath: "/employee/leave" };
}

// Step 1 of the confirm panel (rule 20): shows the panel, changes nothing.
export async function cancelLeaveRequest(formData: FormData) {
  const session = await requireSubmitterSession();
  const id = parseId(formData);
  if (id === null) redirect(session.homePath);
  const request = await findOwnRequest(session.userId, id);
  if (!request) redirect(session.homePath); // out of scope behaves like missing
  if (request.status !== STATUSES.PENDING_SUPERVISOR) {
    redirect(`${session.basePath}/${id}?err=cancel`); // stale or final (rule 18)
  }
  redirect(`${session.basePath}/${id}?confirm=cancel`);
}

// Step 2: the only POST that changes data. The WHERE clause repeats every
// guard (owner + PENDING_SUPERVISOR) so a stale panel cancels nothing.
export async function confirmCancelLeaveRequest(formData: FormData) {
  const session = await requireSubmitterSession();
  const id = parseId(formData);
  if (id === null) redirect(session.homePath);
  const cancelled = await cancelRequest(session.userId, id);
  if (!cancelled) redirect(`${session.basePath}/${id}?err=cancel`);
  redirect(`${session.basePath}/${id}?cancelled=1`);
}

// Step 1 of Send to HR (Task 14): submitter only, only while SIGNED (rule
// 15) — until it is sent, HR never sees the request (L7, AC-19).
export async function sendToHr(formData: FormData) {
  const session = await requireSubmitterSession();
  const id = parseId(formData);
  if (id === null) redirect(session.homePath);
  const request = await findOwnRequest(session.userId, id);
  if (!request) redirect(session.homePath);
  if (request.status !== STATUSES.SIGNED) {
    redirect(`${session.basePath}/${id}?err=stale`); // not signed yet, or final
  }
  redirect(`${session.basePath}/${id}?confirm=send`);
}

// Step 2: the only POST that moves the request into the HR queue.
export async function confirmSendToHr(formData: FormData) {
  const session = await requireSubmitterSession();
  const id = parseId(formData);
  if (id === null) redirect(session.homePath);
  const sent = await sendRequestToHr(session.userId, id);
  if (!sent) redirect(`${session.basePath}/${id}?err=stale`);
  redirect(`${session.basePath}/${id}?sent=1`);
}
