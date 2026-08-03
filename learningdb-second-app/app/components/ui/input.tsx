import * as React from "react";

import { cn } from "~/utils/cn";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn("stitch-input h-10 w-full px-3 text-body-md", className)} {...props} />;
  },
);
