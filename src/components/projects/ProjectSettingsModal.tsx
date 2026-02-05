"use client";

import { useState, useEffect, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { Trash2, AlertTriangle, Settings, Users, Archive } from "lucide-react";
import { updateProject, deleteProject, archiveProject } from "@/lib/database";
import type { Project } from "@/types/database";
import { ProjectTeamAccess } from "./ProjectTeamAccess";
import { cn } from "@/lib/utils";

interface ProjectSettingsModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (project: Project) => void;
  onDelete: (projectId: string) => void;
  onArchive?: (projectId: string) => void;
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

type Tab = "general" | "team";

export function ProjectSettingsModal({
  project,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onArchive,
}: ProjectSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [pendingAction, setPendingAction] = useState<"close" | "tab-team" | null>(null);

  // Track if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!project) return false;
    return (
      name !== project.name ||
      description !== (project.description || "") ||
      color !== project.color
    );
  }, [project, name, description, color]);

  // Reset form when project changes
  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || "");
      setColor(project.color);
      setShowDeleteConfirm(false);
      setShowArchiveConfirm(false);
      setShowUnsavedWarning(false);
      setPendingAction(null);
      setActiveTab("general");
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

  const handleArchive = async () => {
    if (!project || isArchiving) return;

    setIsArchiving(true);
    const archived = await archiveProject(project.id);

    if (archived) {
      onArchive?.(project.id);
      window.dispatchEvent(new Event("projectsUpdated"));
      onClose();
    }
    setIsArchiving(false);
  };

  // Handle close with unsaved changes check
  const handleClose = () => {
    if (hasUnsavedChanges) {
      setPendingAction("close");
      setShowUnsavedWarning(true);
    } else {
      onClose();
    }
  };

  // Handle tab switch with unsaved changes check
  const handleTabSwitch = (tab: Tab) => {
    if (tab === "team" && hasUnsavedChanges) {
      setPendingAction("tab-team");
      setShowUnsavedWarning(true);
    } else {
      setActiveTab(tab);
    }
  };

  // Discard changes and proceed with pending action
  const handleDiscardChanges = () => {
    // Reset to original values
    if (project) {
      setName(project.name);
      setDescription(project.description || "");
      setColor(project.color);
    }
    setShowUnsavedWarning(false);

    // Execute pending action
    if (pendingAction === "close") {
      onClose();
    } else if (pendingAction === "tab-team") {
      setActiveTab("team");
    }
    setPendingAction(null);
  };

  // Save and proceed with pending action
  const handleSaveAndProceed = async () => {
    await handleSave();
    // handleSave already calls onClose if successful
    if (pendingAction === "tab-team") {
      setActiveTab("team");
    }
    setShowUnsavedWarning(false);
    setPendingAction(null);
  };

  if (!project) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title="Aufgabenliste bearbeiten" size="lg">
        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("general")}
            className={cn(
              "flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === "general"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text-primary"
            )}
          >
            <Settings className="w-4 h-4" />
            Allgemein
          </button>
          <button
            onClick={() => handleTabSwitch("team")}
            className={cn(
              "flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === "team"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text-primary"
            )}
          >
            <Users className="w-4 h-4" />
            Team-Zugriff
          </button>
        </div>

        <div className="p-6">
          {activeTab === "general" ? (
            <>
              {/* Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface text-text-primary"
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
                  className="w-full px-3 py-2 border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none bg-surface text-text-primary"
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

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm text-text-secondary hover:bg-divider rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSave}
                  disabled={!name.trim() || isSaving || !hasUnsavedChanges}
                  className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-variant disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? "Speichern..." : "Speichern"}
                </button>
              </div>

              {/* Danger Zone */}
              <div className="mt-8 pt-6 border-t border-error/30">
                <h3 className="text-sm font-semibold text-error mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Gefahrenzone
                </h3>

                {/* Archive Section */}
                {!showArchiveConfirm ? (
                  <div className="p-4 border border-border rounded-lg bg-divider/30 mb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          Aufgabenliste archivieren
                        </p>
                        <p className="text-sm text-text-muted mt-0.5">
                          Aus der Sidebar ausblenden, kann wiederhergestellt werden
                        </p>
                      </div>
                      <button
                        onClick={() => setShowArchiveConfirm(true)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-divider transition-colors"
                      >
                        <Archive className="w-4 h-4" />
                        Archivieren
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border border-warning rounded-lg bg-warning/10 mb-3">
                    <p className="text-sm font-medium text-warning mb-2">
                      Aufgabenliste archivieren?
                    </p>
                    <p className="text-sm text-text-muted mb-4">
                      Die Aufgabenliste wird aus der Sidebar ausgeblendet. Du kannst sie jederzeit über das Archiv wiederherstellen.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleArchive}
                        disabled={isArchiving}
                        className="px-4 py-2 text-sm font-medium bg-warning text-white rounded-lg hover:bg-warning/90 disabled:opacity-50 transition-colors"
                      >
                        {isArchiving ? "Archivieren..." : "Ja, archivieren"}
                      </button>
                      <button
                        onClick={() => setShowArchiveConfirm(false)}
                        className="px-4 py-2 text-sm text-text-secondary hover:bg-divider rounded-lg transition-colors"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                )}

                {/* Delete Section */}
                {!showDeleteConfirm ? (
                  <div className="p-4 border border-error/30 rounded-lg bg-error/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          Aufgabenliste löschen
                        </p>
                        <p className="text-sm text-text-muted mt-0.5">
                          Alle Aufgaben werden unwiderruflich gelöscht
                        </p>
                      </div>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-error border border-error rounded-lg hover:bg-error hover:text-white transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Löschen
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border border-error rounded-lg bg-error/10">
                    <p className="text-sm font-medium text-error mb-2">
                      Bist du sicher?
                    </p>
                    <p className="text-sm text-text-muted mb-4">
                      Diese Aktion kann nicht rückgängig gemacht werden. Alle Aufgaben, Abschnitte und Kommentare in dieser Liste werden endgültig gelöscht.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="px-4 py-2 text-sm font-medium bg-error text-white rounded-lg hover:bg-error/90 disabled:opacity-50 transition-colors"
                      >
                        {isDeleting ? "Löschen..." : "Ja, endgültig löschen"}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-4 py-2 text-sm text-text-secondary hover:bg-divider rounded-lg transition-colors"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Team Access Tab */
            <ProjectTeamAccess projectId={project.id} />
          )}
        </div>
      </Modal>

      {/* Unsaved Changes Warning Dialog */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]">
          <div className="bg-surface rounded-xl w-full max-w-md p-6 m-4 shadow-xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  Ungespeicherte Änderungen
                </h3>
                <p className="text-sm text-text-muted mt-1">
                  Du hast Änderungen vorgenommen, die noch nicht gespeichert wurden.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowUnsavedWarning(false);
                  setPendingAction(null);
                }}
                className="px-4 py-2 text-sm text-text-secondary hover:bg-divider rounded-lg transition-colors"
              >
                Zurück
              </button>
              <button
                onClick={handleDiscardChanges}
                className="px-4 py-2 text-sm text-error hover:bg-error-light rounded-lg transition-colors"
              >
                Verwerfen
              </button>
              <button
                onClick={handleSaveAndProceed}
                disabled={!name.trim() || isSaving}
                className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-variant disabled:opacity-50 transition-colors"
              >
                {isSaving ? "Speichern..." : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
