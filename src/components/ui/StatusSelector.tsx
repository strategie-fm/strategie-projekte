"use client";

import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types/database";

type SelectableStatus = "todo" | "in_progress" | "done";

interface StatusSelectorProps {
  value: TaskStatus;
  onChange: (value: SelectableStatus) => void;
  className?: string;
}

const statuses: { value: SelectableStatus; label: string; color: string }[] = [
  { value: "todo", label: "Offen", color: "bg-border text-text-secondary" },
  { value: "in_progress", label: "In Arbeit", color: "bg-primary text-white" },
  { value: "done", label: "Erledigt", color: "bg-success text-white" },
];

export function StatusSelector({ value, onChange, className }: StatusSelectorProps) {
  return (
    <div className={cn("flex gap-1 h-10", className)}>
      {statuses.map((s) => (
        <button
          key={s.value}
          type="button"
          onClick={() => onChange(s.value)}
          className={cn(
            "px-2.5 h-full rounded-lg font-medium transition-all flex items-center justify-center",
            value === s.value ? s.color : "bg-divider text-text-muted hover:bg-border"
          )}
          style={{ fontSize: "0.875rem", lineHeight: 1.5 }}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
