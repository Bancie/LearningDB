import * as React from "react";

import { cn } from "~/utils/cn";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-label-md text-[var(--color-on-surface-variant)]", className)} {...props} />;
}
