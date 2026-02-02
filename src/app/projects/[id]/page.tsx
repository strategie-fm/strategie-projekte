"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { TaskItem } from "@/components/tasks/TaskItem";
import { QuickAddTask } from "@/components/tasks/QuickAddTask";
import { getProject, getTasksByProject } from "@/lib/database";
import type { Project, TaskWithRelations } from "@/types/database";

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    
    const [projectData, tasksData] = await Promise.all([
      getProject(projectId),
      getTasksByProject(projectId),
    ]);
    
    setProject(projectData);
    setTasks(tasksData.filter(t => t.status !== "done"));
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
          {/* Tasks */}
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
              <div className="bg-surface rounded-xl shadow-sm border border-border">
                {tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onUpdate={handleTaskUpdate}
                    showProject={false}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-surface rounded-xl shadow-sm border border-border p-8 text-center">
                <p className="text-text-muted">
                  Keine Aufgaben in diesem Projekt
                </p>
              </div>
            )}
          </section>

          {/* Quick Add */}
          <QuickAddTask 
            projectId={projectId} 
            onTaskCreated={handleTaskCreated} 
          />
        </div>
      </main>
    </div>
  );
}