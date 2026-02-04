"use client";

import { useState, useEffect } from "react";
import { Plus, X, Tag, Check } from "lucide-react";
import { 
  getLabels, 
  createLabel, 
  getTaskLabels, 
  addLabelToTask, 
  removeLabelFromTask 
} from "@/lib/database";
import type { Label } from "@/types/database";
import { cn } from "@/lib/utils";

interface LabelSelectorProps {
  taskId: string;
  onLabelsChange?: (labels: Label[]) => void;
}

const LABEL_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#84cc16", // lime
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#6b7280", // gray
];

export function LabelSelector({ taskId, onLabelsChange }: LabelSelectorProps) {
  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const [taskLabels, setTaskLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);

  const loadData = async () => {
    const [labels, currentLabels] = await Promise.all([
      getLabels(),
      getTaskLabels(taskId),
    ]);
    setAllLabels(labels);
    setTaskLabels(currentLabels);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [taskId]);

  const handleToggleLabel = async (label: Label) => {
    const isSelected = taskLabels.some(l => l.id === label.id);

    if (isSelected) {
      const success = await removeLabelFromTask(taskId, label.id);
      if (success) {
        const updated = taskLabels.filter(l => l.id !== label.id);
        setTaskLabels(updated);
        onLabelsChange?.(updated);
        window.dispatchEvent(new CustomEvent("taskLabelsChanged", { detail: taskId }));
      }
    } else {
      const success = await addLabelToTask(taskId, label.id);
      if (success) {
        const updated = [...taskLabels, label];
        setTaskLabels(updated);
        onLabelsChange?.(updated);
        window.dispatchEvent(new CustomEvent("taskLabelsChanged", { detail: taskId }));
      }
    }
  };

  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelName.trim() || isCreating) return;

    setIsCreating(true);
    const label = await createLabel({
      name: newLabelName.trim(),
      color: newLabelColor,
    });

    if (label) {
      setAllLabels([...allLabels, label]);
      setNewLabelName("");
      setShowCreateNew(false);
      // Automatically add to task
      await addLabelToTask(taskId, label.id);
      const updated = [...taskLabels, label];
      setTaskLabels(updated);
      onLabelsChange?.(updated);
      window.dispatchEvent(new CustomEvent("taskLabelsChanged", { detail: taskId }));
    }
    setIsCreating(false);
  };

  if (loading) {
    return (
      <div className="py-2">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-text-secondary flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Labels
        </h3>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="text-xs text-primary hover:text-primary-variant transition-colors"
        >
          {showDropdown ? "Schließen" : "Bearbeiten"}
        </button>
      </div>

      {/* Current Labels */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {taskLabels.length > 0 ? (
          taskLabels.map((label) => (
            <span
              key={label.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-body-md font-medium text-white"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
              {showDropdown && (
                <button
                  onClick={() => handleToggleLabel(label)}
                  className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))
        ) : (
          <span className="text-sm text-text-muted">Keine Labels</span>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="mt-3 p-3 bg-divider/50 rounded-lg">
          {/* Available Labels */}
          {allLabels.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-text-muted mb-2">Verfügbare Labels</p>
              <div className="flex flex-wrap gap-1.5">
                {allLabels.map((label) => {
                  const isSelected = taskLabels.some(l => l.id === label.id);
                  return (
                    <button
                      key={label.id}
                      onClick={() => handleToggleLabel(label)}
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all",
                        isSelected
                          ? "text-white ring-2 ring-offset-1"
                          : "text-white opacity-60 hover:opacity-100"
                      )}
                      style={{
                        backgroundColor: label.color,
                        fontSize: "0.875rem",
                        lineHeight: 1.5,
                      }}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      {label.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Create New */}
          {showCreateNew ? (
            <form onSubmit={handleCreateLabel} className="space-y-2">
              <input
                type="text"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="Label-Name..."
                className="w-full px-2 py-1.5 text-sm border border-border rounded-lg focus:border-primary outline-none"
                autoFocus
              />
              <div className="flex flex-wrap gap-1">
                {LABEL_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewLabelColor(color)}
                    className={cn(
                      "w-6 h-6 rounded-full transition-all",
                      newLabelColor === color && "ring-2 ring-offset-2 ring-primary"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!newLabelName.trim() || isCreating}
                  className="px-3 py-1 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary-variant disabled:opacity-50 transition-colors"
                >
                  Erstellen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateNew(false);
                    setNewLabelName("");
                  }}
                  className="px-3 py-1 text-xs text-text-muted hover:text-text-primary transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowCreateNew(true)}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary-variant transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Neues Label erstellen
            </button>
          )}
        </div>
      )}
    </div>
  );
}