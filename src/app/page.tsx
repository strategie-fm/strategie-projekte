"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Header } from "@/components/layout/Header";
import { SortableTaskList } from "@/components/tasks/SortableTaskList";
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
import { Calendar, Check } from "lucide-react";
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

export default function Home() {
  const [overdueTasks, setOverdueTasks] = useState<TaskWithRelations[]>([]);
  const [todayTasks, setTodayTasks] = useState<TaskWithRelations[]>([]);
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

  const loadTasks = async (silent = false) => {
    if (!silent) setLoading(true);

    const [allTasks, labelsData, profilesData] = await Promise.all([
      getTasks(),
      getLabels(),
      getProfiles(),
    ]);

    // Load assignees for all tasks
    const assigneeMap: Record<string, string[]> = {};
    await Promise.all(
      allTasks.map(async (task) => {
        const assignees = await getTaskAssignees(task.id);
        assigneeMap[task.id] = assignees.map((a) => a.user_id);
      })
    );
    setTaskAssigneeMap(assigneeMap);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdue: TaskWithRelations[] = [];
    const todayList: TaskWithRelations[] = [];
    const completed: TaskWithRelations[] = [];

    allTasks.forEach((task) => {
      // Skip tasks without due date
      if (!task.due_date) {
        return;
      }

      const taskDate = new Date(task.due_date);
      taskDate.setHours(0, 0, 0, 0);

      // Only show tasks with due_date <= today
      if (taskDate > today) {
        return;
      }

      if (task.status === "done") {
        completed.push(task);
        return;
      }

      if (taskDate < today) {
        overdue.push(task);
      } else {
        todayList.push(task);
      }
    });

    // Sort by date (ascending) then by priority (p1 first)
    const priorityOrder = { p1: 1, p2: 2, p3: 3, p4: 4 };
    const sortTasks = (tasks: TaskWithRelations[]) => {
      return [...tasks].sort((a, b) => {
        // First sort by date (ascending - oldest first)
        const dateA = a.due_date ? new Date(a.due_date).getTime() : 0;
        const dateB = b.due_date ? new Date(b.due_date).getTime() : 0;
        if (dateA !== dateB) return dateA - dateB;

        // Then by priority (p1 first)
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    };

    setOverdueTasks(sortTasks(overdue));
    setTodayTasks(sortTasks(todayList));
    setCompletedTasks(sortTasks(completed));
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

  // Listen for date changes and reload tasks (silent, to re-sort into correct lists)
  useEffect(() => {
    const handleDateChanged = () => {
      loadTasks(true);
    };

    window.addEventListener("taskDateChanged", handleDateChanged);
    return () => {
      window.removeEventListener("taskDateChanged", handleDateChanged);
    };
  }, []);

  const handleTaskUpdate = (updatedTask: TaskWithRelations) => {
    if (updatedTask.status === "done") {
      setOverdueTasks((prev) => prev.filter((t) => t.id !== updatedTask.id));
      setTodayTasks((prev) => prev.filter((t) => t.id !== updatedTask.id));
      setCompletedTasks((prev) => [updatedTask, ...prev.filter((t) => t.id !== updatedTask.id)]);
    } else {
      setCompletedTasks((prev) => prev.filter((t) => t.id !== updatedTask.id));
      setOverdueTasks((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
      );
      setTodayTasks((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
      );
    }
    if (selectedTask?.id === updatedTask.id) {
      setSelectedTask(updatedTask);
    }
  };

  const handleTaskDelete = (taskId: string) => {
    setOverdueTasks((prev) => prev.filter((t) => t.id !== taskId));
    setTodayTasks((prev) => prev.filter((t) => t.id !== taskId));
    setCompletedTasks((prev) => prev.filter((t) => t.id !== taskId));
    setSelectedTask(null);
  };

  const handleTaskCreated = () => {
    loadTasks();
  };

  const handleResetFilters = () => {
    setSelectedPriorities([]);
    setSelectedLabels([]);
    setSelectedStatus([]);
    setSelectedAssignees([]);
    setShowCompleted(false);
  };

  const todayDate = new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Build filters object for filterTasks function
  const filters = {
    priorities: selectedPriorities,
    labels: selectedLabels,
    status: selectedStatus,
    assignees: selectedAssignees,
  };

  const hasActiveFilters = selectedPriorities.length > 0 || selectedLabels.length > 0 || selectedStatus.length > 0 || selectedAssignees.length > 0;
  const filteredOverdue = filterTasks(overdueTasks, filters, taskAssigneeMap);
  const filteredToday = filterTasks(todayTasks, filters, taskAssigneeMap);
  const filteredCompleted = filterTasks(completedTasks, filters, taskAssigneeMap);

  // Get unique label IDs from overdue and today tasks only
  const relevantTasks = [...overdueTasks, ...todayTasks];
  const activeLabelIds = new Set(
    relevantTasks.flatMap((task) => task.labels?.map((l) => l.id) || [])
  );

  // Convert labels to filter options (only labels used in overdue/today tasks)
  const labelOptions = labels
    .filter((label) => activeLabelIds.has(label.id))
    .map((label) => ({
      value: label.id,
      label: label.name,
      color: label.color,
    }));

  // Get unique assignee IDs from overdue and today tasks only
  const activeAssigneeIds = new Set(
    relevantTasks.flatMap((task) => taskAssigneeMap[task.id] || [])
  );

  // Convert profiles to filter options (only users with overdue/today tasks)
  const assigneeOptions = profiles
    .filter((profile) => activeAssigneeIds.has(profile.id))
    .map((profile) => ({
      value: profile.id,
      label: profile.full_name || profile.email,
    }));

  return (
    <AppLayout>
      <Header title="Heute" subtitle={todayDate} />

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
              {/* Überfällig Section */}
              {filteredOverdue.length > 0 && (
                <section className="mb-6">
                  <SectionHeader
                    title="Überfällig"
                    count={filteredOverdue.length}
                    variant="error"
                  />
                  <SortableTaskList
                    tasks={filteredOverdue}
                    onTasksReorder={setOverdueTasks}
                    onTaskUpdate={handleTaskUpdate}
                    onTaskClick={setSelectedTask}
                    onTaskDelete={handleTaskDelete}
                    hideDragHandle
                    selectedTaskId={selectedTask?.id}
                    isOverdueSection
                  />
                </section>
              )}

              {/* Heute Section */}
              <section className="mb-6">
                <SectionHeader
                  title="Heute"
                  count={filteredToday.length}
                  variant="default"
                />
                {filteredToday.length > 0 ? (
                  <SortableTaskList
                    tasks={filteredToday}
                    onTasksReorder={setTodayTasks}
                    onTaskUpdate={handleTaskUpdate}
                    onTaskClick={setSelectedTask}
                    onTaskDelete={handleTaskDelete}
                    hideDragHandle
                    selectedTaskId={selectedTask?.id}
                  />
                ) : (
                  <EmptyState
                    icon={Calendar}
                    title={hasActiveFilters ? "Keine Aufgaben mit diesen Filtern" : "Keine Aufgaben für heute"}
                    description={hasActiveFilters ? "Passe die Filter an" : "Genieße deinen Tag!"}
                  />
                )}
              </section>

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
                        onClick={setSelectedTask}
                        onDelete={handleTaskDelete}
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

        {/* Right Column: Task Detail View */}
        <div className="w-[500px] shrink min-w-[320px] sticky top-6 self-start max-h-[calc(100vh-120px)]">
          <TaskDetailView
            task={selectedTask}
            onUpdate={handleTaskUpdate}
            onDelete={handleTaskDelete}
          />
        </div>
      </div>
    </AppLayout>
  );
}
