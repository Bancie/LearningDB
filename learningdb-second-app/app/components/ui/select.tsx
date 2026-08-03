import * as React from "react";

import { cn } from "~/utils/cn";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={cn(
            "stitch-input h-10 w-full appearance-none bg-[var(--color-surface-low)] px-3 pr-10 text-body-md",
            "cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-[var(--color-on-surface-variant)]">
          expand_more
        </span>
      </div>
    );
  },
);
