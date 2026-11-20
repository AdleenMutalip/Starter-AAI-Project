// Remark textarea with the 500-char limit (rule 16, design leave §6). Server
// actions re-validate the trimmed value — the maxLength is only guidance.
export default function RemarkField({
  name,
  label,
  defaultValue = "",
}: {
  name: string;
  label: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-semibold text-white">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={2}
        maxLength={500}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-white/20 bg-white/25 px-4 py-3 text-sm text-white placeholder-white/70 focus:border-white/60 focus:outline-none"
      />
    </div>
  );
}
