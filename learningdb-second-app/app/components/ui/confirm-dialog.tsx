import { Button } from "~/components/ui/button";

type ConfirmVariant = "default" | "secondary" | "ghost" | "danger" | "success";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ConfirmVariant;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
  zIndexClass?: string;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "default",
  onConfirm,
  onCancel,
  busy = false,
  zIndexClass = "z-[120]",
}: Props) {
  if (!open) return null;

  return (
    <div className={`fixed inset-0 ${zIndexClass} flex items-center justify-center bg-black/35 p-4`}>
      <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[color:var(--color-outline-variant)]/40 bg-[var(--color-surface-lowest)] p-5 shadow-[var(--shadow-ambient)]">
        <h3 className="mb-2 text-title-md">{title}</h3>
        <p className="mb-5 text-body-md text-[var(--color-on-surface-variant)]">{message}</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant={confirmVariant} disabled={busy} onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button type="button" variant="ghost" disabled={busy} onClick={onCancel}>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
