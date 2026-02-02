"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, MoreHorizontal, Trash2, Edit2, ChevronDown, ChevronRight } from "lucide-react";
import { createSection, updateSection, deleteSection, moveTaskToSection } from "@/lib/database";
import { DroppableSection } from "./DroppableSection";
import { SortableTaskItem } from "@/components/tasks/SortableTaskItem";
import type { Section } from "@/types/database";
import type { TaskWithRelations } from "@/types/database";
import { cn } from "@/lib/utils";

interface SectionListProps {
  projectId: string;
  sections: Section[];
  tasks: TaskWithRelations[];
  onSectionsChange: (sections: Section[]) => void;
  onTaskUpdate: (task: TaskWithRelations) => void;
  onTaskClick: (task: TaskWithRelations) => void;
  onTasksReorder: (tasks: TaskWithRelations[]) => void;
}

export function SectionList({
  projectId,
  sections,
  tasks,
  onSectionsChange,
  onTaskUpdate,
  onTaskClick,
  onTasksReorder,
}: SectionListProps) {
  const [showNewSection, setShowNewSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Tasks without a section
  const unsectionedTasks = tasks.filter((t) => !t.section_id && t.status !== "done");

  // Get tasks for a specific section
  const getTasksForSection = (sectionId: string) => {
    return tasks.filter((t) => t.section_id === sectionId && t.status !== "done");
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Optional: Visual feedback during drag
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Determine target section
    let targetSectionId: string | null = null;

    // Check if dropped on a section
    if (over.id === "unsectioned") {
      targetSectionId = null;
    } else if (typeof over.id === "string") {
      // Check if it's a section ID
      const isSection = sections.some((s) => s.id === over.id);
      if (isSection) {
        targetSectionId = over.id;
      } else {
        // Dropped on another task - get that task's section
        const overTask = tasks.find((t) => t.id === over.id);
        if (overTask) {
          targetSectionId = overTask.section_id || null;
        }
      }
    }

    // Only update if section changed
    if (task.section_id !== targetSectionId) {
      const success = await moveTaskToSection(taskId, targetSectionId);
      if (success) {
        const updatedTasks = tasks.map((t) =>
          t.id === taskId ? { ...t, section_id: targetSectionId } : t
        );
        onTasksReorder(updatedTasks);
      }
    }
  };

  const handleCreateSection = async () => {
    if (!newSectionName.trim() || isCreating) return;

    setIsCreating(true);
    const section = await createSection(projectId, newSectionName.trim());

    if (section) {
      onSectionsChange([...sections, section]);
      setNewSectionName("");
      setShowNewSection(false);
    }
    setIsCreating(false);
  };

  const handleUpdateSection = async (sectionId: string) => {
    if (!editName.trim()) return;

    const updated = await updateSection(sectionId, { name: editName.trim() });
    if (updated) {
      onSectionsChange(sections.map((s) => (s.id === sectionId ? updated : s)));
    }
    setEditingSection(null);
    setEditName("");
  };

  const handleDeleteSection = async (sectionId: string) => {
    const success = await deleteSection(sectionId);
    if (success) {
      onSectionsChange(sections.filter((s) => s.id !== sectionId));
    }
    setMenuOpen(null);
  };

  const toggleCollapse = (sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const startEditing = (section: Section) => {
    setEditingSection(section.id);
    setEditName(section.name);
    setMenuOpen(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {/* Unsectioned Tasks */}
        <DroppableSection id="unsectioned" isEmpty={unsectionedTasks.length === 0}>
          {unsectionedTasks.length > 0 && (
            <div className="mb-6">
              <SortableContext
                items={unsectionedTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="bg-surface rounded-xl shadow-sm border border-border">
                  {unsectionedTasks.map((task) => (
                    <SortableTaskItem
                      key={task.id}
                      task={task}
                      onUpdate={onTaskUpdate}
                      onClick={onTaskClick}
                      showProject={false}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          )}
        </DroppableSection>

        {/* Sections */}
        {sections.map((section) => {
          const sectionTasks = getTasksForSection(section.id);
          const isCollapsed = collapsedSections.has(section.id);
          const isEditing = editingSection === section.id;

          return (
            <div key={section.id} className="mb-4">
              {/* Section Header */}
              <div className="flex items-center gap-2 mb-2 group">
                <button
                  onClick={() => toggleCollapse(section.id)}
                  className="p-1 rounded hover:bg-divider text-text-muted"
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {isEditing ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => handleUpdateSection(section.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdateSection(section.id);
                      if (e.key === "Escape") {
                        setEditingSection(null);
                        setEditName("");
                      }
                    }}
                    className="flex-1 px-2 py-1 text-sm font-semibold bg-surface border border-border rounded outline-none focus:border-primary"
                    autoFocus
                  />
                ) : (
                  <h3 className="flex-1 text-sm font-semibold text-text-secondary">
                    {section.name}
                    <span className="ml-2 text-text-muted font-normal">
                      ({sectionTasks.length})
                    </span>
                  </h3>
                )}

                {/* Section Menu */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === section.id ? null : section.id)}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-divider text-text-muted transition-opacity"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {menuOpen === section.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setMenuOpen(null)}
                      />
                      <div className="absolute right-0 top-full mt-1 w-40 bg-surface rounded-lg shadow-lg border border-border z-20 py-1">
                        <button
                          onClick={() => startEditing(section)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-primary hover:bg-divider"
                        >
                          <Edit2 className="w-4 h-4" />
                          Umbenennen
                        </button>
                        <button
                          onClick={() => handleDeleteSection(section.id)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-error hover:bg-error-light"
                        >
                          <Trash2 className="w-4 h-4" />
                          Löschen
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Section Tasks */}
              {!isCollapsed && (
                <DroppableSection id={section.id} isEmpty={sectionTasks.length === 0}>
                  <SortableContext
                    items={sectionTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="bg-surface rounded-xl shadow-sm border border-border min-h-[60px]">
                      {sectionTasks.length > 0 ? (
                        sectionTasks.map((task) => (
                          <SortableTaskItem
                            key={task.id}
                            task={task}
                            onUpdate={onTaskUpdate}
                            onClick={onTaskClick}
                            showProject={false}
                          />
                        ))
                      ) : (
                        <div className="px-4 py-6 text-center text-sm text-text-muted">
                          Aufgaben hierher ziehen
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </DroppableSection>
              )}
            </div>
          );
        })}

        {/* Add Section Button */}
        {showNewSection ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateSection();
                if (e.key === "Escape") {
                  setShowNewSection(false);
                  setNewSectionName("");
                }
              }}
              placeholder="Abschnittsname..."
              className="flex-1 px-3 py-2 text-sm bg-surface border border-border rounded-lg outline-none focus:border-primary"
              autoFocus
            />
            <button
              onClick={handleCreateSection}
              disabled={isCreating || !newSectionName.trim()}
              className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              {isCreating ? "..." : "Hinzufügen"}
            </button>
            <button
              onClick={() => {
                setShowNewSection(false);
                setNewSectionName("");
              }}
              className="px-3 py-2 text-sm text-text-muted hover:text-text-primary"
            >
              Abbrechen
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewSection(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-text-muted hover:text-primary hover:bg-primary-surface rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Abschnitt hinzufügen
          </button>
        )}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTask ? (
          <div className="bg-surface rounded-lg shadow-lg border border-primary p-3 opacity-90">
            <span className="text-sm font-medium">{activeTask.title}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}