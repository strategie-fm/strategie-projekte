"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Card } from "./Card";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  children,
}: EmptyStateProps) {
  return (
    <Card className={cn("p-12 text-center", className)}>
      {Icon && (
        <Icon className="w-12 h-12 text-text-muted mx-auto mb-4" />
      )}
      <p className="text-body-lg text-text-muted mb-2">{title}</p>
      {description && (
        <p className="text-body-md text-text-muted">{description}</p>
      )}
      {children}
    </Card>
  );
}
