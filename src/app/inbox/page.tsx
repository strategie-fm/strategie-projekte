"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SortableTaskList } from "@/components/tasks/SortableTaskList";
import { SortableTaskItem } from "@/components/tasks/SortableTaskItem";
import { QuickAddTask } from "@/components/tasks/QuickAddTask";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { getInboxTasks, getLabels } from "@/lib/database";
import type { TaskWithRelations, Label } from "@/types/database";
import { Inbox as InboxIcon, Check } from "lucide-react";
import { TaskFilters, TaskFilterState, filterTasks } from "@/components/filters/TaskFilters";
import { cn } from "@/lib/utils";

export default function InboxPage() {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
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
    const [data, labelsData] = await Promise.all([
      getInboxTasks(),
      getLabels(),
    ]);
    
    const active = data.filter((t) => t.status !== "done");
    const completed = data.filter((t) => t.status === "done");
    
    setTasks(active);
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
      setTasks((prev) => prev.filter((t) => t.id !== updatedTask.id));
      setCompletedTasks((prev) => [updatedTask, ...prev.filter((t) => t.id !== updatedTask.id)]);
    } else {
      // Remove from completed if was there
      setCompletedTasks((prev) => prev.filter((t) => t.id !== updatedTask.id));
      // Update in active list or add back
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

  const handleTaskCreated = () => {
    loadTasks();
  };

  const filteredTasks = filterTasks(tasks, filters);
  const filteredCompleted = filterTasks(completedTasks, filters);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="ml-sidebar-width">
        <Header title="Inbox" subtitle="Aufgaben ohne Aufgabenliste" />

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

              {/* Active Tasks */}
              <section className="mb-6">
                {filteredTasks.length > 0 ? (
                  <SortableTaskList
                    tasks={filteredTasks}
                    onTasksReorder={setTasks}
                    onTaskUpdate={handleTaskUpdate}
                    onTaskClick={setSelectedTask}
                    showProject={false}
                  />
                ) : (
                  <div className="bg-surface rounded-xl shadow-sm border border-border p-12 text-center">
                    <InboxIcon className="w-12 h-12 text-text-muted mx-auto mb-4" />
                    <p className="text-text-muted mb-2">
                      {filters.priorities.length > 0 || filters.labels.length > 0
                        ? "Keine Aufgaben mit diesen Filtern"
                        : "Deine Inbox ist leer"}
                    </p>
                    <p className="text-sm text-text-muted">
                      {filters.priorities.length > 0 || filters.labels.length > 0
                        ? "Passe die Filter an"
                        : "Aufgaben ohne Aufgabenliste landen hier"}
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
                        showProject={false}
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