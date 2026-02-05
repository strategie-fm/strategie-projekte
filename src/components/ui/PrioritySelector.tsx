"use client";

import { cn } from "@/lib/utils";

interface PrioritySelectorProps {
  value: "p1" | "p2" | "p3" | "p4";
  onChange: (value: "p1" | "p2" | "p3" | "p4") => void;
  className?: string;
}

const priorities = [
  { value: "p1" as const, label: "P1", color: "bg-error text-white" },
  { value: "p2" as const, label: "P2", color: "bg-warning text-white" },
  { value: "p3" as const, label: "P3", color: "bg-info text-white" },
  { value: "p4" as const, label: "P4", color: "bg-divider text-text-secondary" },
];

export function PrioritySelector({ value, onChange, className }: PrioritySelectorProps) {
  return (
    <div className={cn("flex gap-1 h-10", className)}>
      {priorities.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => onChange(p.value)}
          className={cn(
            "px-2.5 h-full rounded-lg font-medium transition-all flex items-center justify-center",
            value === p.value ? p.color : "bg-divider text-text-muted hover:bg-border"
          )}
          style={{ fontSize: "0.875rem", lineHeight: 1.5 }}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
