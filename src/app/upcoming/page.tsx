"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SortableTaskItem } from "@/components/tasks/SortableTaskItem";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { QuickAddTask } from "@/components/tasks/QuickAddTask";
import { getTasks, getLabels } from "@/lib/database";
import type { TaskWithRelations, Label } from "@/types/database";
import { CalendarDays } from "lucide-react";
import { TaskFilters, TaskFilterState, filterTasks } from "@/components/filters/TaskFilters";

interface GroupedTasks {
  date: string;
  label: string;
  tasks: TaskWithRelations[];
}

export default function UpcomingPage() {
  const [groupedTasks, setGroupedTasks] = useState<GroupedTasks[]>([]);
  const [allTasks, setAllTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [labels, setLabels] = useState<Label[]>([]);
  const [filters, setFilters] = useState<TaskFilterState>({
    priorities: [],
    labels: [],
    status: [],
  });

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

    return Object.entries(groups).map(([date, tasks]) => {
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

    const upcomingTasks = tasksData.filter((task) => {
      if (task.status === "done" || !task.due_date) return false;
      const taskDate = new Date(task.due_date);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate >= today;
    });

    upcomingTasks.sort((a, b) => {
      return new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime();
    });

    setAllTasks(upcomingTasks);
    setGroupedTasks(groupTasksByDate(upcomingTasks));
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
      setAllTasks((prev) => prev.filter((t) => t.id !== updatedTask.id));
    } else {
      setAllTasks((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
      );
    }
    if (selectedTask?.id === updatedTask.id) {
      setSelectedTask(updatedTask);
    }
  };

  const handleTaskDelete = (taskId: string) => {
    setAllTasks((prev) => prev.filter((t) => t.id !== taskId));
    setSelectedTask(null);
  };

  const handleTaskCreated = () => {
    loadTasks();
  };

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
              <div className="flex justify-end mb-4">
                <TaskFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  availableLabels={labels}
                />
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

                  <QuickAddTask onTaskCreated={handleTaskCreated} />
                </>
              ) : (
                <>
                  <div className="bg-surface rounded-xl shadow-sm border border-border p-12 text-center">
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

                  <div className="mt-6">
                    <QuickAddTask onTaskCreated={handleTaskCreated} />
                  </div>
                </>
              )}
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