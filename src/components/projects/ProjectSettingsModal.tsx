"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Trash2, AlertCircle } from "lucide-react";
import { updateProject, deleteProject } from "@/lib/database";
import type { Project } from "@/types/database";

interface ProjectSettingsModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (project: Project) => void;
  onDelete: (projectId: string) => void;
}

const PROJECT_COLORS = [
  "#3b82f6",
  "#059669",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#ef4444",
  "#f97316",
  "#6366f1",
  "#06b6d4",
];

export function ProjectSettingsModal({
  project,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: ProjectSettingsModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset form when project changes
  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || "");
      setColor(project.color);
      setShowDeleteConfirm(false);
    }
  }, [project]);

  const handleSave = async () => {
    if (!project || !name.trim() || isSaving) return;

    setIsSaving(true);
    const updated = await updateProject(project.id, {
      name: name.trim(),
      description: description.trim() || null,
      color,
    });

    if (updated) {
      onUpdate(updated);
      window.dispatchEvent(new Event("projectsUpdated"));
      onClose();
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!project || isDeleting) return;

    setIsDeleting(true);
    const success = await deleteProject(project.id);

    if (success) {
      onDelete(project.id);
      window.dispatchEvent(new Event("projectsUpdated"));
      onClose();
    }
    setIsDeleting(false);
  };

  if (!project) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Aufgabenliste bearbeiten" size="md">
      <div className="p-6">
        {/* Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            placeholder="Listenname..."
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Beschreibung
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
            rows={3}
            placeholder="Optionale Beschreibung..."
          />
        </div>

        {/* Color */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Farbe
          </label>
          <div className="flex flex-wrap gap-2">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-lg transition-all ${
                  color === c ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="mb-6 p-4 bg-error-light border border-error/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-error">
                  Aufgabenliste wirklich löschen?
                </p>
                <p className="text-sm text-error/80 mt-1">
                  Alle Aufgaben in dieser Liste werden ebenfalls gelöscht.
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-3 py-1.5 text-sm font-medium bg-error text-white rounded-lg hover:bg-error/90 disabled:opacity-50 transition-colors"
                  >
                    {isDeleting ? "Löschen..." : "Ja, löschen"}
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
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error-light rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Löschen
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-secondary hover:bg-divider rounded-lg transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || isSaving}
              className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-variant disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? "Speichern..." : "Speichern"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}