"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SortableTaskList } from "@/components/tasks/SortableTaskList";
import { SortableTaskItem } from "@/components/tasks/SortableTaskItem";
import { QuickAddTask } from "@/components/tasks/QuickAddTask";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { ProjectSettingsModal } from "@/components/projects/ProjectSettingsModal";
import { getProject, getTasksByProject } from "@/lib/database";
import type { Project, TaskWithRelations } from "@/types/database";
import { FolderOpen, Settings, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const loadData = async () => {
    setLoading(true);

    const [projectData, tasksData] = await Promise.all([
      getProject(projectId),
      getTasksByProject(projectId),
    ]);

    setProject(projectData);
    setTasks(tasksData);
    setLoading(false);
  };

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  const handleTaskUpdate = (updatedTask: TaskWithRelations) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleTaskCreated = () => {
    loadData();
  };

  const handleProjectUpdate = (updatedProject: Project) => {
    setProject(updatedProject);
  };

  const handleProjectDelete = () => {
    router.push("/");
  };

  const activeTasks = tasks.filter((t) => t.status !== "done");
  const completedTasks = tasks.filter((t) => t.status === "done");

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
          {/* Project Header with Settings */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
              <span
                className="w-3 h-3 rounded"
                style={{ backgroundColor: project.color }}
              />
              Aufgaben ({activeTasks.length})
            </h2>
            <div className="flex items-center gap-2">
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
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-muted hover:text-text-primary hover:bg-divider rounded-lg transition-colors"
                title="Einstellungen"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          <section className="mb-6">
            {activeTasks.length > 0 ? (
              <>
                {/* Active Tasks */}
                <SortableTaskList
                  tasks={activeTasks}
                  onTasksReorder={(reordered) => {
                    setTasks([...reordered, ...completedTasks]);
                  }}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskClick={setSelectedTask}
                  showProject={false}
                />

                {/* Completed Tasks */}
                {showCompleted && completedTasks.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-xs font-medium text-text-muted mb-2 px-2">
                      Erledigt
                    </h3>
                    <div className="bg-surface rounded-xl shadow-sm border border-border opacity-60">
                      {completedTasks.map((task) => (
                        <SortableTaskItem
                          key={task.id}
                          task={task}
                          onUpdate={handleTaskUpdate}
                          onClick={setSelectedTask}
                          showProject={false}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Empty State or only completed */}
                {completedTasks.length > 0 ? (
                  <>
                    <div className="bg-surface rounded-xl shadow-sm border border-border p-8 text-center mb-4">
                      <p className="text-text-muted">
                        Alle Aufgaben erledigt! 🎉
                      </p>
                    </div>
                    {showCompleted && (
                      <div className="mt-4">
                        <h3 className="text-xs font-medium text-text-muted mb-2 px-2">
                          Erledigt
                        </h3>
                        <div className="bg-surface rounded-xl shadow-sm border border-border opacity-60">
                          {completedTasks.map((task) => (
                            <SortableTaskItem
                              key={task.id}
                              task={task}
                              onUpdate={handleTaskUpdate}
                              onClick={setSelectedTask}
                              showProject={false}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
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
              </>
            )}
          </section>

          <QuickAddTask projectId={projectId} onTaskCreated={handleTaskCreated} />
        </div>
      </main>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleTaskUpdate}
        onDelete={handleTaskDelete}
      />

      {/* Project Settings Modal */}
      <ProjectSettingsModal
        project={project}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onUpdate={handleProjectUpdate}
        onDelete={handleProjectDelete}
      />
    </div>
  );
}