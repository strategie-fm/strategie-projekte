"use client";

import { useState, useEffect } from "react";
import { Plus, Check, Trash2 } from "lucide-react";
import { getSubtasks, createSubtask, toggleTaskComplete, deleteTask } from "@/lib/database";
import type { Task } from "@/types/database";
import { cn } from "@/lib/utils";

interface SubtaskListProps {
  parentTaskId: string;
  onSubtaskChange?: () => void;
}

export function SubtaskList({ parentTaskId, onSubtaskChange }: SubtaskListProps) {
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [showAddInput, setShowAddInput] = useState(false);

  const loadSubtasks = async () => {
    const data = await getSubtasks(parentTaskId);
    setSubtasks(data);
    setLoading(false);
  };

  useEffect(() => {
    loadSubtasks();
  }, [parentTaskId]);

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || isAdding) return;

    setIsAdding(true);
    const subtask = await createSubtask(parentTaskId, newSubtaskTitle.trim());
    
    if (subtask) {
      setSubtasks([...subtasks, subtask]);
      setNewSubtaskTitle("");
      setShowAddInput(false);
      onSubtaskChange?.();
    }
    setIsAdding(false);
  };

  const handleToggleComplete = async (subtask: Task) => {
    const isCompleted = subtask.status === "done";
    const updated = await toggleTaskComplete(subtask.id, !isCompleted);
    
    if (updated) {
      setSubtasks(subtasks.map(s => 
        s.id === subtask.id ? { ...s, ...updated } : s
      ));
      onSubtaskChange?.();
    }
  };

  const handleDelete = async (subtaskId: string) => {
    const success = await deleteTask(subtaskId);
    if (success) {
      setSubtasks(subtasks.filter(s => s.id !== subtaskId));
      onSubtaskChange?.();
    }
  };

  const completedCount = subtasks.filter(s => s.status === "done").length;
  const totalCount = subtasks.length;

  if (loading) {
    return (
      <div className="py-4">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-text-secondary">
          Unteraufgaben
          {totalCount > 0 && (
            <span className="ml-2 text-text-muted">
              ({completedCount}/{totalCount})
            </span>
          )}
        </h3>
        {!showAddInput && (
          <button
            onClick={() => setShowAddInput(true)}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary-variant transition-colors"
          >
            <Plus className="w-4 h-4" />
            Hinzufügen
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="h-1.5 bg-divider rounded-full mb-3 overflow-hidden">
          <div
            className="h-full bg-success rounded-full transition-all duration-300"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      )}

      {/* Subtask List */}
      <div className="space-y-1">
        {subtasks.map((subtask) => {
          const isCompleted = subtask.status === "done";
          return (
            <div
              key={subtask.id}
              className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-lg hover:bg-divider/50 group transition-colors"
            >
              <button
                onClick={() => handleToggleComplete(subtask)}
                className={cn(
                  "w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                  isCompleted
                    ? "bg-success border-success"
                    : "border-border hover:border-primary"
                )}
              >
                {isCompleted && <Check className="w-3 h-3 text-white" />}
              </button>
              <span
                className={cn(
                  "flex-1 text-sm",
                  isCompleted && "text-text-muted line-through"
                )}
              >
                {subtask.title}
              </span>
              <button
                onClick={() => handleDelete(subtask.id)}
                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-error-light text-text-muted hover:text-error transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Input */}
      {showAddInput && (
        <form onSubmit={handleAddSubtask} className="mt-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-dashed border-border flex-shrink-0" />
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="Unteraufgabe hinzufügen..."
              className="flex-1 text-sm outline-none bg-transparent"
              autoFocus
              onBlur={() => {
                if (!newSubtaskTitle.trim()) {
                  setShowAddInput(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setShowAddInput(false);
                  setNewSubtaskTitle("");
                }
              }}
            />
          </div>
        </form>
      )}

      {/* Empty State */}
      {totalCount === 0 && !showAddInput && (
        <p className="text-sm text-text-muted py-2">
          Keine Unteraufgaben
        </p>
      )}
    </div>
  );
}