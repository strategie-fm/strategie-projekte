"use client";

import { useState, useEffect } from "react";
import { Calendar, ChevronDown, X } from "lucide-react";
import { createTask, getProjects } from "@/lib/database";
import type { Task, Project } from "@/types/database";

interface QuickAddTaskModalProps {
  onClose: () => void;
  onTaskCreated: (task: Task) => void;
}

export function QuickAddTaskModal({ onClose, onTaskCreated }: QuickAddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("p4");
  const [dueDate, setDueDate] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    getProjects().then(setProjects);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isCreating) return;

    setIsCreating(true);
    const task = await createTask({
      title: title.trim(),
      priority,
      due_date: dueDate || undefined,
      project_id: selectedProjectId,
    });

    if (task) {
      onTaskCreated(task);
    }
    setIsCreating(false);
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const priorityColors = {
    p1: "text-error border-error bg-error-light",
    p2: "text-warning border-warning bg-warning-light",
    p3: "text-info border-info bg-info-light",
    p4: "text-text-muted border-border bg-divider",
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary">Neue Aufgabe</h2>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-divider text-text-muted hover:text-text-primary transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Aufgabenname..."
        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:border-primary outline-none mb-4"
        autoFocus
      />

      <div className="flex items-center gap-2 mb-4 flex-wrap">
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

        {/* Project Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs border border-border rounded-lg hover:border-primary transition-colors"
          >
            {selectedProject ? (
              <>
                <span
                  className="w-2 h-2 rounded-sm"
                  style={{ backgroundColor: selectedProject.color }}
                />
                <span className="max-w-[100px] truncate">{selectedProject.name}</span>
              </>
            ) : (
              <span className="text-text-muted">Projekt wählen</span>
            )}
            <ChevronDown className="w-3 h-3 text-text-muted" />
          </button>

          {showProjectDropdown && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-surface border border-border rounded-lg shadow-lg z-10">
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProjectId(undefined);
                    setShowProjectDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-primary-bg transition-colors text-text-muted"
                >
                  Kein Projekt (Inbox)
                </button>
                {projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => {
                      setSelectedProjectId(project.id);
                      setShowProjectDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-primary-bg transition-colors flex items-center gap-2"
                  >
                    <span
                      className="w-2 h-2 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="truncate">{project.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
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

      <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm text-text-secondary hover:bg-divider rounded-lg transition-colors"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={!title.trim() || isCreating}
          className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-variant disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isCreating ? "Speichern..." : "Hinzufügen"}
        </button>
      </div>
    </form>
  );
}