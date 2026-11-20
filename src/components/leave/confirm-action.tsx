// The two-step confirm/cancel panel shared by every leave action (rule 20,
// FR-07, interview Q8). Server-rendered: the first action has already run and
// redirected here with ?confirm=<action>; this form's Confirm button posts the
// real mutation, Cancel is a plain link. Works with JavaScript disabled
// because it is an ordinary HTML form posting to a server action.
import type { ActionResult } from "@/lib/action-result";

export default function ConfirmAction({
  summary,
  action,
  confirmLabel,
  cancelHref,
  children,
}: {
  summary: string;
  action: ActionResult;
  confirmLabel: string;
  cancelHref: string;
  children?: React.ReactNode; // hidden inputs carrying the validated draft
}) {
  return (
    <div className="rounded-2xl border border-white/25 bg-indigo-500/30 p-6">
      <p className="text-sm font-semibold text-white">Confirm</p>
      <p className="mt-2 text-sm text-white/90">{summary}</p>
      <form action={action} className="mt-4 flex items-center gap-3">
        {children}
        <button
          type="submit"
          className="rounded-full bg-[#2CABE7] px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-[#1B95D3]"
        >
          {confirmLabel}
        </button>
        <a
          href={cancelHref}
          className="rounded-full border border-white/40 bg-white/15 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-white/25"
        >
          Cancel
        </a>
      </form>
    </div>
  );
}
