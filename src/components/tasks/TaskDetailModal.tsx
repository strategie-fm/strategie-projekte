"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { 
  Calendar, 
  Flag, 
  Folder, 
  Trash2, 
  X,
  Check,
  AlertCircle
} from "lucide-react";
import { updateTask, deleteTask, getProjects } from "@/lib/database";
import type { TaskWithRelations, Project, Task } from "@/types/database";
import { cn } from "@/lib/utils";

interface TaskDetailModalProps {
  task: TaskWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (task: TaskWithRelations) => void;
  onDelete: (taskId: string) => void;
}

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: TaskDetailModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("p4");
  const [dueDate, setDueDate] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority);
      setDueDate(task.due_date ? task.due_date.split("T")[0] : "");
    }
  }, [task]);

  useEffect(() => {
    getProjects().then(setProjects);
  }, []);

  const handleSave = async () => {
    if (!task || !title.trim() || isSaving) return;

    setIsSaving(true);
    const updated = await updateTask(task.id, {
      title: title.trim(),
      description: description.trim() || null,
      priority,
      due_date: dueDate || null,
    });

    if (updated) {
      onUpdate({ ...task, ...updated });
      onClose();
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!task) return;

    const success = await deleteTask(task.id);
    if (success) {
      onDelete(task.id);
      onClose();
    }
  };

  const priorityOptions = [
    { value: "p1", label: "P1", color: "text-error border-error bg-error-light" },
    { value: "p2", label: "P2", color: "text-warning border-warning bg-warning-light" },
    { value: "p3", label: "P3", color: "text-info border-info bg-info-light" },
    { value: "p4", label: "P4", color: "text-text-muted border-border bg-divider" },
  ];

  if (!task) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-xl font-semibold text-text-primary placeholder:text-text-muted outline-none mb-4"
          placeholder="Aufgabentitel..."
        />

        {/* Meta Row */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Due Date */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-text-muted" />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="px-2 py-1 text-sm border border-border rounded-lg focus:border-primary outline-none"
            />
          </div>

          {/* Priority */}
          <div className="flex items-center gap-1">
            <Flag className="w-4 h-4 text-text-muted mr-1" />
            {priorityOptions.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value as Task["priority"])}
                className={cn(
                  "px-2 py-1 text-xs font-medium rounded border transition-colors",
                  priority === p.value
                    ? p.color
                    : "border-transparent text-text-muted hover:bg-divider"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Project Badge */}
          {task.projects && task.projects.length > 0 && (
            <div className="flex items-center gap-2 px-2 py-1 bg-divider rounded-lg">
              <Folder className="w-4 h-4 text-text-muted" />
              <span
                className="w-2 h-2 rounded-sm"
                style={{ backgroundColor: task.projects[0].color }}
              />
              <span className="text-sm text-text-secondary">
                {task.projects[0].name}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Beschreibung
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:border-primary outline-none resize-none"
            rows={4}
            placeholder="Füge eine Beschreibung hinzu..."
          />
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="mb-6 p-4 bg-error-light border border-error/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-error">
                  Aufgabe wirklich löschen?
                </p>
                <p className="text-sm text-error/80 mt-1">
                  Diese Aktion kann nicht rückgängig gemacht werden.
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1.5 text-sm font-medium bg-error text-white rounded-lg hover:bg-error/90 transition-colors"
                  >
                    Ja, löschen
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-divider rounded-lg transition-colors"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error-light rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Löschen
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-secondary hover:bg-divider rounded-lg transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || isSaving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-variant disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Check className="w-4 h-4" />
              {isSaving ? "Speichern..." : "Speichern"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}