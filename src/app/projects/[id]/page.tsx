"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SortableTaskList } from "@/components/tasks/SortableTaskList";
import { QuickAddTask } from "@/components/tasks/QuickAddTask";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { getProject, getTasksByProject } from "@/lib/database";
import type { Project, TaskWithRelations } from "@/types/database";
import { FolderOpen } from "lucide-react";

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);

  const loadData = async () => {
    setLoading(true);

    const [projectData, tasksData] = await Promise.all([
      getProject(projectId),
      getTasksByProject(projectId),
    ]);

    setProject(projectData);
    setTasks(tasksData.filter((t) => t.status !== "done"));
    setLoading(false);
  };

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

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
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="ml-sidebar-width">
          <div className="flex items-center justify-center h-screen">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="ml-sidebar-width">
          <div className="flex items-center justify-center h-screen">
            <p className="text-text-muted">Projekt nicht gefunden</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="ml-sidebar-width">
        <Header
          title={project.name}
          subtitle={project.description || undefined}
        />

        <div className="p-6">
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-sm"
                  style={{ backgroundColor: project.color }}
                />
                Aufgaben ({tasks.length})
              </h2>
            </div>

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
                <FolderOpen className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <p className="text-text-muted mb-2">
                  Keine Aufgaben in diesem Projekt
                </p>
                <p className="text-sm text-text-muted">
                  Füge deine erste Aufgabe hinzu
                </p>
              </div>
            )}
          </section>

          <QuickAddTask projectId={projectId} onTaskCreated={handleTaskCreated} />
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