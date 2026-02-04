"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function FilterSearch({
  value,
  onChange,
  placeholder = "Suchen...",
  className,
}: FilterSearchProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full pl-9 pr-8 py-1.5 rounded-lg text-body-md",
          "border border-border hover:border-text-muted focus:border-primary focus:ring-1 focus:ring-primary",
          "bg-surface text-text-primary placeholder:text-text-muted",
          "outline-none transition-colors"
        )}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-text-muted hover:text-text-primary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
