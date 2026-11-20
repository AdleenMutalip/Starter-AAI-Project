// New-leave-request server actions (Task 11: design leave rules 11–14, 20–21).
// Two-step confirm (rule 20, FR-07): the first POST validates and redirects
// back with ?confirm=1 and the draft echoed in query params; only the confirm
// POST creates the row. Both POSTs re-run the same validation, so a tampered
// form (AC-14, AC-24) is refused by the server, not the browser.
"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createLeaveRequest, validateSubmission, type ValidationError } from "@/lib/leave";

const FORM_PATH = "/employee/leave/new";

function echoQuery(
  formData: FormData,
  extra: Record<string, string> = {}
): string {
  const params = new URLSearchParams();
  for (const [formKey, queryKey] of [
    ["leaveTypeId", "type"],
    ["startDate", "start"],
    ["endDate", "end"],
    ["supervisorId", "sup"],
    ["otherTypeText", "other"],
  ] as const) {
    const value = formData.get(formKey);
    if (typeof value === "string" && value) params.set(queryKey, value);
  }
  for (const [key, value] of Object.entries(extra)) params.set(key, value);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function fail(err: ValidationError, formData: FormData, detail?: string): never {
  const extra: Record<string, string> = { err };
  // AC-15: the refusal names the conflicting request.
  if (detail) extra.conflict = detail.slice(0, 200);
  redirect(`${FORM_PATH}${echoQuery(formData, extra)}`);
}

// First POST: validate and show the server-side confirm panel.
export async function submitLeaveRequest(formData: FormData): Promise<void> {
  const session = await getCurrentUser();
  const result = await validateSubmission(session, formData);
  if (!result.ok) fail(result.error, formData, result.detail);
  redirect(`${FORM_PATH}${echoQuery(formData, { confirm: "1" })}`);
}

// Confirm POST: re-validate (overlap included, design leave §7) and create.
export async function confirmSubmitLeaveRequest(formData: FormData): Promise<void> {
  const session = await getCurrentUser();
  const result = await validateSubmission(session, formData);
  if (!result.ok) fail(result.error, formData, result.detail);
  await createLeaveRequest(result.draft);
  redirect(`${FORM_PATH}?submitted=1`);
}
