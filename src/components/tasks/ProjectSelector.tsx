"use client";

import { useState, useEffect } from "react";
import { Folder, ChevronDown, Check, X } from "lucide-react";
import { getProjects, updateTaskProject } from "@/lib/database";
import type { Project } from "@/types/database";
import { cn } from "@/lib/utils";

interface ProjectSelectorProps {
  taskId: string;
  currentProject: Project | null;
  onChange: (project: Project | null) => void;
}

export function ProjectSelector({ taskId, currentProject, onChange }: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      const data = await getProjects();
      setProjects(data);
      setLoading(false);
    };
    loadProjects();
  }, []);

  const handleSelect = async (project: Project | null) => {
    if (isSaving) return;

    setIsSaving(true);
    const success = await updateTaskProject(taskId, project?.id || null);

    if (success) {
      onChange(project);
      window.dispatchEvent(new CustomEvent("taskProjectChanged", { detail: taskId }));
      // Also trigger taskUpdated for list refreshes
      window.dispatchEvent(new Event("taskUpdated"));
    }

    setIsSaving(false);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-label-md text-text-muted">
          <Folder className="w-4 h-4" />
          <span>Aufgabenliste</span>
        </div>
        <div className="text-text-muted" style={{ fontSize: "0.875rem", lineHeight: 1.5 }}>
          Laden...
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Label */}
      <div className="flex items-center gap-2 text-label-md text-text-muted mb-1.5">
        <Folder className="w-4 h-4" />
        <span>Aufgabenliste</span>
      </div>

      {/* Current Selection Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSaving}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left",
          currentProject
            ? "bg-primary-surface"
            : "bg-divider",
          isOpen
            ? "ring-2 ring-primary"
            : "hover:bg-border",
          isSaving && "opacity-50 cursor-not-allowed"
        )}
        style={{ fontSize: "0.875rem", lineHeight: 1.5 }}
      >
        {currentProject ? (
          <>
            <span
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: currentProject.color }}
            />
            <span className="flex-1 font-medium text-text-primary truncate">
              {currentProject.name}
            </span>
          </>
        ) : (
          <>
            <span className="w-3 h-3 rounded-sm flex-shrink-0 bg-text-muted/30" />
            <span className="flex-1 text-text-muted">Kein Projekt (Eingang)</span>
          </>
        )}
        <ChevronDown className={cn(
          "w-4 h-4 text-text-muted transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-lg z-20 overflow-hidden">
            <div className="p-2 border-b border-border">
              <p className="text-label-md font-medium text-text-muted">Aufgabenliste wählen</p>
            </div>

            <div className="max-h-64 overflow-y-auto p-1">
              {/* No Project Option */}
              <button
                onClick={() => handleSelect(null)}
                className={cn(
                  "w-full flex items-center gap-3 p-2 rounded-lg transition-colors",
                  !currentProject
                    ? "bg-primary-surface"
                    : "hover:bg-divider"
                )}
              >
                <span className="w-3 h-3 rounded-sm flex-shrink-0 bg-text-muted/30" />
                <span className="flex-1 text-left font-medium text-text-primary" style={{ fontSize: "0.875rem", lineHeight: 1.5 }}>
                  Kein Projekt (Eingang)
                </span>
                {!currentProject && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>

              {/* Project Options */}
              {projects.map((project) => {
                const isSelected = currentProject?.id === project.id;

                return (
                  <button
                    key={project.id}
                    onClick={() => handleSelect(project)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-lg transition-colors",
                      isSelected
                        ? "bg-primary-surface"
                        : "hover:bg-divider"
                    )}
                  >
                    <span
                      className="w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="flex-1 text-left font-medium text-text-primary truncate" style={{ fontSize: "0.875rem", lineHeight: 1.5 }}>
                      {project.name}
                    </span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </button>
                );
              })}

              {projects.length === 0 && (
                <p className="text-text-muted text-center py-4" style={{ fontSize: "0.875rem", lineHeight: 1.5 }}>
                  Keine Aufgabenlisten vorhanden
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
