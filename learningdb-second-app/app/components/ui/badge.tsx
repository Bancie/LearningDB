import * as React from "react";

import { cn } from "~/lib/cn";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-full)] bg-[var(--color-secondary-container)] px-3 py-1 text-label-md text-[var(--color-on-surface)]",
        className,
      )}
      {...props}
    />
  );
}
