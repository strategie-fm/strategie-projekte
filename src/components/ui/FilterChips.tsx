"use client";

import { cn } from "@/lib/utils";

interface FilterChipOption {
  value: string;
  label: string;
  color?: string;
  dotColor?: string;
}

interface FilterChipsProps {
  label?: string;
  options: FilterChipOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
}

export function FilterChips({
  label,
  options,
  selected,
  onChange,
  className,
}: FilterChipsProps) {
  const toggleOption = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <span className="text-label-md text-text-muted">{label}</span>
      )}
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);

          // If option has a custom color (like labels)
          if (option.color) {
            return (
              <button
                key={option.value}
                onClick={() => toggleOption(option.value)}
                className="px-2.5 py-1 rounded-lg transition-all"
                style={{
                  fontSize: "0.875rem",
                  lineHeight: 1.5,
                  backgroundColor: isSelected ? option.color : `${option.color}20`,
                  color: isSelected ? "white" : option.color,
                }}
              >
                {option.label}
              </button>
            );
          }

          // Standard chip style
          return (
            <button
              key={option.value}
              onClick={() => toggleOption(option.value)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all",
                isSelected
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-text-secondary border-border hover:border-text-muted"
              )}
              style={{ fontSize: "0.875rem", lineHeight: 1.5 }}
            >
              {option.dotColor && (
                <span className={cn("w-2 h-2 rounded-full", option.dotColor)} />
              )}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
