"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Header } from "@/components/layout/Header";
import { getArchivedProjects, unarchiveProject, deleteProject } from "@/lib/database";
import type { Project } from "@/types/database";
import { RotateCcw, Trash2, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ArchivePage() {
  const [archivedProjects, setArchivedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await getArchivedProjects();
    setArchivedProjects(data);
    setLoading(false);
  };

  const handleRestore = async (project: Project) => {
    setRestoringId(project.id);
    const restored = await unarchiveProject(project.id);
    if (restored) {
      setArchivedProjects((prev) => prev.filter((p) => p.id !== project.id));
      window.dispatchEvent(new Event("projectsUpdated"));
    }
    setRestoringId(null);
  };

  const handleDelete = async (project: Project) => {
    if (!confirm(`"${project.name}" endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      return;
    }

    setDeletingId(project.id);
    const success = await deleteProject(project.id);
    if (success) {
      setArchivedProjects((prev) => prev.filter((p) => p.id !== project.id));
    }
    setDeletingId(null);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <AppLayout>
      <Header
        title="Archiv"
        subtitle="Archivierte Aufgabenlisten verwalten"
      />

      <div className="pt-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : archivedProjects.length > 0 ? (
          <div className="bg-surface rounded-xl border border-border">
            <div className="p-4 border-b border-border">
              <p className="text-sm text-text-muted">
                {archivedProjects.length} archivierte {archivedProjects.length === 1 ? "Liste" : "Listen"}
              </p>
            </div>

            <div className="divide-y divide-border">
              {archivedProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center gap-4 p-4 hover:bg-divider/50 transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                  >
                    {project.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary truncate">
                      {project.name}
                    </p>
                    {project.description && (
                      <p className="text-sm text-text-muted truncate">
                        {project.description}
                      </p>
                    )}
                    <p className="text-xs text-text-muted mt-1">
                      Archiviert am {formatDate(project.archived_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRestore(project)}
                      disabled={restoringId === project.id}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        "bg-primary text-white hover:bg-primary-dark disabled:opacity-50"
                      )}
                      title="Wiederherstellen"
                    >
                      <RotateCcw className={cn("w-4 h-4", restoringId === project.id && "animate-spin")} />
                      {restoringId === project.id ? "..." : "Wiederherstellen"}
                    </button>

                    <button
                      onClick={() => handleDelete(project)}
                      disabled={deletingId === project.id}
                      className="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error-light transition-colors disabled:opacity-50"
                      title="Endgültig löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-surface rounded-xl border border-border p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-divider flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-text-muted" />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-2">
              Archiv ist leer
            </h3>
            <p className="text-text-muted max-w-md mx-auto">
              Archivierte Aufgabenlisten werden hier angezeigt. Du kannst Listen über die Einstellungen archivieren.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
