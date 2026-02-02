"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SortableTaskItem } from "@/components/tasks/SortableTaskItem";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { QuickAddTask } from "@/components/tasks/QuickAddTask";
import { getTasks, getLabels } from "@/lib/database";
import type { TaskWithRelations, Label } from "@/types/database";
import { CalendarDays, Check } from "lucide-react";
import { TaskFilters, TaskFilterState, filterTasks } from "@/components/filters/TaskFilters";
import { cn } from "@/lib/utils";

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
  const [filters, setFilters] = useState<TaskFilterState>({
    priorities: [],
    labels: [],
    status: [],
  });
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
      .map(([date, tasks]) => {
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

        return { date, label, tasks };
      });
  };

  const loadTasks = async () => {
    setLoading(true);

    const [tasksData, labelsData] = await Promise.all([
      getTasks(),
      getLabels(),
    ]);

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
    setLoading(false);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // Re-group when filters change
  useEffect(() => {
    const filtered = filterTasks(allTasks, filters);
    setGroupedTasks(groupTasksByDate(filtered));
  }, [filters, allTasks]);

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

  const handleTaskCreated = () => {
    loadTasks();
  };

  const filteredCompleted = filterTasks(completedTasks, filters);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="ml-sidebar-width">
        <Header title="Anstehend" subtitle="Kommende Aufgaben" />

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Filters */}
              <div className="flex justify-end gap-2 mb-4">
                <TaskFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  availableLabels={labels}
                />
                {completedTasks.length > 0 && (
                  <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors",
                      showCompleted
                        ? "bg-primary-surface text-primary"
                        : "text-text-muted hover:text-text-primary hover:bg-divider"
                    )}
                  >
                    <Check className="w-4 h-4" />
                    Erledigte ({completedTasks.length})
                  </button>
                )}
              </div>

              {groupedTasks.length > 0 ? (
                <>
                  {groupedTasks.map((group) => (
                    <section key={group.date} className="mb-6">
                      <h2 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        {group.label} ({group.tasks.length})
                      </h2>
                      <div className="bg-surface rounded-xl shadow-sm border border-border">
                        {group.tasks.map((task) => (
                          <SortableTaskItem
                            key={task.id}
                            task={task}
                            onUpdate={handleTaskUpdate}
                            onClick={setSelectedTask}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </>
              ) : (
                <div className="bg-surface rounded-xl shadow-sm border border-border p-12 text-center mb-6">
                  <CalendarDays className="w-12 h-12 text-text-muted mx-auto mb-4" />
                  <p className="text-text-muted mb-2">
                    {filters.priorities.length > 0 || filters.labels.length > 0
                      ? "Keine Aufgaben mit diesen Filtern"
                      : "Keine anstehenden Aufgaben"}
                  </p>
                  <p className="text-sm text-text-muted">
                    {filters.priorities.length > 0 || filters.labels.length > 0
                      ? "Passe die Filter an"
                      : "Aufgaben mit Fälligkeitsdatum erscheinen hier"}
                  </p>
                </div>
              )}

              {/* Erledigte Section */}
              {showCompleted && filteredCompleted.length > 0 && (
                <section className="mb-6">
                  <h2 className="text-sm font-semibold text-text-muted mb-3 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Erledigt ({filteredCompleted.length})
                  </h2>
                  <div className="bg-surface rounded-xl shadow-sm border border-border opacity-60">
                    {filteredCompleted.map((task) => (
                      <SortableTaskItem
                        key={task.id}
                        task={task}
                        onUpdate={handleTaskUpdate}
                        onClick={setSelectedTask}
                      />
                    ))}
                  </div>
                </section>
              )}

              <QuickAddTask onTaskCreated={handleTaskCreated} />
            </>
          )}
        </div>
      </main>

      <TaskDetailPanel
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleTaskUpdate}
        onDelete={handleTaskDelete}
      />
    </div>
  );
}
