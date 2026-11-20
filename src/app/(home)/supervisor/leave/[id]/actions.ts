// Sign / reject server actions for the supervisor decision view (Task 13 —
// design leave rules 15–16, 19–21; AC-17/AC-18). The request id is the only
// trusted input; role, assignment, ownership and status are re-checked at
// every POST, and the transitions themselves repeat all guards in the
// WHERE clause.
"use server";

import { getCurrentUser, HOME_BY_ROLE } from "@/lib/auth";
import {
  findSupervisorRequest,
  rejectAsSupervisor,
  signRequest,
  STATUSES,
  validRemark,
} from "@/lib/leave";
import { redirect } from "next/navigation";

function parseId(formData: FormData): number | null {
  const id = Number(formData.get("id"));
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Only the assigned supervisor — never the submitter (rule 21), never another
// role, never a stale status. Redirects like a missing page when out of
// scope (rule 19) and to the stale error otherwise.
async function requireDecision(formData: FormData) {
  const session = await getCurrentUser();
  if (!session) redirect("/login");
  if (session.role !== "SUPERVISOR") {
    redirect(HOME_BY_ROLE[session.role] ?? "/login");
  }
  const id = parseId(formData);
  if (id === null) redirect("/supervisor");
  const request = await findSupervisorRequest(session.userId, id);
  if (!request) redirect("/supervisor"); // out of scope behaves like missing
  if (
    request.supervisorId !== session.userId ||
    request.employeeId === session.userId || // rule 21: never their own
    request.status !== STATUSES.PENDING_SUPERVISOR // rule 18: final is final
  ) {
    redirect(`/supervisor/leave/${id}?err=stale`);
  }
  return { session, id };
}

// Step 1 (rule 20): show the Sign panel, change nothing.
export async function signLeaveRequest(formData: FormData) {
  const { id } = await requireDecision(formData);
  redirect(`/supervisor/leave/${id}?confirm=sign`);
}

// Step 2: the only POST that signs.
export async function confirmSignLeaveRequest(formData: FormData) {
  const { session, id } = await requireDecision(formData);
  const ok = await signRequest(session.userId, id);
  redirect(ok ? `/supervisor/leave/${id}?signed=1` : `/supervisor/leave/${id}?err=stale`);
}

// Step 1: remark is validated here (rule 16) before the panel is shown; an
// empty one comes back with the AC-18 message and the text echoed into the
// textarea.
export async function rejectLeaveRequest(formData: FormData) {
  const { id } = await requireDecision(formData);
  const raw = formData.get("remark");
  const remark = validRemark(raw);
  if (remark === null) {
    const echo = typeof raw === "string" ? `&remark=${encodeURIComponent(raw.slice(0, 600))}` : "";
    redirect(`/supervisor/leave/${id}?err=remark${echo}`);
  }
  redirect(`/supervisor/leave/${id}?confirm=reject&remark=${encodeURIComponent(remark)}`);
}

// Step 2: the only POST that rejects. The remark is re-validated — the URL
// panel is display, never a trusted source (design leave §7).
export async function confirmRejectLeaveRequest(formData: FormData) {
  const { session, id } = await requireDecision(formData);
  const remark = validRemark(formData.get("remark"));
  if (remark === null) redirect(`/supervisor/leave/${id}?err=remark`);
  const ok = await rejectAsSupervisor(session.userId, id, remark);
  redirect(ok ? `/supervisor/leave/${id}?rejected=1` : `/supervisor/leave/${id}?err=stale`);
}
