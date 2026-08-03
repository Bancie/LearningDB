import * as React from "react";

import { cn } from "~/utils/cn";

type AlertVariant = "info" | "success" | "error";

const variantClass: Record<AlertVariant, string> = {
  info: "border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-low)] text-[var(--color-on-surface)]",
  success: "border-emerald-300 bg-emerald-50 text-emerald-900",
  error: "border-rose-300 bg-rose-50 text-rose-900",
};

export function Alert({
  className,
  variant = "info",
  children,
}: React.PropsWithChildren<{ className?: string; variant?: AlertVariant }>) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-[var(--radius-md)] border px-4 py-3 text-body-md leading-relaxed",
        variantClass[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}
