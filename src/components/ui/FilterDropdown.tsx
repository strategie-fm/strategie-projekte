"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterDropdownOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  label?: string;
  placeholder?: string;
  options: FilterDropdownOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
}

export function FilterDropdown({
  label,
  placeholder = "Auswählen...",
  options,
  value,
  onChange,
  className,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue === value ? null : optionValue);
    setIsOpen(false);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {label && (
        <span className="text-label-md text-text-muted shrink-0">{label}:</span>
      )}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-body-md transition-colors min-w-[140px]",
            "border border-border hover:border-text-muted",
            value ? "text-text-primary" : "text-text-muted"
          )}
        >
          <span className="flex-1 text-left truncate">
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-text-muted transition-transform shrink-0",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-full min-w-[160px] bg-surface rounded-lg shadow-lg border border-border z-20 py-1 max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "flex items-center justify-between w-full px-3 py-2 text-body-md text-left transition-colors",
                  option.value === value
                    ? "bg-primary-surface text-primary"
                    : "text-text-primary hover:bg-divider"
                )}
              >
                <span>{option.label}</span>
                {option.value === value && (
                  <Check className="w-4 h-4" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
