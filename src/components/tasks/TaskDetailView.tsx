"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Calendar, Trash2, Folder, RotateCcw, PlayCircle, Flag, ListTodo, MessageSquare, X } from "lucide-react";
import { updateTask, deleteTask, completeRecurringTask, getTaskRecurrence, getSubtasks, getComments } from "@/lib/database";
import type { TaskRecurrence } from "@/types/database";
import { SubtaskList } from "./SubtaskList";
import { LabelSelector } from "./LabelSelector";
import { CommentList } from "./CommentList";
import { RecurrenceSelector } from "./RecurrenceSelector";
import { AssigneeSelector } from "./AssigneeSelector";
import { ProjectSelector } from "./ProjectSelector";
import type { TaskWithRelations, Project } from "@/types/database";
import { FormField, FormRow } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/TextArea";
import { PrioritySelector } from "@/components/ui/PrioritySelector";
import { StatusSelector } from "@/components/ui/StatusSelector";
import { cn } from "@/lib/utils";

type TabType = "task" | "subtasks" | "comments";

interface TaskDetailViewProps {
  task: TaskWithRelations | null;
  onUpdate: (task: TaskWithRelations) => void;
  onDelete: (taskId: string) => void;
  onClose?: () => void;
  onNewRecurringTask?: (task: TaskWithRelations) => void;
}

export function TaskDetailView({
  task,
  onUpdate,
  onDelete,
  onClose,
  onNewRecurringTask,
}: TaskDetailViewProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"p1" | "p2" | "p3" | "p4">("p4");
  const [dueDate, setDueDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [recurrence, setRecurrence] = useState<TaskRecurrence | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("task");
  const [subtaskCount, setSubtaskCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const loadCounts = useCallback(async (taskId: string) => {
    const [subtasks, comments] = await Promise.all([
      getSubtasks(taskId),
      getComments(taskId),
    ]);
    setSubtaskCount(subtasks.length);
    setCommentCount(comments.length);
  }, []);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority);
      setDueDate(task.due_date?.split("T")[0] || "");
      setShowDeleteConfirm(false);
      setActiveTab("task");

      if (task.is_recurring) {
        getTaskRecurrence(task.id).then(setRecurrence);
      } else {
        setRecurrence(null);
      }

      loadCounts(task.id);
    }
  }, [task, loadCounts]);

  const handleSave = async () => {
    if (!task || !title.trim() || isSaving) return;

    setIsSaving(true);
    const updated = await updateTask(task.id, {
      title: title.trim(),
      description: description.trim() || null,
      priority,
      due_date: dueDate || null,
    });

    if (updated) {
      onUpdate({ ...task, ...updated });
    }
    setIsSaving(false);
  };

  const handleStatusChange = async (newStatus: "todo" | "in_progress" | "done") => {
    if (!task) return;

    if (newStatus === "done" && task.is_recurring) {
      const updated = await updateTask(task.id, {
        status: newStatus,
        completed_at: new Date().toISOString()
      });

      if (updated) {
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
      if (updated) {
        onUpdate({ ...task, ...updated });
        window.dispatchEvent(new Event("taskUpdated"));
      }
    }
  };

  const handlePriorityChange = async (newPriority: "p1" | "p2" | "p3" | "p4") => {
    setPriority(newPriority);
    if (task) {
      const updated = await updateTask(task.id, { priority: newPriority });
      if (updated) {
        onUpdate({ ...task, ...updated });
      }
    }
  };

  const handleDateChange = async (newDate: string) => {
    setDueDate(newDate);
    if (task) {
      const updated = await updateTask(task.id, { due_date: newDate || null });
      if (updated) {
        onUpdate({ ...task, ...updated });
        window.dispatchEvent(new CustomEvent("taskDateChanged", { detail: task.id }));
      }
    }
  };

  const handleDelete = async () => {
    if (!task || isDeleting) return;

    setIsDeleting(true);
    const success = await deleteTask(task.id);

    if (success) {
      onDelete(task.id);
    }
    setIsDeleting(false);
  };

  const handleRecurrenceChange = (newRecurrence: TaskRecurrence | null) => {
    setRecurrence(newRecurrence);
    if (task) {
      onUpdate({ ...task, is_recurring: !!newRecurrence });
    }
  };

  const handleBlur = () => {
    if (task && (title !== task.title || description !== (task.description || ""))) {
      handleSave();
    }
  };

  const handleDescriptionInput = () => {
    const textarea = descriptionRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  // Auto-resize description on initial load and when description changes
  useEffect(() => {
    handleDescriptionInput();
  }, [description]);

  const handleSubtaskChange = () => {
    if (task) {
      loadCounts(task.id);
    }
  };

  const handleProjectChange = (project: Project | null) => {
    if (task) {
      onUpdate({
        ...task,
        projects: project ? [project] : [],
      });
    }
  };

  if (!task) {
    return (
      <div className="flex items-center justify-center h-full bg-surface rounded-xl border border-border text-text-muted">
        <p>Wähle eine Aufgabe aus, um Details anzuzeigen</p>
      </div>
    );
  }

  const currentProject = task.projects?.[0];

  const tabs: { id: TabType; label: string; icon: typeof ListTodo; count?: number }[] = [
    { id: "task", label: "Aufgabe", icon: Flag },
    { id: "subtasks", label: "Unteraufgaben", icon: ListTodo, count: subtaskCount },
    { id: "comments", label: "Kommentare", icon: MessageSquare, count: commentCount },
  ];

  return (
    <div className="flex flex-col h-full bg-surface rounded-xl border border-border">
      {/* Header with Title and Delete */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between gap-4">
          {/* Title Input */}
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleBlur}
            variant="ghost"
            className="flex-1 h-10 font-semibold placeholder:text-text-muted"
            placeholder="Aufgabentitel..."
            style={{ fontSize: "1.375rem", lineHeight: "40px" }}
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {/* Delete Button */}
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-2 py-1 text-label-md font-medium bg-error text-white rounded-lg hover:bg-error/90 disabled:opacity-50"
                >
                  {isDeleting ? "..." : "Ja"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-1 text-label-md text-text-muted hover:text-text-primary"
                >
                  Nein
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error-light transition-colors"
                title="Aufgabe löschen"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}

            {/* Close Button */}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-divider transition-colors"
                title="Schließen"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Badges below title */}
        <div className="flex items-center gap-2 mt-2">
          {currentProject && (
            <span
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-label-sm font-medium"
              style={{
                backgroundColor: `${currentProject.color}20`,
                color: currentProject.color,
              }}
            >
              <Folder className="w-3 h-3" />
              {currentProject.name}
            </span>
          )}
          {task.is_recurring && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-md text-label-sm font-medium bg-primary-surface text-primary">
              <RotateCcw className="w-3 h-3" />
              Wiederkehrend
            </span>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border px-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 border-b-2 -mb-px transition-colors",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-text-muted hover:text-text-primary"
              )}
              style={{ fontSize: "0.875rem", lineHeight: 1.5 }}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-label-sm font-medium",
                    activeTab === tab.id
                      ? "bg-primary text-white"
                      : "bg-divider text-text-muted"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Aufgabe Tab */}
        {activeTab === "task" && (
          <div className="p-6 space-y-6">
            {/* Row 0: Aufgabenliste */}
            <ProjectSelector
              taskId={task.id}
              currentProject={currentProject || null}
              onChange={handleProjectChange}
            />

            {/* Row 1: Datum / Wiederholung */}
            <FormRow>
              <FormField label="Datum" icon={Calendar} className="flex-1">
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full"
                />
              </FormField>
              <FormField label="Wiederholung" icon={RotateCcw} className="flex-1">
                <RecurrenceSelector
                  taskId={task.id}
                  dueDate={dueDate || null}
                  onRecurrenceChange={handleRecurrenceChange}
                />
              </FormField>
            </FormRow>

            {/* Row 2: Status / Priorität */}
            <FormRow>
              <FormField label="Status" icon={PlayCircle} className="flex-1">
                <StatusSelector value={task.status} onChange={handleStatusChange} />
              </FormField>
              <FormField label="Priorität" icon={Flag} className="flex-1">
                <PrioritySelector value={priority} onChange={handlePriorityChange} />
              </FormField>
            </FormRow>

            {/* Row 3: Zugewiesen */}
            <AssigneeSelector taskId={task.id} />

            {/* Row 4: Labels */}
            <LabelSelector
              taskId={task.id}
              onLabelsChange={(labels) => {
                onUpdate({ ...task, labels });
              }}
            />

            {/* Row 5: Beschreibung */}
            <FormField label="Beschreibung">
              <TextArea
                ref={descriptionRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleBlur}
                placeholder="Beschreibung hinzufügen..."
                rows={2}
                className="min-h-[60px] overflow-hidden"
              />
            </FormField>
          </div>
        )}

        {/* Unteraufgaben Tab */}
        {activeTab === "subtasks" && (
          <div className="p-6">
            <SubtaskList
              parentTaskId={task.id}
              onSubtaskChange={handleSubtaskChange}
            />
          </div>
        )}

        {/* Kommentare Tab */}
        {activeTab === "comments" && (
          <div className="p-6">
            <CommentList taskId={task.id} />
          </div>
        )}
      </div>
    </div>
  );
}
