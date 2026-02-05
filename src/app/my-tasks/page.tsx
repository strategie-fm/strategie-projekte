"use client";

import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Header } from "@/components/layout/Header";
import { SortableTaskItem } from "@/components/tasks/SortableTaskItem";
import { TaskDetailView } from "@/components/tasks/TaskDetailView";
import { QuickAddTask } from "@/components/tasks/QuickAddTask";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterBar } from "@/components/ui/FilterBar";
import { FilterChips } from "@/components/ui/FilterChips";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { getTasks, getLabels, getProjects, assignTask, getTaskAssignees } from "@/lib/database";
import { supabase } from "@/lib/supabase";
import type { TaskWithRelations, Label, Project } from "@/types/database";
import { User, Check, Flag, Calendar, Folder } from "lucide-react";
import { filterTasks } from "@/components/filters/TaskFilters";
import { cn } from "@/lib/utils";

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

type GroupBy = "priority" | "date" | "project";

const groupByOptions: { value: GroupBy; label: string; icon: typeof Flag }[] = [
  { value: "priority", label: "Priorität", icon: Flag },
  { value: "date", label: "Datum", icon: Calendar },
  { value: "project", label: "Projekt", icon: Folder },
];

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [completedTasks, setCompletedTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [labels, setLabels] = useState<Label[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskAssigneeMap, setTaskAssigneeMap] = useState<Record<string, string[]>>({});

  // Filter state
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);

  // Grouping state
  const [groupBy, setGroupBy] = useState<GroupBy>("priority");

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    setCurrentUserId(user.id);

    // Get all tasks, labels, and projects
    const [allTasks, labelsData, projectsData] = await Promise.all([
      getTasks(),
      getLabels(),
      getProjects(),
    ]);

    // Build assignee map from batch-loaded data and filter tasks assigned to current user
    const myTasks: TaskWithRelations[] = [];
    const myCompletedTasks: TaskWithRelations[] = [];
    const assigneeMap: Record<string, string[]> = {};

    allTasks.forEach((task) => {
      assigneeMap[task.id] = (task.assignees || []).map((a) => a.user_id);
      const isAssignedToMe = (task.assignees || []).some((a) => a.user_id === user.id);

      if (isAssignedToMe) {
        if (task.status === "done") {
          myCompletedTasks.push(task);
        } else {
          myTasks.push(task);
        }
      }
    });

    // Sort by priority then due date
    const sortTasks = (a: TaskWithRelations, b: TaskWithRelations) => {
      const priorityOrder = { p1: 0, p2: 1, p3: 2, p4: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return 0;
    };

    setTasks(myTasks.sort(sortTasks));
    setCompletedTasks(myCompletedTasks);
    setLabels(labelsData);
    setProjects(projectsData);
    setTaskAssigneeMap(assigneeMap);
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen for assignee changes
  useEffect(() => {
    const handleAssigneesChanged = async (event: Event) => {
      const taskId = (event as CustomEvent<string>).detail;
      const assignees = await getTaskAssignees(taskId);
      setTaskAssigneeMap((prev) => ({
        ...prev,
        [taskId]: assignees.map((a) => a.user_id),
      }));
      // Reload to check if task is still assigned to me
      loadData(true);
    };

    window.addEventListener("assigneesChanged", handleAssigneesChanged);
    return () => {
      window.removeEventListener("assigneesChanged", handleAssigneesChanged);
    };
  }, [loadData]);

  // Listen for label changes
  useEffect(() => {
    const handleLabelsChanged = () => {
      loadData(true);
    };

    window.addEventListener("taskLabelsChanged", handleLabelsChanged);
    return () => {
      window.removeEventListener("taskLabelsChanged", handleLabelsChanged);
    };
  }, [loadData]);

  // Listen for general task updates
  useEffect(() => {
    const handleTaskUpdated = () => {
      loadData(true);
    };

    window.addEventListener("taskUpdated", handleTaskUpdated);
    return () => {
      window.removeEventListener("taskUpdated", handleTaskUpdated);
    };
  }, [loadData]);

  const handleTaskUpdate = (updatedTask: TaskWithRelations) => {
    if (updatedTask.status === "done") {
      setTasks((prev) => prev.filter((t) => t.id !== updatedTask.id));
      setCompletedTasks((prev) => [updatedTask, ...prev.filter((t) => t.id !== updatedTask.id)]);
    } else {
      setCompletedTasks((prev) => prev.filter((t) => t.id !== updatedTask.id));
      setTasks((prev) => {
        const exists = prev.some((t) => t.id === updatedTask.id);
        if (exists) {
          return prev.map((t) => (t.id === updatedTask.id ? updatedTask : t));
        }
        return [updatedTask, ...prev];
      });
    }
    if (selectedTask?.id === updatedTask.id) {
      setSelectedTask(updatedTask);
    }
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setCompletedTasks((prev) => prev.filter((t) => t.id !== taskId));
    setSelectedTask(null);
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

  const handleTaskCreated = async (task: TaskWithRelations) => {
    // Auto-assign the current user to the created task
    if (currentUserId) {
      await assignTask(task.id, currentUserId);
      // Dispatch event so other components know about the assignment
      window.dispatchEvent(new CustomEvent("assigneesChanged", { detail: task.id }));
    }
    loadData(true);
    setSelectedTask(task);
  };

  const handleResetFilters = () => {
    setSelectedPriorities([]);
    setSelectedLabels([]);
    setSelectedStatus([]);
    setShowCompleted(false);
  };

  // Build filters object
  const filters = {
    priorities: selectedPriorities,
    labels: selectedLabels,
    status: selectedStatus,
    assignees: [], // Not filtering by assignees on this page since all are mine
  };

  const hasActiveFilters = selectedPriorities.length > 0 || selectedLabels.length > 0 || selectedStatus.length > 0;

  // Apply filters
  const filteredTasks = filterTasks(tasks, filters, taskAssigneeMap);
  const filteredCompleted = filterTasks(completedTasks, filters, taskAssigneeMap);

  // Grouping functions
  const groupByPriority = (taskList: TaskWithRelations[]) => {
    return {
      p1: taskList.filter((t) => t.priority === "p1"),
      p2: taskList.filter((t) => t.priority === "p2"),
      p3: taskList.filter((t) => t.priority === "p3"),
      p4: taskList.filter((t) => t.priority === "p4"),
    };
  };

  const groupByDate = (taskList: TaskWithRelations[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdue: TaskWithRelations[] = [];
    const todayList: TaskWithRelations[] = [];
    const upcoming: TaskWithRelations[] = [];
    const noDate: TaskWithRelations[] = [];

    taskList.forEach((task) => {
      if (!task.due_date) {
        noDate.push(task);
        return;
      }

      const taskDate = new Date(task.due_date);
      taskDate.setHours(0, 0, 0, 0);

      if (taskDate < today) {
        overdue.push(task);
      } else if (taskDate.getTime() === today.getTime()) {
        todayList.push(task);
      } else {
        upcoming.push(task);
      }
    });

    return { overdue, today: todayList, upcoming, noDate };
  };

  const groupByProject = (taskList: TaskWithRelations[]) => {
    const grouped: Record<string, TaskWithRelations[]> = {};
    const noProject: TaskWithRelations[] = [];

    taskList.forEach((task) => {
      const project = task.projects?.[0];
      if (project) {
        if (!grouped[project.id]) {
          grouped[project.id] = [];
        }
        grouped[project.id].push(task);
      } else {
        noProject.push(task);
      }
    });

    return { grouped, noProject };
  };

  // Get unique label IDs from tasks
  const activeLabelIds = new Set(
    tasks.flatMap((task) => task.labels?.map((l) => l.id) || [])
  );

  // Convert labels to filter options (only labels used in tasks)
  const labelOptions = labels
    .filter((label) => activeLabelIds.has(label.id))
    .map((label) => ({
      value: label.id,
      label: label.name,
      color: label.color,
    }));

  // Render task item helper
  const renderTaskItem = (task: TaskWithRelations, showProjectBadge = true) => (
    <SortableTaskItem
      key={task.id}
      task={task}
      onUpdate={handleTaskUpdate}
      onClick={handleTaskClick}
      onDelete={handleTaskDelete}
      showProject={showProjectBadge}
      hideDragHandle
      isSelected={selectedTask?.id === task.id}
    />
  );

  // Render grouped tasks based on groupBy
  const renderGroupedTasks = () => {
    if (filteredTasks.length === 0) {
      return (
        <EmptyState
          icon={User}
          title={hasActiveFilters ? "Keine Aufgaben mit diesen Filtern" : "Keine Aufgaben zugewiesen"}
          description={hasActiveFilters ? "Passe die Filter an" : "Dir wurden noch keine Aufgaben zugewiesen"}
        />
      );
    }

    if (groupBy === "priority") {
      const grouped = groupByPriority(filteredTasks);
      return (
        <>
          {grouped.p1.length > 0 && (
            <section className="mb-6">
              <SectionHeader title="Priorität 1 - Dringend" count={grouped.p1.length} variant="error" />
              <div className="flex flex-col gap-2">{grouped.p1.map((t) => renderTaskItem(t))}</div>
            </section>
          )}
          {grouped.p2.length > 0 && (
            <section className="mb-6">
              <SectionHeader title="Priorität 2 - Hoch" count={grouped.p2.length} variant="warning" />
              <div className="flex flex-col gap-2">{grouped.p2.map((t) => renderTaskItem(t))}</div>
            </section>
          )}
          {grouped.p3.length > 0 && (
            <section className="mb-6">
              <SectionHeader title="Priorität 3 - Normal" count={grouped.p3.length} variant="info" />
              <div className="flex flex-col gap-2">{grouped.p3.map((t) => renderTaskItem(t))}</div>
            </section>
          )}
          {grouped.p4.length > 0 && (
            <section className="mb-6">
              <SectionHeader title="Priorität 4 - Niedrig" count={grouped.p4.length} variant="muted" />
              <div className="flex flex-col gap-2">{grouped.p4.map((t) => renderTaskItem(t))}</div>
            </section>
          )}
        </>
      );
    }

    if (groupBy === "date") {
      const grouped = groupByDate(filteredTasks);
      return (
        <>
          {grouped.overdue.length > 0 && (
            <section className="mb-6">
              <SectionHeader title="Überfällig" count={grouped.overdue.length} variant="error" />
              <div className="flex flex-col gap-2">{grouped.overdue.map((t) => renderTaskItem(t))}</div>
            </section>
          )}
          {grouped.today.length > 0 && (
            <section className="mb-6">
              <SectionHeader title="Heute" count={grouped.today.length} variant="default" />
              <div className="flex flex-col gap-2">{grouped.today.map((t) => renderTaskItem(t))}</div>
            </section>
          )}
          {grouped.upcoming.length > 0 && (
            <section className="mb-6">
              <SectionHeader title="Demnächst" count={grouped.upcoming.length} variant="info" />
              <div className="flex flex-col gap-2">{grouped.upcoming.map((t) => renderTaskItem(t))}</div>
            </section>
          )}
          {grouped.noDate.length > 0 && (
            <section className="mb-6">
              <SectionHeader title="Ohne Datum" count={grouped.noDate.length} variant="muted" />
              <div className="flex flex-col gap-2">{grouped.noDate.map((t) => renderTaskItem(t))}</div>
            </section>
          )}
        </>
      );
    }

    if (groupBy === "project") {
      const grouped = groupByProject(filteredTasks);
      // Sort project IDs alphabetically by project name
      const projectIds = Object.keys(grouped.grouped).sort((a, b) => {
        const projectA = projects.find((p) => p.id === a);
        const projectB = projects.find((p) => p.id === b);
        return (projectA?.name || "").localeCompare(projectB?.name || "", "de");
      });

      return (
        <>
          {projectIds.map((projectId) => {
            const project = projects.find((p) => p.id === projectId);
            const projectTasks = grouped.grouped[projectId];
            if (!project || projectTasks.length === 0) return null;

            return (
              <section key={projectId} className="mb-6">
                <SectionHeader
                  title={project.name}
                  count={projectTasks.length}
                  dotColor={project.color}
                  dotShape="square"
                />
                <div className="flex flex-col gap-2">
                  {projectTasks.map((t) => renderTaskItem(t, false))}
                </div>
              </section>
            );
          })}
          {grouped.noProject.length > 0 && (
            <section className="mb-6">
              <SectionHeader title="Inbox (Kein Projekt)" count={grouped.noProject.length} variant="muted" />
              <div className="flex flex-col gap-2">{grouped.noProject.map((t) => renderTaskItem(t, false))}</div>
            </section>
          )}
        </>
      );
    }

    return null;
  };

  return (
    <AppLayout>
      <Header title="Meine Aufgaben" subtitle="Mir zugewiesene Aufgaben" />

      {!loading && (
        <FilterBar
          onReset={handleResetFilters}
          showReset={hasActiveFilters || showCompleted}
        >
          {/* Grouping Segmented Control */}
          <div className="flex items-center gap-1 px-1 py-1 bg-divider rounded-lg">
            {groupByOptions.map((option) => {
              const Icon = option.icon;
              const isActive = groupBy === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setGroupBy(option.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-body-md font-medium transition-all",
                    isActive
                      ? "bg-surface text-primary shadow-sm"
                      : "text-text-muted hover:text-text-primary"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="w-px h-6 bg-border" />

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
              {renderGroupedTasks()}

              {/* Completed Tasks */}
              {showCompleted && filteredCompleted.length > 0 && (
                <section className="mb-6">
                  <SectionHeader
                    title="Erledigt"
                    count={filteredCompleted.length}
                    icon={Check}
                    variant="muted"
                  />
                  <div className="flex flex-col gap-2">
                    {filteredCompleted.map((task) => renderTaskItem(task))}
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
