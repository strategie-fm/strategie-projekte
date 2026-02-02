"use client";

import { useState } from "react";
import { Plus, Calendar, Flag, X } from "lucide-react";
import { createTask } from "@/lib/database";
import type { Task, Project } from "@/types/database";

interface QuickAddTaskProps {
  projectId?: string;
  onTaskCreated?: (task: Task) => void;
}

export function QuickAddTask({ projectId, onTaskCreated }: QuickAddTaskProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("p4");
  const [dueDate, setDueDate] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isCreating) return;

    setIsCreating(true);
    const task = await createTask({
      title: title.trim(),
      priority,
      due_date: dueDate || undefined,
      project_id: projectId,
    });

    if (task) {
      setTitle("");
      setPriority("p4");
      setDueDate("");
      setIsOpen(false);
      onTaskCreated?.(task);
    }
    setIsCreating(false);
  };

  const priorityColors = {
    p1: "text-error border-error bg-error-light",
    p2: "text-warning border-warning bg-warning-light",
    p3: "text-info border-info bg-info-light",
    p4: "text-text-muted border-border bg-divider",
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center gap-3 px-4 py-3 border-2 border-dashed border-border rounded-xl text-text-muted hover:border-primary hover:text-primary transition-colors"
      >
        <Plus className="w-5 h-5" />
        <span>Aufgabe hinzufügen</span>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface rounded-xl shadow-md border border-border p-4"
    >
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Aufgabenname..."
        className="w-full text-sm font-medium text-text-primary placeholder:text-text-muted outline-none mb-3"
        autoFocus
      />

      <div className="flex items-center gap-2 mb-4">
        {/* Due Date */}
        <div className="relative">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg focus:border-primary outline-none"
          />
          <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        </div>

        {/* Priority */}
        <div className="flex items-center gap-1">
          {(["p1", "p2", "p3", "p4"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={`px-2 py-1 text-xs font-medium rounded border transition-colors ${
                priority === p
                  ? priorityColors[p]
                  : "border-transparent text-text-muted hover:bg-divider"
              }`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setTitle("");
            setPriority("p4");
            setDueDate("");
          }}
          className="px-3 py-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={!title.trim() || isCreating}
          className="px-4 py-1.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-variant disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isCreating ? "Speichern..." : "Hinzufügen"}
        </button>
      </div>
    </form>
  );
}