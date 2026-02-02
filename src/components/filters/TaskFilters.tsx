"use client";

import { useState } from "react";
import { Filter, X, ChevronDown } from "lucide-react";
import type { Label } from "@/types/database";
import { cn } from "@/lib/utils";

export interface TaskFilterState {
  priorities: string[];
  labels: string[];
  status: string[];
}

interface TaskFiltersProps {
  filters: TaskFilterState;
  onFiltersChange: (filters: TaskFilterState) => void;
  availableLabels: Label[];
}

const priorities = [
  { value: "p1", label: "P1", color: "bg-error" },
  { value: "p2", label: "P2", color: "bg-warning" },
  { value: "p3", label: "P3", color: "bg-info" },
  { value: "p4", label: "P4", color: "bg-text-muted" },
];

const statuses = [
  { value: "todo", label: "Offen" },
  { value: "in_progress", label: "In Arbeit" },
  { value: "done", label: "Erledigt" },
];

export function TaskFilters({ filters, onFiltersChange, availableLabels }: TaskFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount =
    filters.priorities.length + filters.labels.length + filters.status.length;

  const togglePriority = (priority: string) => {
    const newPriorities = filters.priorities.includes(priority)
      ? filters.priorities.filter((p) => p !== priority)
      : [...filters.priorities, priority];
    onFiltersChange({ ...filters, priorities: newPriorities });
  };

  const toggleLabel = (labelId: string) => {
    const newLabels = filters.labels.includes(labelId)
      ? filters.labels.filter((l) => l !== labelId)
      : [...filters.labels, labelId];
    onFiltersChange({ ...filters, labels: newLabels });
  };

  const toggleStatus = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    onFiltersChange({ ...filters, status: newStatus });
  };

  const clearFilters = () => {
    onFiltersChange({ priorities: [], labels: [], status: [] });
  };

  return (
    <div className="relative">
      {/* Filter Toggle Button */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors",
          activeFilterCount > 0
            ? "bg-primary-surface text-primary"
            : "text-text-muted hover:text-text-primary hover:bg-divider"
        )}
      >
        <Filter className="w-4 h-4" />
        Filter
        {activeFilterCount > 0 && (
          <span className="px-1.5 py-0.5 text-xs bg-primary text-white rounded-full">
            {activeFilterCount}
          </span>
        )}
        <ChevronDown className={cn("w-4 h-4 transition-transform", showFilters && "rotate-180")} />
      </button>

      {/* Filter Dropdown */}
      {showFilters && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowFilters(false)} />
          <div className="absolute right-0 top-full mt-2 w-72 bg-surface rounded-xl shadow-lg border border-border z-20 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-text-primary">Filter</h3>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-text-muted hover:text-error flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Zurücksetzen
                </button>
              )}
            </div>

            {/* Priority Filter */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-text-secondary mb-2">Priorität</h4>
              <div className="flex flex-wrap gap-2">
                {priorities.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => togglePriority(p.value)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                      filters.priorities.includes(p.value)
                        ? "bg-primary text-white"
                        : "bg-divider text-text-secondary hover:bg-border"
                    )}
                  >
                    <span className={cn("w-2 h-2 rounded-full", p.color)} />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-text-secondary mb-2">Status</h4>
              <div className="flex flex-wrap gap-2">
                {statuses.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => toggleStatus(s.value)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                      filters.status.includes(s.value)
                        ? "bg-primary text-white"
                        : "bg-divider text-text-secondary hover:bg-border"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Label Filter */}
            {availableLabels.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-text-secondary mb-2">Labels</h4>
                <div className="flex flex-wrap gap-2">
                  {availableLabels.map((label) => (
                    <button
                      key={label.id}
                      onClick={() => toggleLabel(label.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                        filters.labels.includes(label.id)
                          ? "ring-2 ring-primary ring-offset-1"
                          : ""
                      )}
                      style={{
                        backgroundColor: filters.labels.includes(label.id)
                          ? label.color
                          : `${label.color}30`,
                        color: filters.labels.includes(label.id) ? "white" : label.color,
                      }}
                    >
                      {label.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Helper function to filter tasks
export function filterTasks(
  tasks: { priority: string; status: string; labels?: { id: string }[]; section_id?: string | null }[],
  filters: TaskFilterState
) {
  return tasks.filter((task) => {
    // Priority filter
    if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) {
      return false;
    }

    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(task.status)) {
      return false;
    }

    // Label filter
    if (filters.labels.length > 0) {
      const taskLabelIds = task.labels?.map((l) => l.id) || [];
      const hasMatchingLabel = filters.labels.some((labelId) => taskLabelIds.includes(labelId));
      if (!hasMatchingLabel) {
        return false;
      }
    }

    return true;
  });
}
