"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SortableTaskList } from "@/components/tasks/SortableTaskList";
import { SortableTaskItem } from "@/components/tasks/SortableTaskItem";
import { QuickAddTask } from "@/components/tasks/QuickAddTask";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { getTasks, getLabels } from "@/lib/database";
import type { TaskWithRelations, Label } from "@/types/database";
import { Calendar, Check } from "lucide-react";
import { TaskFilters, TaskFilterState, filterTasks } from "@/components/filters/TaskFilters";
import { cn } from "@/lib/utils";

export default function Home() {
  const [overdueTasks, setOverdueTasks] = useState<TaskWithRelations[]>([]);
  const [todayTasks, setTodayTasks] = useState<TaskWithRelations[]>([]);
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

  const loadTasks = async () => {
    setLoading(true);

    const [allTasks, labelsData] = await Promise.all([
      getTasks(),
      getLabels(),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const overdue: TaskWithRelations[] = [];
    const todayList: TaskWithRelations[] = [];
    const noDueDate: TaskWithRelations[] = [];
    const completed: TaskWithRelations[] = [];

    allTasks.forEach((task) => {
      if (task.status === "done") {
        completed.push(task);
        return;
      }

      if (!task.due_date) {
        noDueDate.push(task);
        return;
      }

      const taskDate = new Date(task.due_date);
      taskDate.setHours(0, 0, 0, 0);

      if (taskDate < today) {
        overdue.push(task);
      } else if (taskDate.getTime() === today.getTime()) {
        todayList.push(task);
      }
    });

    setOverdueTasks(overdue);
    setTodayTasks([...todayList, ...noDueDate]);
    setCompletedTasks(completed);
    setLabels(labelsData);
    setLoading(false);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleTaskUpdate = (updatedTask: TaskWithRelations) => {
    if (updatedTask.status === "done") {
      // Move to completed
      setOverdueTasks((prev) => prev.filter((t) => t.id !== updatedTask.id));
      setTodayTasks((prev) => prev.filter((t) => t.id !== updatedTask.id));
      setCompletedTasks((prev) => [updatedTask, ...prev.filter((t) => t.id !== updatedTask.id)]);
    } else {
      // Remove from completed if was there
      setCompletedTasks((prev) => prev.filter((t) => t.id !== updatedTask.id));
      // Update in active lists
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

  const todayDate = new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Apply filters
  const filteredOverdue = filterTasks(overdueTasks, filters);
  const filteredToday = filterTasks(todayTasks, filters);
  const filteredCompleted = filterTasks(completedTasks, filters);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="ml-sidebar-width">
        <Header title="Heute" subtitle={todayDate} />

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

              {/* Überfällig Section */}
              {filteredOverdue.length > 0 && (
                <section className="mb-6">
                  <h2 className="text-sm font-semibold text-error mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-error" />
                    Überfällig ({filteredOverdue.length})
                  </h2>
                  <SortableTaskList
                    tasks={filteredOverdue}
                    onTasksReorder={setOverdueTasks}
                    onTaskUpdate={handleTaskUpdate}
                    onTaskClick={setSelectedTask}
                  />
                </section>
              )}

              {/* Heute Section */}
              <section className="mb-6">
                <h2 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Heute ({filteredToday.length})
                </h2>
                {filteredToday.length > 0 ? (
                  <SortableTaskList
                    tasks={filteredToday}
                    onTasksReorder={setTodayTasks}
                    onTaskUpdate={handleTaskUpdate}
                    onTaskClick={setSelectedTask}
                  />
                ) : (
                  <div className="bg-surface rounded-xl shadow-sm border border-border p-12 text-center">
                    <Calendar className="w-12 h-12 text-text-muted mx-auto mb-4" />
                    <p className="text-text-muted mb-2">
                      {filters.priorities.length > 0 || filters.labels.length > 0
                        ? "Keine Aufgaben mit diesen Filtern"
                        : "Keine Aufgaben für heute"}
                    </p>
                    <p className="text-sm text-text-muted">
                      {filters.priorities.length > 0 || filters.labels.length > 0
                        ? "Passe die Filter an"
                        : "Genieße deinen Tag! 🎉"}
                    </p>
                  </div>
                )}
              </section>

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

              {/* Quick Add */}
              <QuickAddTask onTaskCreated={handleTaskCreated} />
            </>
          )}
        </div>
      </main>

      {/* Task Detail Panel */}
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
