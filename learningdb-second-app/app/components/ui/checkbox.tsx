import * as React from "react";

import { cn } from "~/lib/cn";

export function Checkbox({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded border border-[var(--color-outline-variant)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]",
        className,
      )}
      {...props}
    />
  );
}
