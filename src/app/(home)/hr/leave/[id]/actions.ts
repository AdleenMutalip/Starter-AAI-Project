// Approve / reject server actions for the HR queue (Task 15 — design leave
// rules 15–18, 21; AC-20). Same pattern as the supervisor decisions: every
// POST re-derives role, queue membership and status server-side, and the
// transitions stamp hrOfficerId + decidedAt once (rule 17).
"use server";

import { getCurrentUser, HOME_BY_ROLE } from "@/lib/auth";
import {
  approveByHr,
  findHrRequest,
  rejectByHr,
  STATUSES,
  validRemark,
} from "@/lib/leave";
import { redirect } from "next/navigation";

function parseId(formData: FormData): number | null {
  const id = Number(formData.get("id"));
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Any HR user may decide any queue item — except their own submission
// (rule 21; the submitter is never HR, but the guard stays as defence).
async function requireHrDecision(formData: FormData) {
  const session = await getCurrentUser();
  if (!session) redirect("/login");
  if (session.role !== "HR") redirect(HOME_BY_ROLE[session.role] ?? "/login");
  const id = parseId(formData);
  if (id === null) redirect("/hr");
  const request = await findHrRequest(id);
  if (!request) redirect("/hr"); // never entered the queue → like missing
  if (
    request.employeeId === session.userId ||
    request.status !== STATUSES.PENDING_HR // rule 18: decided is final (rule 17)
  ) {
    redirect(`/hr/leave/${id}?err=stale`);
  }
  return { session, id };
}

// Step 1 (rule 20): show the Approve panel, change nothing.
export async function approveLeaveRequest(formData: FormData) {
  const { id } = await requireHrDecision(formData);
  redirect(`/hr/leave/${id}?confirm=approve`);
}

// Step 2: the only POST that approves — and the only one that ever stamps
// the deciding officer (rule 17).
export async function confirmApproveLeaveRequest(formData: FormData) {
  const { session, id } = await requireHrDecision(formData);
  const ok = await approveByHr(session.userId, id);
  redirect(ok ? `/hr/leave/${id}?approved=1` : `/hr/leave/${id}?err=stale`);
}

// Step 1: the remark is validated before the panel is shown (rule 16).
export async function rejectAsHrLeaveRequest(formData: FormData) {
  const { id } = await requireHrDecision(formData);
  const raw = formData.get("remark");
  const remark = validRemark(raw);
  if (remark === null) {
    const echo = typeof raw === "string" ? `&remark=${encodeURIComponent(raw.slice(0, 600))}` : "";
    redirect(`/hr/leave/${id}?err=remark${echo}`);
  }
  redirect(`/hr/leave/${id}?confirm=reject&remark=${encodeURIComponent(remark)}`);
}

// Step 2: the only POST that rejects.
export async function confirmRejectAsHrLeaveRequest(formData: FormData) {
  const { session, id } = await requireHrDecision(formData);
  const remark = validRemark(formData.get("remark"));
  if (remark === null) redirect(`/hr/leave/${id}?err=remark`);
  const ok = await rejectByHr(session.userId, id, remark);
  redirect(ok ? `/hr/leave/${id}?rejected=1` : `/hr/leave/${id}?err=stale`);
}
