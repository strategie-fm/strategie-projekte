"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

type SectionVariant = "default" | "error" | "warning" | "info" | "muted";

interface SectionHeaderProps {
  title: string;
  count?: number;
  icon?: LucideIcon;
  variant?: SectionVariant;
  className?: string;
  children?: ReactNode;
}

const variantStyles: Record<SectionVariant, { text: string; dot: string }> = {
  default: {
    text: "text-text-secondary",
    dot: "bg-primary",
  },
  error: {
    text: "text-error",
    dot: "bg-error",
  },
  warning: {
    text: "text-warning",
    dot: "bg-warning",
  },
  info: {
    text: "text-info",
    dot: "bg-info",
  },
  muted: {
    text: "text-text-muted",
    dot: "bg-text-muted",
  },
};

export function SectionHeader({
  title,
  count,
  icon: Icon,
  variant = "default",
  className,
  children,
}: SectionHeaderProps) {
  const styles = variantStyles[variant];

  return (
    <div className={cn("flex items-center justify-between mb-3", className)}>
      <h2 className={cn("text-label-lg flex items-center gap-2", styles.text)}>
        {Icon ? (
          <Icon className="w-4 h-4" />
        ) : (
          <span className={cn("w-2 h-2 rounded-full", styles.dot)} />
        )}
        {title}
        {count !== undefined && ` (${count})`}
      </h2>
      {children}
    </div>
  );
}
