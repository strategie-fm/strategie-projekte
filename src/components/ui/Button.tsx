"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  active?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark shadow-primary",
  secondary: "bg-surface text-text-primary border border-border hover:bg-divider",
  ghost: "text-text-muted hover:text-text-primary hover:bg-divider",
  danger: "bg-error text-white hover:bg-error/90",
};

const activeVariantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary-dark",
  secondary: "bg-primary-surface text-primary border-primary",
  ghost: "bg-primary-surface text-primary",
  danger: "bg-error/90",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1 text-label-sm gap-1.5",
  md: "px-3 py-1.5 text-body-md gap-2",
  lg: "px-4 py-2 text-body-lg gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", active = false, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:pointer-events-none",
          variantStyles[variant],
          active && activeVariantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
