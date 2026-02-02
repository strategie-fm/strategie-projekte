"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, RotateCcw } from "lucide-react";
import { toggleTaskComplete } from "@/lib/database";
import type { TaskWithRelations } from "@/types/database";
import { cn } from "@/lib/utils";

interface SortableTaskItemProps {
  task: TaskWithRelations;
  onUpdate?: (task: TaskWithRelations) => void;
  onClick?: (task: TaskWithRelations) => void;
  showProject?: boolean;
  isDragging?: boolean;
}

export function SortableTaskItem({
  task,
  onUpdate,
  onClick,
  showProject = true,
  isDragging,
}: SortableTaskItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const isCompleted = task.status === "done";

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
    if (isUpdating) return;
    setIsUpdating(true);

    const updated = await toggleTaskComplete(task.id, !isCompleted);
    if (updated && onUpdate) {
      onUpdate({ ...task, ...updated });
    }
    setIsUpdating(false);
  };

  const handleClick = () => {
    if (onClick) {
      onClick(task);
    }
  };

  const priorityColors = {
    p1: "border-error text-error",
    p2: "border-warning text-warning",
    p3: "border-info text-info",
    p4: "border-border text-text-muted",
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 px-2 py-3 hover:bg-primary-bg/50 transition-colors border-b border-divider last:border-b-0 group",
        isDragging && "opacity-50 bg-primary-bg",
        onClick && "cursor-pointer"
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-divider text-text-muted cursor-grab active:cursor-grabbing transition-opacity"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Checkbox */}
      <button
        onClick={handleToggleComplete}
        disabled={isUpdating}
        className={cn(
          "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors",
          priorityColors[task.priority],
          isCompleted && "bg-primary border-primary",
          isUpdating && "opacity-50"
        )}
      >
        {isCompleted && <Check className="w-3 h-3 text-white" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0" onClick={handleClick}>
        <div
          className={cn(
            "text-sm font-medium",
            isCompleted ? "text-text-muted line-through" : "text-text-primary"
          )}
        >
          {task.title}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-text-muted flex-wrap">
          {dueInfo && (
            <>
              <span
                className={dueInfo.isOverdue && !isCompleted ? "text-error" : ""}
              >
                {dueInfo.text}
              </span>
              <span>·</span>
            </>
          )}
          {showProject && task.projects && task.projects.length > 0 && (
            <span className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-sm"
                style={{ backgroundColor: task.projects[0].color }}
              />
              {task.projects[0].name}
            </span>
          )}
          {task.is_recurring && (
            <>
              <span>·</span>
              <RotateCcw className="w-3 h-3" />
            </>
          )}
          {task.labels && task.labels.length > 0 && (
            <>
              {task.labels.slice(0, 2).map((label) => (
                <span
                  key={label.id}
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-medium text-white"
                  style={{ backgroundColor: label.color }}
                >
                  {label.name}
                </span>
              ))}
            </>
          )}
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
        </div>
      </div>

      {/* Assignees */}
      {task.assignees && task.assignees.length > 0 && (
        <div className="flex -space-x-1">
          {task.assignees.slice(0, 3).map((assignee) => (
            <div
              key={assignee.id}
              className="w-6 h-6 rounded-full bg-primary-surface text-primary text-[10px] font-medium flex items-center justify-center border-2 border-surface"
              title={assignee.full_name || assignee.email}
            >
              {(assignee.full_name || assignee.email).charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}