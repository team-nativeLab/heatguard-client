export default function ConfirmDialog({
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  destructive = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="absolute inset-0 backdrop-blur-sm bg-black/80 flex items-center justify-center z-[90] px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-2xl w-full max-w-[360px] p-6 flex flex-col items-start">
        <h3 className="font-semibold text-[var(--color-text-heading)] text-base">{title}</h3>
        {description && <p className="text-[var(--color-text-body)] text-sm pt-2">{description}</p>}
        <div className="flex gap-2 pt-6 w-full justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="border border-[var(--color-border)] text-[var(--color-text-label)] text-sm px-4 py-2 rounded hover:brightness-125 transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`text-sm font-medium px-4 py-2 rounded text-white transition hover:brightness-110 ${
              destructive ? "bg-[#dc2626]" : "bg-[var(--color-accent)]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
