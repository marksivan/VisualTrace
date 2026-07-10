"use client";

import { getThemeClasses, type Theme } from "@/lib/theme";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  theme: Theme;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  theme,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const t = getThemeClasses(theme);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className={`w-full max-w-md rounded-lg border p-5 shadow-xl ${t.card}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <h2 id="confirm-dialog-title" className={`text-base font-semibold ${t.cardText}`}>
          {title}
        </h2>
        <p className={`mt-2 text-sm leading-relaxed ${t.subtext}`}>{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className={`rounded-md border px-4 py-2 text-sm font-medium ${t.toggleBtn}`}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
