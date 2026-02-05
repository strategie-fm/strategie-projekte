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
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, MoreHorizontal, Trash2, Edit2, ChevronDown, ChevronRight, Layers, ArrowUpDown, Calendar, Flag } from "lucide-react";
import { createSection, updateSection, deleteSection, moveTaskToSection } from "@/lib/database";
import { DroppableSection } from "./DroppableSection";
import { SortableTaskItem } from "@/components/tasks/SortableTaskItem";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Input } from "@/components/ui/Input";
import type { Section } from "@/types/database";
import type { TaskWithRelations } from "@/types/database";

interface SectionListProps {
  projectId: string;
  sections: Section[];
  tasks: TaskWithRelations[];
  onSectionsChange: (sections: Section[]) => void;
  onTaskUpdate: (task: TaskWithRelations) => void;
  onTaskClick: (task: TaskWithRelations) => void;
  onTaskDelete?: (taskId: string) => void;
  onTasksReorder: (tasks: TaskWithRelations[]) => void;
  onNewRecurringTask?: (task: TaskWithRelations) => void;
  selectedTaskId?: string;
}

export function SectionList({
  projectId,
  sections,
  tasks,
  onSectionsChange,
  onTaskUpdate,
  onTaskClick,
  onTaskDelete,
  onTasksReorder,
  onNewRecurringTask,
  selectedTaskId,
}: SectionListProps) {
  const [showNewSection, setShowNewSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null);

  // Sorting state per section (null = manual/drag order, "date-asc", "date-desc", "priority-asc", "priority-desc")
  type SortOption = "date-asc" | "date-desc" | "priority-asc" | "priority-desc" | null;
  const [sectionSorting, setSectionSorting] = useState<Record<string, SortOption>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Priority order for sorting
  const priorityOrder = { p1: 1, p2: 2, p3: 3, p4: 4 };

  // Sort tasks based on sorting option
  const sortTasks = (taskList: TaskWithRelations[], sortOption: SortOption): TaskWithRelations[] => {
    if (!sortOption) return taskList;

    return [...taskList].sort((a, b) => {
      switch (sortOption) {
        case "date-asc": {
          const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
          const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
          return dateA - dateB;
        }
        case "date-desc": {
          const dateA = a.due_date ? new Date(a.due_date).getTime() : -Infinity;
          const dateB = b.due_date ? new Date(b.due_date).getTime() : -Infinity;
          return dateB - dateA;
        }
        case "priority-asc":
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case "priority-desc":
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        default:
          return 0;
      }
    });
  };

  // Tasks without a section
  const unsectionedTasks = tasks.filter((t) => !t.section_id && t.status !== "done");

  // Get tasks for a specific section (with optional sorting)
  const getTasksForSection = (sectionId: string) => {
    const sectionTaskList = tasks.filter((t) => t.section_id === sectionId && t.status !== "done");
    const sortOption = sectionSorting[sectionId];
    return sortTasks(sectionTaskList, sortOption);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
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
                      onDelete={onTaskDelete}
                      onNewRecurringTask={onNewRecurringTask}
                      showProject={false}
                      isSelected={selectedTaskId === task.id}
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
              <div className="flex items-center gap-2 group">
                <button
                  onClick={() => toggleCollapse(section.id)}
                  className="p-0.5 rounded hover:bg-divider text-text-muted"
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {isEditing ? (
                  <Input
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
                    className="flex-1"
                    autoFocus
                  />
                ) : (
                  <div className="flex items-center gap-2 flex-1">
                    <SectionHeader
                      title={section.name}
                      count={sectionTasks.length}
                      icon={Layers}
                      className="flex-1 mb-0"
                    />
                    {sectionSorting[section.id] && (
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        {sectionSorting[section.id]?.startsWith("date") ? (
                          <Calendar className="w-3 h-3" />
                        ) : (
                          <Flag className="w-3 h-3" />
                        )}
                        {sectionSorting[section.id]?.endsWith("asc") ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                )}

                {/* Section Menu */}
                {!isEditing && (
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
                        <div className="absolute right-0 top-full mt-1 w-48 bg-surface rounded-lg shadow-lg border border-border z-20 py-1">
                          <button
                            onClick={() => startEditing(section)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-primary hover:bg-divider"
                          >
                            <Edit2 className="w-4 h-4" />
                            Umbenennen
                          </button>

                          {/* Sorting options */}
                          <div className="border-t border-border my-1" />
                          <div className="px-3 py-1 text-xs text-text-muted font-medium">Sortieren nach</div>
                          <button
                            onClick={() => {
                              setSectionSorting((prev) => ({
                                ...prev,
                                [section.id]: prev[section.id] === "date-asc" ? "date-desc" : "date-asc",
                              }));
                              setMenuOpen(null);
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-primary hover:bg-divider"
                          >
                            <Calendar className="w-4 h-4" />
                            Datum {sectionSorting[section.id]?.startsWith("date") && (
                              <span className="ml-auto text-xs text-text-muted">
                                {sectionSorting[section.id] === "date-asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSectionSorting((prev) => ({
                                ...prev,
                                [section.id]: prev[section.id] === "priority-asc" ? "priority-desc" : "priority-asc",
                              }));
                              setMenuOpen(null);
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-primary hover:bg-divider"
                          >
                            <Flag className="w-4 h-4" />
                            Priorität {sectionSorting[section.id]?.startsWith("priority") && (
                              <span className="ml-auto text-xs text-text-muted">
                                {sectionSorting[section.id] === "priority-asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </button>
                          {sectionSorting[section.id] && (
                            <button
                              onClick={() => {
                                setSectionSorting((prev) => {
                                  const next = { ...prev };
                                  delete next[section.id];
                                  return next;
                                });
                                setMenuOpen(null);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-muted hover:bg-divider"
                            >
                              <ArrowUpDown className="w-4 h-4" />
                              Manuelle Reihenfolge
                            </button>
                          )}

                          <div className="border-t border-border my-1" />
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
                )}
              </div>

              {/* Section Tasks */}
              {!isCollapsed && (
                <DroppableSection id={section.id} isEmpty={sectionTasks.length === 0}>
                  <SortableContext
                    items={sectionTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="mt-3 bg-surface rounded-xl shadow-sm border border-border min-h-[60px]">
                      {sectionTasks.length > 0 ? (
                        sectionTasks.map((task) => (
                          <SortableTaskItem
                            key={task.id}
                            task={task}
                            onUpdate={onTaskUpdate}
                            onClick={onTaskClick}
                            onDelete={onTaskDelete}
                            onNewRecurringTask={onNewRecurringTask}
                            showProject={false}
                            isSelected={selectedTaskId === task.id}
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

        {/* Add Section - QuickAdd style */}
        {showNewSection ? (
          <div className="bg-surface rounded-xl shadow-md border border-border p-4">
            <Input
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
              variant="ghost"
              className="w-full mb-4 font-medium"
              style={{ fontSize: "1rem" }}
              autoFocus
            />
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setShowNewSection(false);
                  setNewSectionName("");
                }}
                className="px-3 py-1.5 text-body-md text-text-muted hover:text-text-primary transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreateSection}
                disabled={isCreating || !newSectionName.trim()}
                className="px-4 py-1.5 text-body-md font-medium bg-primary text-white rounded-lg hover:bg-primary-variant disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCreating ? "Erstellen..." : "Erstellen"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowNewSection(true)}
            className="w-full flex items-center gap-3 px-4 py-3 border-2 border-dashed border-border rounded-xl text-text-muted hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Abschnitt hinzufügen</span>
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
