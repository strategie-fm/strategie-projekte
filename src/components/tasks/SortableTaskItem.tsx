"use client";

import { useState, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, RotateCcw, ListTodo, Trash2 } from "lucide-react";
import { updateTask, deleteTask, getTaskAssignees, completeRecurringTask } from "@/lib/database";
import type { TaskWithRelations, TaskAssignee } from "@/types/database";
import { cn } from "@/lib/utils";

interface SortableTaskItemProps {
  task: TaskWithRelations;
  onUpdate?: (task: TaskWithRelations) => void;
  onClick?: (task: TaskWithRelations) => void;
  onDelete?: (taskId: string) => void;
  onNewRecurringTask?: (task: TaskWithRelations) => void;
  showProject?: boolean;
  hideDragHandle?: boolean;
  isSelected?: boolean;
  isOverdue?: boolean;
  isDragging?: boolean;
}

export function SortableTaskItem({
  task,
  onUpdate,
  onClick,
  onDelete,
  onNewRecurringTask,
  showProject = true,
  hideDragHandle = false,
  isSelected = false,
  isOverdue = false,
  isDragging,
}: SortableTaskItemProps) {
  const [assignees, setAssignees] = useState<TaskAssignee[]>([]);
  const isCompleted = task.status === "done";

  useEffect(() => {
    getTaskAssignees(task.id).then(setAssignees);

    const handleAssigneesChanged = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail === task.id) {
        getTaskAssignees(task.id).then(setAssignees);
      }
    };

    window.addEventListener("assigneesChanged", handleAssigneesChanged);
    return () => {
      window.removeEventListener("assigneesChanged", handleAssigneesChanged);
    };
  }, [task.id]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Vereinfachter Status-Toggle: Ein Klick = Erledigt/Nicht erledigt
  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const newStatus = task.status === "done" ? "todo" : "done";

    if (newStatus === "done" && task.is_recurring) {
      const updated = await updateTask(task.id, {
        status: newStatus,
        completed_at: new Date().toISOString()
      });

      if (updated && onUpdate) {
        onUpdate({ ...task, ...updated });
        const newTask = await completeRecurringTask(task.id);
        if (newTask && onNewRecurringTask) {
          onNewRecurringTask(newTask);
        }
        window.dispatchEvent(new Event("taskUpdated"));
      }
    } else {
      const updated = await updateTask(task.id, {
        status: newStatus,
        completed_at: newStatus === "done" ? new Date().toISOString() : null
      });

      if (updated && onUpdate) {
        onUpdate({ ...task, ...updated });
        window.dispatchEvent(new Event("taskUpdated"));
      }
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick(task);
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleting) return;

    setIsDeleting(true);
    const success = await deleteTask(task.id);

    if (success) {
      // Notify sidebar and other components about the deletion
      window.dispatchEvent(new Event("taskUpdated"));
      if (onDelete) {
        onDelete(task.id);
      }
    }
    setIsDeleting(false);
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  const priorityBadgeColors = {
    p1: "bg-error-light text-error",
    p2: "bg-warning-light text-warning",
    p3: "bg-info-light text-info",
    p4: "bg-divider text-text-muted",
  };

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return null;

    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);

    if (taskDate.getTime() === today.getTime()) {
      return { text: "Heute", isOverdue: false };
    } else if (taskDate.getTime() === tomorrow.getTime()) {
      return { text: "Morgen", isOverdue: false };
    } else if (taskDate < today) {
      const diffDays = Math.ceil(
        (today.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        text: diffDays === 1 ? "Gestern" : `Vor ${diffDays} Tagen`,
        isOverdue: true,
      };
    } else {
      return {
        text: date.toLocaleDateString("de-DE", {
          day: "numeric",
          month: "short",
        }),
        isOverdue: false,
      };
    }
  };

  const dueInfo = formatDueDate(task.due_date);
  const hasDescription = !!task.description?.trim();
  const subtaskCount = task.subtaskCount;
  const labels = task.labels || [];
  const project = task.projects?.[0];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative flex items-start gap-2 px-3 py-3 transition-all group",
        // Karten-Style
        "bg-surface rounded-lg border border-border shadow-sm",
        // Basis hover
        "hover:shadow-md hover:border-border/80",
        // Dragging state
        isDragging && "opacity-50 shadow-lg",
        // Selected state - linker Akzent und Hintergrund
        isSelected && "bg-primary-bg/50 border-l-[3px] border-l-primary shadow-md",
        // Overdue state - roter linker Rand (wenn nicht selected)
        isOverdue && !isSelected && !isCompleted && "border-l-[3px] border-l-error",
        // Clickable
        onClick && "cursor-pointer"
      )}
    >
      {/* Drag Handle - nur wenn nicht versteckt */}
      {!hideDragHandle && (
        <button
          {...attributes}
          {...listeners}
          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-divider text-text-muted cursor-grab active:cursor-grabbing transition-opacity mt-0.5"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}

      {/* Status Toggle - vereinfacht */}
      <button
        onClick={handleToggleComplete}
        className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors mt-0.5",
          isCompleted
            ? "bg-success border-success text-white"
            : "border-border hover:border-success hover:bg-success/10"
        )}
        title={isCompleted ? "Als offen markieren" : "Als erledigt markieren"}
      >
        {isCompleted && (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0" onClick={handleClick}>
        {/* Title Row mit Projekt rechtsbündig */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className={cn(
              "text-h4 flex-1 font-medium",
              isCompleted ? "text-text-muted line-through" : "text-text-primary"
            )}
            style={{ fontSize: "1rem", lineHeight: 1.4 }}
          >
            {task.title}
          </span>

          {/* Projekt rechtsbündig */}
          {showProject && project && (
            <span className="flex items-center gap-1.5 text-label-md text-text-muted flex-shrink-0">
              <span
                className="w-2 h-2 rounded-sm"
                style={{ backgroundColor: project.color }}
              />
              {project.name}
            </span>
          )}
        </div>

        {/* Description Preview */}
        {hasDescription && !isCompleted && (
          <p className="text-caption mt-0.5 line-clamp-1">
            {task.description}
          </p>
        )}

        {/* Meta Row */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Due Date - prominenter bei Überfälligkeit */}
          {dueInfo && (
            <span
              className={cn(
                "text-label-md",
                dueInfo.isOverdue && !isCompleted
                  ? "text-error font-medium"
                  : "text-text-muted"
              )}
              style={{ fontSize: "0.75rem", lineHeight: 1.5 }}
            >
              {dueInfo.text}
            </span>
          )}

          {/* Subtask Counter */}
          {subtaskCount && subtaskCount.total > 0 && (
            <span className="flex items-center gap-1 text-label-md text-text-muted">
              <ListTodo className="w-3 h-3" />
              {subtaskCount.completed}/{subtaskCount.total}
            </span>
          )}

          {/* Recurring */}
          {task.is_recurring && (
            <span title="Wiederkehrende Aufgabe">
              <RotateCcw className="w-3 h-3 text-primary" />
            </span>
          )}

          {/* Priority Badge */}
          {task.priority !== "p4" && (
            <span
              className={cn(
                "px-2.5 py-1 rounded-lg text-label-md font-medium",
                priorityBadgeColors[task.priority]
              )}
              style={{ fontSize: "0.75rem", lineHeight: 1.5 }}
            >
              {task.priority.toUpperCase()}
            </span>
          )}

          {/* Assignees Group */}
          {assignees.length > 0 && (
            <div className="flex items-center gap-1">
              {assignees.slice(0, 2).map((assignee) => (
                <span
                  key={assignee.user_id}
                  className="px-2.5 py-1 rounded-lg bg-primary-surface text-primary text-label-md"
                  style={{ fontSize: "0.75rem", lineHeight: 1.5 }}
                >
                  {assignee.profile?.full_name || assignee.profile?.email || "Unbekannt"}
                </span>
              ))}
              {assignees.length > 2 && (
                <span className="text-label-md text-text-muted" style={{ fontSize: "0.75rem", lineHeight: 1.5 }}>
                  +{assignees.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Labels Group */}
          {labels.length > 0 && (
            <div className="flex items-center gap-1">
              {labels.slice(0, 2).map((label) => (
                <span
                  key={label.id}
                  className="px-2.5 py-1 rounded-lg text-label-md text-white"
                  style={{ backgroundColor: label.color, fontSize: "0.75rem", lineHeight: 1.5 }}
                >
                  {label.name}
                </span>
              ))}
              {labels.length > 2 && (
                <span className="text-label-md text-text-muted" style={{ fontSize: "0.75rem", lineHeight: 1.5 }}>
                  +{labels.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Spacer für rechtsbündiges Löschen-Icon */}
          <div className="flex-1" />

          {/* Delete Button / Confirm - rechtsbündig */}
          {onDelete && (
            showDeleteConfirm ? (
              <div className="flex items-center gap-1">
                <span className="text-label-md text-text-muted mr-1">Löschen?</span>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-2 py-0.5 rounded text-label-md bg-error text-white hover:bg-error/90 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? "..." : "Ja"}
                </button>
                <button
                  onClick={handleCancelDelete}
                  disabled={isDeleting}
                  className="px-2 py-0.5 rounded text-label-md bg-divider text-text-secondary hover:bg-border transition-colors disabled:opacity-50"
                >
                  Nein
                </button>
              </div>
            ) : (
              <button
                onClick={handleDeleteClick}
                className="p-1 rounded-lg text-text-muted hover:text-error hover:bg-error-light transition-colors opacity-0 group-hover:opacity-100"
                title="Löschen"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
