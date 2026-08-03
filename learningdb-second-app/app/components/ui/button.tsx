import * as React from "react";

import { cn } from "~/utils/cn";

type ButtonVariant = "default" | "secondary" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClass: Record<ButtonVariant, string> = {
  default: "stitch-button-primary text-white",
  secondary: "stitch-button-secondary",
  ghost: "bg-transparent text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]",
  danger: "bg-[var(--color-error)] text-white",
  success:
    "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-label-md",
  md: "h-10 px-4 text-body-md",
  lg: "h-11 px-5 text-body-md",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "default", size = "md", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-semibold transition disabled:pointer-events-none disabled:opacity-50",
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    />
  );
});
