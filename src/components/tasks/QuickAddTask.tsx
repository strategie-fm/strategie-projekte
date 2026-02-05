"use client";

import { useState, useEffect } from "react";
import { Plus, ChevronDown, Folder, Calendar, PlayCircle, Flag, Layers } from "lucide-react";
import { createTask, getProjects } from "@/lib/database";
import type { Task, Project, TaskWithRelations, Section } from "@/types/database";
import { PrioritySelector } from "@/components/ui/PrioritySelector";
import { StatusSelector } from "@/components/ui/StatusSelector";
import { Input } from "@/components/ui/Input";
import { FormField, FormRow } from "@/components/ui/FormField";
import { cn } from "@/lib/utils";

interface QuickAddTaskProps {
  projectId?: string;
  sections?: Section[];
  onTaskCreated?: (task: TaskWithRelations) => void;
}

export function QuickAddTask({ projectId, sections = [], onTaskCreated }: QuickAddTaskProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("p4");
  const [status, setStatus] = useState<"todo" | "in_progress">("todo");
  const [dueDate, setDueDate] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(projectId);
  const [selectedSectionId, setSelectedSectionId] = useState<string | undefined>(undefined);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    getProjects().then(setProjects);
  }, []);

  useEffect(() => {
    setSelectedProjectId(projectId);
  }, [projectId]);

  // Set default due date to today when opening
  useEffect(() => {
    if (isOpen && !dueDate) {
      const today = new Date().toISOString().split("T")[0];
      setDueDate(today);
    }
  }, [isOpen, dueDate]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isCreating) return;

    setIsCreating(true);
    const task = await createTask({
      title: title.trim(),
      priority,
      status,
      due_date: dueDate || undefined,
      project_id: selectedProjectId,
      section_id: selectedSectionId,
    });

    if (task) {
      // Build TaskWithRelations for the callback
      const taskProject = projects.find(p => p.id === selectedProjectId);
      const taskWithRelations: TaskWithRelations = {
        ...task,
        projects: taskProject ? [taskProject] : [],
        labels: [],
      };

      // Reset form
      setTitle("");
      setPriority("p4");
      setStatus("todo");
      setDueDate("");
      if (!projectId) {
        setSelectedProjectId(undefined);
      }
      setSelectedSectionId(undefined);
      setShowProjectDropdown(false);
      setShowSectionDropdown(false);
      setIsOpen(false);

      // Notify parent - this will open the task in TaskDetailView
      onTaskCreated?.(taskWithRelations);
    }
    setIsCreating(false);
  };

  const handleCancel = () => {
    setTitle("");
    setPriority("p4");
    setStatus("todo");
    setDueDate("");
    if (!projectId) {
      setSelectedProjectId(undefined);
    }
    setSelectedSectionId(undefined);
    setShowProjectDropdown(false);
    setShowSectionDropdown(false);
    setIsOpen(false);
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedSection = sections.find(s => s.id === selectedSectionId);

  // Closed state: Show button
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

  // Open state: Show form
  return (
    <form
      onSubmit={handleCreate}
      className="bg-surface rounded-xl shadow-md border border-border p-4"
    >
      {/* Title */}
      <Input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Aufgabenname..."
        variant="ghost"
        className="w-full mb-4 font-medium"
        style={{ fontSize: "1rem" }}
        autoFocus
      />

      {/* Row 1: Projekt/Datum/Status/Priorität (oder Abschnitt/Datum/Status/Priorität auf Projektseite) */}
      <FormRow className="mb-4">
        {/* Projekt-Auswahl (nur wenn nicht auf Projektseite) */}
        {!projectId && (
          <FormField label="Projekt" icon={Folder} className="flex-1">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                className={cn(
                  "w-full h-10 flex items-center gap-2 px-3 rounded-lg transition-colors",
                  selectedProject
                    ? "bg-primary-surface text-primary"
                    : "bg-divider text-text-secondary hover:bg-border"
                )}
                style={{ fontSize: "0.875rem", lineHeight: 1.5 }}
              >
                {selectedProject ? (
                  <>
                    <span
                      className="w-2 h-2 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: selectedProject.color }}
                    />
                    <span className="flex-1 text-left truncate">{selectedProject.name}</span>
                  </>
                ) : (
                  <span className="flex-1 text-left">Inbox</span>
                )}
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              </button>

              {showProjectDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowProjectDropdown(false)}
                  />
                  <div className="absolute top-full left-0 mt-1 w-56 bg-surface border border-border rounded-lg shadow-lg z-50 py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProjectId(undefined);
                        setShowProjectDropdown(false);
                      }}
                      className={cn(
                        "w-full px-4 py-2 text-left hover:bg-divider transition-colors",
                        !selectedProjectId ? "bg-primary-surface text-primary" : "text-text-primary"
                      )}
                      style={{ fontSize: "0.875rem", lineHeight: 1.5 }}
                    >
                      Inbox (Kein Projekt)
                    </button>
                    {[...projects].sort((a, b) => a.name.localeCompare(b.name)).map((project) => (
                      <button
                        key={project.id}
                        type="button"
                        onClick={() => {
                          setSelectedProjectId(project.id);
                          setShowProjectDropdown(false);
                        }}
                        className={cn(
                          "w-full px-4 py-2 text-left hover:bg-divider transition-colors flex items-center gap-2",
                          selectedProjectId === project.id
                            ? "bg-primary-surface text-primary"
                            : "text-text-primary"
                        )}
                        style={{ fontSize: "0.875rem", lineHeight: 1.5 }}
                      >
                        <span
                          className="w-2 h-2 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: project.color }}
                        />
                        <span className="truncate">{project.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </FormField>
        )}

        {/* Abschnitt-Auswahl (nur auf Projektseite mit Abschnitten) */}
        {projectId && sections.length > 0 && (
          <FormField label="Abschnitt" icon={Layers} className="flex-1">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSectionDropdown(!showSectionDropdown)}
                className={cn(
                  "w-full h-10 flex items-center gap-2 px-3 rounded-lg transition-colors",
                  selectedSection
                    ? "bg-primary-surface text-primary"
                    : "bg-divider text-text-secondary hover:bg-border"
                )}
                style={{ fontSize: "0.875rem", lineHeight: 1.5 }}
              >
                <span className="flex-1 text-left truncate">
                  {selectedSection ? selectedSection.name : "Kein Abschnitt"}
                </span>
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              </button>

              {showSectionDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSectionDropdown(false)}
                  />
                  <div className="absolute top-full left-0 mt-1 w-56 bg-surface border border-border rounded-lg shadow-lg z-50 py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSectionId(undefined);
                        setShowSectionDropdown(false);
                      }}
                      className={cn(
                        "w-full px-4 py-2 text-left hover:bg-divider transition-colors",
                        !selectedSectionId ? "bg-primary-surface text-primary" : "text-text-primary"
                      )}
                      style={{ fontSize: "0.875rem", lineHeight: 1.5 }}
                    >
                      Kein Abschnitt
                    </button>
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => {
                          setSelectedSectionId(section.id);
                          setShowSectionDropdown(false);
                        }}
                        className={cn(
                          "w-full px-4 py-2 text-left hover:bg-divider transition-colors",
                          selectedSectionId === section.id
                            ? "bg-primary-surface text-primary"
                            : "text-text-primary"
                        )}
                        style={{ fontSize: "0.875rem", lineHeight: 1.5 }}
                      >
                        {section.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </FormField>
        )}

        <FormField label="Datum" icon={Calendar} className="flex-1">
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full"
          />
        </FormField>
        <FormField label="Status" icon={PlayCircle} className="flex-1">
          <StatusSelector
            value={status}
            onChange={(value) => {
              if (value !== "done") setStatus(value);
            }}
          />
        </FormField>
        <FormField label="Priorität" icon={Flag} className="flex-1">
          <PrioritySelector value={priority} onChange={setPriority} />
        </FormField>
      </FormRow>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <button
          type="button"
          onClick={handleCancel}
          className="px-3 py-1.5 text-body-md text-text-muted hover:text-text-primary transition-colors"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={!title.trim() || isCreating}
          className="px-4 py-1.5 text-body-md font-medium bg-primary text-white rounded-lg hover:bg-primary-variant disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isCreating ? "Erstellen..." : "Erstellen"}
        </button>
      </div>
    </form>
  );
}
