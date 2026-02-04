"use client";

import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "ghost";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = "default", style, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "text-text-primary outline-none transition-colors",
          variant === "default" && "px-3 py-2 h-10 bg-surface border border-border rounded-lg focus:border-primary",
          variant === "ghost" && "bg-transparent",
          className
        )}
        style={{ fontSize: "0.875rem", lineHeight: 1.5, ...style }}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
