"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Header } from "@/components/layout/Header";
import { SortableTaskItem } from "@/components/tasks/SortableTaskItem";
import { QuickAddTask } from "@/components/tasks/QuickAddTask";
import { TaskDetailView } from "@/components/tasks/TaskDetailView";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterBar } from "@/components/ui/FilterBar";
import { FilterChips } from "@/components/ui/FilterChips";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { getTasks, getLabels, getProfiles, getTaskAssignees } from "@/lib/database";
import type { TaskWithRelations, Label, Profile } from "@/types/database";
import { CalendarDays, Check } from "lucide-react";
import { filterTasks } from "@/components/filters/TaskFilters";

// Filter options
const priorityOptions = [
  { value: "p1", label: "P1", dotColor: "bg-error" },
  { value: "p2", label: "P2", dotColor: "bg-warning" },
  { value: "p3", label: "P3", dotColor: "bg-info" },
  { value: "p4", label: "P4", dotColor: "bg-text-muted" },
];

const statusOptions = [
  { value: "todo", label: "Offen" },
  { value: "in_progress", label: "In Arbeit" },
];

interface GroupedTasks {
  date: string;
  label: string;
  tasks: TaskWithRelations[];
}

export default function UpcomingPage() {
  const [groupedTasks, setGroupedTasks] = useState<GroupedTasks[]>([]);
  const [allTasks, setAllTasks] = useState<TaskWithRelations[]>([]);
  const [completedTasks, setCompletedTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [labels, setLabels] = useState<Label[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [taskAssigneeMap, setTaskAssigneeMap] = useState<Record<string, string[]>>({});

  // Filter state
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);

  const groupTasksByDate = (tasks: TaskWithRelations[]): GroupedTasks[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const groups: Record<string, TaskWithRelations[]> = {};

    tasks.forEach((task) => {
      if (!task.due_date) return;
      const dateKey = task.due_date.split("T")[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(task);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, dateTasks]) => {
        const taskDate = new Date(date);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        let label: string;
        if (taskDate.getTime() === today.getTime()) {
          label = "Heute";
        } else if (taskDate.getTime() === tomorrow.getTime()) {
          label = "Morgen";
        } else {
          label = taskDate.toLocaleDateString("de-DE", {
            weekday: "long",
            day: "numeric",
            month: "long",
          });
        }

        return { date, label, tasks: dateTasks };
      });
  };

  const loadTasks = async (silent = false) => {
    if (!silent) setLoading(true);

    const [tasksData, labelsData, profilesData] = await Promise.all([
      getTasks(),
      getLabels(),
      getProfiles(),
    ]);

    // Load assignees for all tasks
    const assigneeMap: Record<string, string[]> = {};
    await Promise.all(
      tasksData.map(async (task) => {
        const assignees = await getTaskAssignees(task.id);
        assigneeMap[task.id] = assignees.map((a) => a.user_id);
      })
    );
    setTaskAssigneeMap(assigneeMap);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming: TaskWithRelations[] = [];
    const completed: TaskWithRelations[] = [];

    tasksData.forEach((task) => {
      if (task.status === "done") {
        if (task.due_date) {
          completed.push(task);
        }
        return;
      }

      if (!task.due_date) return;

      const taskDate = new Date(task.due_date);
      taskDate.setHours(0, 0, 0, 0);

      if (taskDate >= today) {
        upcoming.push(task);
      }
    });

    upcoming.sort((a, b) => {
      return new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime();
    });

    setAllTasks(upcoming);
    setCompletedTasks(completed);
    setGroupedTasks(groupTasksByDate(upcoming));
    setLabels(labelsData);
    setProfiles(profilesData);
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // Listen for assignee changes and update the map
  useEffect(() => {
    const handleAssigneesChanged = async (event: Event) => {
      const taskId = (event as CustomEvent<string>).detail;
      const assignees = await getTaskAssignees(taskId);
      setTaskAssigneeMap((prev) => ({
        ...prev,
        [taskId]: assignees.map((a) => a.user_id),
      }));
    };

    window.addEventListener("assigneesChanged", handleAssigneesChanged);
    return () => {
      window.removeEventListener("assigneesChanged", handleAssigneesChanged);
    };
  }, []);

  // Listen for label changes and reload tasks (silent)
  useEffect(() => {
    const handleLabelsChanged = () => {
      loadTasks(true);
    };

    window.addEventListener("taskLabelsChanged", handleLabelsChanged);
    return () => {
      window.removeEventListener("taskLabelsChanged", handleLabelsChanged);
    };
  }, []);

  // Listen for date changes and reload tasks (silent, to re-sort into correct groups)
  useEffect(() => {
    const handleDateChanged = () => {
      loadTasks(true);
    };

    window.addEventListener("taskDateChanged", handleDateChanged);
    return () => {
      window.removeEventListener("taskDateChanged", handleDateChanged);
    };
  }, []);

  // Listen for project changes and reload tasks (silent)
  useEffect(() => {
    const handleProjectChanged = () => {
      loadTasks(true);
    };

    window.addEventListener("taskProjectChanged", handleProjectChanged);
    return () => {
      window.removeEventListener("taskProjectChanged", handleProjectChanged);
    };
  }, []);

  // Listen for general task updates
  useEffect(() => {
    const handleTaskUpdated = () => {
      loadTasks(true);
    };

    window.addEventListener("taskUpdated", handleTaskUpdated);
    return () => {
      window.removeEventListener("taskUpdated", handleTaskUpdated);
    };
  }, []);

  // Re-group when filters change
  useEffect(() => {
    const filters = {
      priorities: selectedPriorities,
      labels: selectedLabels,
      status: selectedStatus,
      assignees: selectedAssignees,
    };
    const filtered = filterTasks(allTasks, filters, taskAssigneeMap);
    setGroupedTasks(groupTasksByDate(filtered));
  }, [selectedPriorities, selectedLabels, selectedStatus, selectedAssignees, allTasks, taskAssigneeMap]);

  const handleTaskUpdate = (updatedTask: TaskWithRelations) => {
    if (updatedTask.status === "done") {
      // Move to completed
      setAllTasks((prev) => prev.filter((t) => t.id !== updatedTask.id));
      setCompletedTasks((prev) => [updatedTask, ...prev.filter((t) => t.id !== updatedTask.id)]);
    } else {
      // Remove from completed if was there
      setCompletedTasks((prev) => prev.filter((t) => t.id !== updatedTask.id));
      // Update in active list or add back
      setAllTasks((prev) => {
        const exists = prev.some((t) => t.id === updatedTask.id);
        if (exists) {
          return prev.map((t) => (t.id === updatedTask.id ? updatedTask : t));
        }
        return [...prev, updatedTask].sort((a, b) => {
          if (!a.due_date || !b.due_date) return 0;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        });
      });
    }
    if (selectedTask?.id === updatedTask.id) {
      setSelectedTask(updatedTask);
    }
  };

  const handleTaskDelete = (taskId: string) => {
    setAllTasks((prev) => prev.filter((t) => t.id !== taskId));
    setCompletedTasks((prev) => prev.filter((t) => t.id !== taskId));
    setSelectedTask(null);
  };

  const handleTaskCreated = (task: TaskWithRelations) => {
    loadTasks(true);
    setSelectedTask(task);
  };

  const handleTaskClick = (task: TaskWithRelations) => {
    // Toggle selection: clicking the same task again deselects it
    if (selectedTask?.id === task.id) {
      setSelectedTask(null);
    } else {
      setSelectedTask(task);
    }
  };

  const handleCloseDetail = () => {
    setSelectedTask(null);
  };

  const handleResetFilters = () => {
    setSelectedPriorities([]);
    setSelectedLabels([]);
    setSelectedStatus([]);
    setSelectedAssignees([]);
    setShowCompleted(false);
  };

  // Build filters object for filterTasks function
  const filters = {
    priorities: selectedPriorities,
    labels: selectedLabels,
    status: selectedStatus,
    assignees: selectedAssignees,
  };

  const hasActiveFilters = selectedPriorities.length > 0 || selectedLabels.length > 0 ||
                           selectedStatus.length > 0 || selectedAssignees.length > 0;

  const filteredCompleted = filterTasks(completedTasks, filters, taskAssigneeMap);

  // Get unique label IDs from upcoming tasks
  const activeLabelIds = new Set(
    allTasks.flatMap((task) => task.labels?.map((l) => l.id) || [])
  );

  // Convert labels to filter options (only labels used in upcoming tasks)
  const labelOptions = labels
    .filter((label) => activeLabelIds.has(label.id))
    .map((label) => ({
      value: label.id,
      label: label.name,
      color: label.color,
    }));

  // Get unique assignee IDs from upcoming tasks
  const activeAssigneeIds = new Set(
    allTasks.flatMap((task) => taskAssigneeMap[task.id] || [])
  );

  // Convert profiles to filter options (only users with upcoming tasks)
  const assigneeOptions = profiles
    .filter((profile) => activeAssigneeIds.has(profile.id))
    .map((profile) => ({
      value: profile.id,
      label: profile.full_name || profile.email,
    }));

  // Get today's date string for variant comparison
  const todayString = new Date().toISOString().split("T")[0];

  return (
    <AppLayout>
      <Header title="Anstehend" subtitle="Kommende Aufgaben" />

      {!loading && (
        <FilterBar
          onReset={handleResetFilters}
          showReset={hasActiveFilters || showCompleted}
        >
          <FilterChips
            label="Priorität"
            options={priorityOptions}
            selected={selectedPriorities}
            onChange={setSelectedPriorities}
          />
          <FilterChips
            label="Status"
            options={statusOptions}
            selected={selectedStatus}
            onChange={setSelectedStatus}
          />
          {assigneeOptions.length > 0 && (
            <FilterChips
              label="Zugewiesen"
              options={assigneeOptions}
              selected={selectedAssignees}
              onChange={setSelectedAssignees}
            />
          )}
          {labelOptions.length > 0 && (
            <FilterChips
              label="Labels"
              options={labelOptions}
              selected={selectedLabels}
              onChange={setSelectedLabels}
            />
          )}
          {completedTasks.length > 0 && (
            <ToggleSwitch
              label={`Erledigte anzeigen (${completedTasks.length})`}
              checked={showCompleted}
              onChange={setShowCompleted}
            />
          )}
        </FilterBar>
      )}

      <div className="pt-6 flex gap-6">
        {/* Left Column: Task Lists */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {groupedTasks.length > 0 ? (
                <>
                  {groupedTasks.map((group) => (
                    <section key={group.date} className="mb-6">
                      <SectionHeader
                        title={group.label}
                        count={group.tasks.length}
                        variant={group.date === todayString ? "default" : "info"}
                      />
                      <div className="flex flex-col gap-2">
                        {group.tasks.map((task) => (
                          <SortableTaskItem
                            key={task.id}
                            task={task}
                            onUpdate={handleTaskUpdate}
                            onClick={handleTaskClick}
                            onDelete={handleTaskDelete}
                            showProject
                            hideDragHandle
                            isSelected={selectedTask?.id === task.id}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </>
              ) : (
                <EmptyState
                  icon={CalendarDays}
                  title={hasActiveFilters ? "Keine Aufgaben mit diesen Filtern" : "Keine anstehenden Aufgaben"}
                  description={hasActiveFilters ? "Passe die Filter an" : "Aufgaben mit Fälligkeitsdatum erscheinen hier"}
                />
              )}

              {/* Erledigte Section */}
              {showCompleted && filteredCompleted.length > 0 && (
                <section className="mb-6">
                  <SectionHeader
                    title="Erledigt"
                    count={filteredCompleted.length}
                    icon={Check}
                    variant="muted"
                  />
                  <div className="flex flex-col gap-2">
                    {filteredCompleted.map((task) => (
                      <SortableTaskItem
                        key={task.id}
                        task={task}
                        onUpdate={handleTaskUpdate}
                        onClick={handleTaskClick}
                        onDelete={handleTaskDelete}
                        showProject
                        hideDragHandle
                        isSelected={selectedTask?.id === task.id}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Quick Add */}
              <QuickAddTask onTaskCreated={handleTaskCreated} />
            </>
          )}
        </div>

        {/* Right Column: Task Detail View - only show when task is selected */}
        {selectedTask && (
          <div className="w-[500px] shrink min-w-[320px] sticky top-6 self-start max-h-[calc(100vh-120px)]">
            <TaskDetailView
              task={selectedTask}
              onUpdate={handleTaskUpdate}
              onDelete={handleTaskDelete}
              onClose={handleCloseDetail}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
