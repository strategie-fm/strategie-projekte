"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SortableTaskList } from "@/components/tasks/SortableTaskList";
import { QuickAddTask } from "@/components/tasks/QuickAddTask";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { getInboxTasks } from "@/lib/database";
import type { TaskWithRelations } from "@/types/database";
import { Inbox as InboxIcon } from "lucide-react";

export default function InboxPage() {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);

  const loadTasks = async () => {
    setLoading(true);
    const data = await getInboxTasks();
    setTasks(data.filter((t) => t.status !== "done"));
    setLoading(false);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleTaskUpdate = (updatedTask: TaskWithRelations) => {
    if (updatedTask.status === "done") {
      setTasks((prev) => prev.filter((t) => t.id !== updatedTask.id));
    } else {
      setTasks((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
      );
    }
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleTaskCreated = () => {
    loadTasks();
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="ml-sidebar-width">
        <Header title="Inbox" subtitle="Aufgaben ohne Projekt" />

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <section className="mb-6">
                {tasks.length > 0 ? (
                  <SortableTaskList
                    tasks={tasks}
                    onTasksReorder={setTasks}
                    onTaskUpdate={handleTaskUpdate}
                    onTaskClick={setSelectedTask}
                    showProject={false}
                  />
                ) : (
                  <div className="bg-surface rounded-xl shadow-sm border border-border p-12 text-center">
                    <InboxIcon className="w-12 h-12 text-text-muted mx-auto mb-4" />
                    <p className="text-text-muted mb-2">Deine Inbox ist leer</p>
                    <p className="text-sm text-text-muted">
                      Aufgaben ohne Projekt landen hier
                    </p>
                  </div>
                )}
              </section>

              <QuickAddTask onTaskCreated={handleTaskCreated} />
            </>
          )}
        </div>
      </main>

      <TaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleTaskUpdate}
        onDelete={handleTaskDelete}
      />
    </div>
  );
}