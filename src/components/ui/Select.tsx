"use client";

import { forwardRef, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  variant?: "default" | "compact";
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "text-body-md text-text-primary bg-surface border border-border rounded-lg outline-none focus:border-primary transition-colors cursor-pointer",
          variant === "default" && "px-3 py-2",
          variant === "compact" && "px-2 py-1 text-sm",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";
