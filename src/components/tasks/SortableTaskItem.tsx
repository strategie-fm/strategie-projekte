"use client";

import { useState, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, RotateCcw, ListTodo, Play } from "lucide-react";
import { updateTask, getTaskAssignees, completeRecurringTask } from "@/lib/database";
import type { TaskWithRelations, TaskAssignee } from "@/types/database";
import { cn } from "@/lib/utils";

interface SortableTaskItemProps {
  task: TaskWithRelations;
  onUpdate?: (task: TaskWithRelations) => void;
  onClick?: (task: TaskWithRelations) => void;
  onNewRecurringTask?: (task: TaskWithRelations) => void;
  showProject?: boolean;
  isDragging?: boolean;
}

export function SortableTaskItem({
  task,
  onUpdate,
  onClick,
  onNewRecurringTask,
  showProject = true,
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

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Cycle through: todo -> in_progress -> done -> todo
    let newStatus: "todo" | "in_progress" | "done";
    if (task.status === "todo") {
      newStatus = "in_progress";
    } else if (task.status === "in_progress") {
      newStatus = "done";
    } else {
      newStatus = "todo";
    }
    
    // Wenn Aufgabe als erledigt markiert wird und wiederkehrend ist
    if (newStatus === "done" && task.is_recurring) {
      // Erst die aktuelle Aufgabe als erledigt markieren
      const updated = await updateTask(task.id, { 
        status: newStatus,
        completed_at: new Date().toISOString()
      });
      
      if (updated && onUpdate) {
        onUpdate({ ...task, ...updated });
        
        // Dann neue wiederkehrende Aufgabe erstellen
        const newTask = await completeRecurringTask(task.id);
        if (newTask && onNewRecurringTask) {
          onNewRecurringTask(newTask);
        }
        
        window.dispatchEvent(new Event("taskUpdated"));
      }
    } else {
      // Normale Status-Änderung
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

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const dueInfo = formatDueDate(task.due_date);
  const hasDescription = !!task.description?.trim();
  const subtaskCount = task.subtaskCount;
  const labels = task.labels || [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-start gap-2 px-2 py-3 hover:bg-primary-bg/50 transition-colors border-b border-divider last:border-b-0 group",
        isDragging && "opacity-50 bg-primary-bg",
        onClick && "cursor-pointer"
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-divider text-text-muted cursor-grab active:cursor-grabbing transition-opacity mt-0.5"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Status Toggle */}
      <button
        onClick={handleToggleComplete}
        className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
          task.status === "done"
            ? "bg-success border-success text-white"
            : task.status === "in_progress"
            ? "bg-primary border-primary text-white"
            : "border-border hover:border-primary"
        )}
        title={
          task.status === "todo" 
            ? "Als 'In Arbeit' markieren" 
            : task.status === "in_progress" 
            ? "Als 'Erledigt' markieren" 
            : "Als 'Offen' markieren"
        }
      >
        {task.status === "done" && (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
        {task.status === "in_progress" && (
          <Play className="w-2.5 h-2.5 fill-current" />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0" onClick={handleClick}>
        {/* Title Row */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm font-medium",
              isCompleted ? "text-text-muted line-through" : "text-text-primary"
            )}
          >
            {task.title}
          </span>
        </div>

        {/* Description Preview */}
        {hasDescription && !isCompleted && (
          <p className="text-xs text-text-muted mt-0.5 line-clamp-1">
            {task.description}
          </p>
        )}

        {/* Meta Row */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {/* Due Date */}
          {dueInfo && (
            <span
              className={cn(
                "text-xs",
                dueInfo.isOverdue && !isCompleted ? "text-error font-medium" : "text-text-muted"
              )}
            >
              {dueInfo.text}
            </span>
          )}

          {/* Project */}
          {showProject && task.projects && task.projects.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <span
                className="w-2 h-2 rounded-sm"
                style={{ backgroundColor: task.projects[0].color }}
              />
              {task.projects[0].name}
            </span>
          )}

          {/* Subtask Counter */}
          {subtaskCount && subtaskCount.total > 0 && (
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <ListTodo className="w-3 h-3" />
              {subtaskCount.completed}/{subtaskCount.total}
            </span>
          )}

          {/* Recurring */}
          {task.is_recurring && (
            <RotateCcw className="w-3 h-3 text-primary" title="Wiederkehrende Aufgabe" />
          )}

          {/* Priority Badge */}
          {task.priority !== "p4" && (
            <span
              className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-medium",
                priorityBadgeColors[task.priority]
              )}
            >
              {task.priority.toUpperCase()}
            </span>
          )}

          {/* Assignees */}
          {assignees.length > 0 && (
            <div className="flex -space-x-1">
              {assignees.slice(0, 3).map((assignee) => (
                assignee.profile?.avatar_url ? (
                  <img
                    key={assignee.user_id}
                    src={assignee.profile.avatar_url}
                    alt={assignee.profile.full_name || assignee.profile.email}
                    className="w-5 h-5 rounded-full border border-surface"
                    title={assignee.profile.full_name || assignee.profile.email}
                  />
                ) : (
                  <div
                    key={assignee.user_id}
                    className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-medium flex items-center justify-center border border-surface"
                    title={assignee.profile?.full_name || assignee.profile?.email}
                  >
                    {getInitials(
                      assignee.profile?.full_name || null,
                      assignee.profile?.email || ""
                    )}
                  </div>
                )
              ))}
              {assignees.length > 3 && (
                <div className="w-5 h-5 rounded-full bg-divider text-text-muted text-[10px] font-medium flex items-center justify-center border border-surface">
                  +{assignees.length - 3}
                </div>
              )}
            </div>
          )}

          {/* Labels */}
          {labels.slice(0, 2).map((label) => (
            <span
              key={label.id}
              className="px-1.5 py-0.5 rounded-full text-[10px] font-medium text-white"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
          ))}
          {labels.length > 2 && (
            <span className="text-[10px] text-text-muted">
              +{labels.length - 2}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
