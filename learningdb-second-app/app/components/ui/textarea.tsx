import * as React from "react";

import { cn } from "~/lib/cn";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn("stitch-input min-h-24 w-full px-3 py-2 text-body-md", className)} {...props} />;
  },
);
