"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface FormFieldProps {
  label?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, icon: Icon, children, className }: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {(label || Icon) && (
        <div className="flex items-center gap-2 text-label-md text-text-muted">
          {Icon && <Icon className="w-4 h-4" />}
          {label && <span>{label}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

interface FormRowProps {
  children: ReactNode;
  className?: string;
}

export function FormRow({ children, className }: FormRowProps) {
  return (
    <div className={cn("flex items-start gap-4", className)}>
      {children}
    </div>
  );
}
