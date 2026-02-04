"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface FilterBarProps {
  children: ReactNode;
  onReset?: () => void;
  showReset?: boolean;
  className?: string;
}

export function FilterBar({ children, onReset, showReset = false, className }: FilterBarProps) {
  return (
    <div className={cn("flex items-center gap-4 py-4 border-b border-border", className)}>
      <div className="flex items-center gap-6 flex-1 flex-wrap">
        {children}
      </div>
      {showReset && onReset && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-text-muted hover:text-error shrink-0"
        >
          <X className="w-3.5 h-3.5" />
          Zurücksetzen
        </Button>
      )}
    </div>
  );
}
