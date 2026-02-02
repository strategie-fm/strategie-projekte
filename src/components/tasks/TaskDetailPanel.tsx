"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Flag, Folder, Trash2, AlertCircle, Layers } from "lucide-react";
import { updateTask, deleteTask, getProjects, getSections, moveTaskToSection } from "@/lib/database";
import type { Section } from "@/types/database";
import { SubtaskList } from "./SubtaskList";
import { LabelSelector } from "./LabelSelector";
import { CommentList } from "./CommentList";
import type { TaskWithRelations, Project } from "@/types/database";
import { cn } from "@/lib/utils";

interface TaskDetailPanelProps {
  task: TaskWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (task: TaskWithRelations) => void;
  onDelete: (taskId: string) => void;
}

const priorities = [
  { value: "p1", label: "P1", color: "bg-error text-white" },
  { value: "p2", label: "P2", color: "bg-warning text-white" },
  { value: "p3", label: "P3", color: "bg-info text-white" },
  { value: "p4", label: "P4", color: "bg-divider text-text-secondary" },
];

export function TaskDetailPanel({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: TaskDetailPanelProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"p1" | "p2" | "p3" | "p4">("p4");
  const [dueDate, setDueDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority);
      setDueDate(task.due_date?.split("T")[0] || "");
      setShowDeleteConfirm(false);
    }
  }, [task]);

  useEffect(() => {
    getProjects().then(setProjects);
    
    // Load sections if task has a project
    if (task?.projects?.[0]?.id) {
        getSections(task.projects[0].id).then(setSections);
    } else {
        setSections([]);
    }
    }, [task]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

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
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!task || isDeleting) return;

    setIsDeleting(true);
    const success = await deleteTask(task.id);

    if (success) {
      onDelete(task.id);
      onClose();
    }
    setIsDeleting(false);
  };

  // Auto-save on blur
  const handleBlur = () => {
    if (task && (title !== task.title || description !== (task.description || ""))) {
      handleSave();
    }
  };

  if (!task) return null;

  const currentProject = task.projects?.[0];

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/20 z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full max-w-lg bg-surface shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            {currentProject && (
              <span
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium"
                style={{
                  backgroundColor: `${currentProject.color}20`,
                  color: currentProject.color,
                }}
              >
                <Folder className="w-3 h-3" />
                {currentProject.name}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-divider text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleBlur}
              className="w-full text-xl font-semibold text-text-primary bg-transparent outline-none mb-4 placeholder:text-text-muted"
              placeholder="Aufgabentitel..."
            />

            {/* Meta Row */}
            <div className="flex flex-wrap gap-3 mb-6">
              {/* Due Date */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-text-muted" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    if (task) {
                      updateTask(task.id, { due_date: e.target.value || null }).then((updated) => {
                        if (updated) onUpdate({ ...task, ...updated });
                      });
                    }
                  }}
                  className="text-sm bg-transparent border border-border rounded-lg px-2 py-1 outline-none focus:border-primary"
                />
              </div>

              {/* Priority */}
              <div className="flex items-center gap-1">
                <Flag className="w-4 h-4 text-text-muted" />
                <div className="flex gap-1">
                  {priorities.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => {
                        setPriority(p.value as typeof priority);
                        if (task) {
                          updateTask(task.id, { priority: p.value as typeof priority }).then((updated) => {
                            if (updated) onUpdate({ ...task, ...updated });
                          });
                        }
                      }}
                      className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium transition-all",
                        priority === p.value ? p.color : "bg-divider text-text-muted hover:bg-border"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section */}
                {sections.length > 0 && (
                <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-text-muted" />
                    <select
                    value={task?.section_id || ""}
                    onChange={(e) => {
                        const sectionId = e.target.value || null;
                        if (task) {
                        moveTaskToSection(task.id, sectionId).then((success) => {
                            if (success) {
                            onUpdate({ ...task, section_id: sectionId });
                            }
                        });
                        }
                    }}
                    className="text-sm bg-transparent border border-border rounded-lg px-2 py-1 outline-none focus:border-primary"
                    >
                    <option value="">Kein Abschnitt</option>
                    {sections.map((section) => (
                        <option key={section.id} value={section.id}>
                        {section.name}
                        </option>
                    ))}
                    </select>
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
                onBlur={handleBlur}
                className="w-full px-3 py-2 text-sm bg-surface-variant border border-border rounded-lg outline-none focus:border-primary resize-none min-h-[100px]"
                placeholder="Beschreibung hinzufügen..."
                rows={4}
              />
            </div>

            {/* Subtasks */}
            <div className="mb-6 pb-6 border-b border-border">
              <SubtaskList parentTaskId={task.id} />
            </div>

            {/* Labels */}
            <div className="mb-6 pb-6 border-b border-border">
              <LabelSelector
                taskId={task.id}
                onLabelsChange={(labels) => {
                  onUpdate({ ...task, labels });
                }}
              />
            </div>

            {/* Comments */}
            <div className="mb-6">
              <CommentList taskId={task.id} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-3 p-3 bg-error-light rounded-lg">
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-error">Aufgabe löschen?</p>
              </div>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3 py-1.5 text-sm font-medium bg-error text-white rounded-lg hover:bg-error/90 disabled:opacity-50"
              >
                {isDeleting ? "..." : "Ja"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-divider rounded-lg"
              >
                Nein
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error-light rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Aufgabe löschen
            </button>
          )}
        </div>
      </div>
    </>
  );
}