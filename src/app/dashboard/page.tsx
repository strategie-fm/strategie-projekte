"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { DonutChart, DonutLegend } from "@/components/charts/DonutChart";
import { getProjects, getTasks } from "@/lib/database";
import type { Project, TaskWithRelations } from "@/types/database";
import { LayoutDashboard, TrendingUp, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

interface ProjectWithStats extends Project {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [allTasks, setAllTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);

    const [projectsData, tasksData] = await Promise.all([
      getProjects(),
      getTasks(),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate stats per project
    const projectsWithStats: ProjectWithStats[] = projectsData.map((project) => {
      const projectTasks = tasksData.filter((t) =>
        t.projects?.some((p) => p.id === project.id)
      );

      const overdue = projectTasks.filter((t) => {
        if (t.status === "done" || !t.due_date) return false;
        const dueDate = new Date(t.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
      });

      return {
        ...project,
        totalTasks: projectTasks.length,
        completedTasks: projectTasks.filter((t) => t.status === "done").length,
        inProgressTasks: projectTasks.filter((t) => t.status === "in_progress").length,
        overdueTasks: overdue.length,
      };
    });

    setProjects(projectsWithStats);
    setAllTasks(tasksData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Global stats
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.status === "done").length;
  const inProgressTasks = allTasks.filter((t) => t.status === "in_progress").length;
  const openTasks = allTasks.filter((t) => t.status === "todo").length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueTasks = allTasks.filter((t) => {
    if (t.status === "done" || !t.due_date) return false;
    const dueDate = new Date(t.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  }).length;

  const completedToday = allTasks.filter((t) => {
    if (t.status !== "done" || !t.completed_at) return false;
    const completedDate = new Date(t.completed_at);
    completedDate.setHours(0, 0, 0, 0);
    return completedDate.getTime() === today.getTime();
  }).length;

  // Priority counts
  const p1Tasks = allTasks.filter((t) => t.priority === "p1" && t.status !== "done").length;
  const p2Tasks = allTasks.filter((t) => t.priority === "p2" && t.status !== "done").length;
  const p3Tasks = allTasks.filter((t) => t.priority === "p3" && t.status !== "done").length;
  const p4Tasks = allTasks.filter((t) => t.priority === "p4" && t.status !== "done").length;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="ml-sidebar-width">
        <Header title="Dashboard" subtitle="Übersicht aller Aufgaben" />

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-surface rounded-xl border border-border p-4">
                    <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary-surface rounded-lg">
                        <LayoutDashboard className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm text-text-muted">Gesamt</span>
                    </div>
                    <p className="text-2xl font-bold text-text-primary">{totalTasks}</p>
                </div>

                <div className="bg-surface rounded-xl border border-border p-4">
                    <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary-surface rounded-lg">
                        <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm text-text-muted">In Arbeit</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">{inProgressTasks}</p>
                </div>

                <div className="bg-surface rounded-xl border border-border p-4">
                    <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-error-light rounded-lg">
                        <AlertCircle className="w-5 h-5 text-error" />
                    </div>
                    <span className="text-sm text-text-muted">Überfällig</span>
                    </div>
                    <p className="text-2xl font-bold text-error">{overdueTasks}</p>
                </div>

                <div className="bg-surface rounded-xl border border-border p-4">
                    <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-success-light rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                    </div>
                    <span className="text-sm text-text-muted">Erledigt</span>
                    </div>
                    <p className="text-2xl font-bold text-success">{completedTasks}</p>
                    <p className="text-xs text-text-muted mt-1">+{completedToday} heute</p>
                </div>
                </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Status Chart */}
                <div className="bg-surface rounded-xl border border-border p-6">
                  <h3 className="text-sm font-semibold text-text-secondary mb-4">Status Übersicht</h3>
                  <div className="flex items-center justify-center gap-8">
                    <DonutChart
                      size={140}
                      strokeWidth={16}
                      segments={[
                        { value: openTasks, color: "#e0e0e0", label: "Offen" },
                        { value: inProgressTasks, color: "#183c6c", label: "In Arbeit" },
                        { value: completedTasks, color: "#059669", label: "Erledigt" },
                      ]}
                    />
                    <DonutLegend
                      segments={[
                        { value: openTasks, color: "#e0e0e0", label: "Offen" },
                        { value: inProgressTasks, color: "#183c6c", label: "In Arbeit" },
                        { value: completedTasks, color: "#059669", label: "Erledigt" },
                      ]}
                    />
                  </div>
                </div>

                {/* Priority Chart */}
                <div className="bg-surface rounded-xl border border-border p-6">
                  <h3 className="text-sm font-semibold text-text-secondary mb-4">Offene nach Priorität</h3>
                  <div className="flex items-center justify-center gap-8">
                    <DonutChart
                      size={140}
                      strokeWidth={16}
                      segments={[
                        { value: p1Tasks, color: "#dc2626", label: "P1" },
                        { value: p2Tasks, color: "#f59e0b", label: "P2" },
                        { value: p3Tasks, color: "#3b82f6", label: "P3" },
                        { value: p4Tasks, color: "#e0e0e0", label: "P4" },
                      ]}
                    />
                    <DonutLegend
                      segments={[
                        { value: p1Tasks, color: "#dc2626", label: "P1" },
                        { value: p2Tasks, color: "#f59e0b", label: "P2" },
                        { value: p3Tasks, color: "#3b82f6", label: "P3" },
                        { value: p4Tasks, color: "#e0e0e0", label: "P4" },
                      ]}
                    />
                  </div>
                </div>
              </div>

              {/* Projects Overview */}
              <div className="bg-surface rounded-xl border border-border p-6">
                <h3 className="text-sm font-semibold text-text-secondary mb-4">Aufgabenlisten</h3>
                
                {projects.length > 0 ? (
                  <div className="space-y-3">
                    {projects.map((project) => {
                      const percentage = project.totalTasks > 0
                        ? Math.round((project.completedTasks / project.totalTasks) * 100)
                        : 0;

                      return (
                        <Link
                          key={project.id}
                          href={`/projects/${project.id}`}
                          className="block p-4 rounded-lg border border-border hover:border-primary hover:bg-primary-surface/30 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: project.color }}
                              />
                              <span className="font-medium text-text-primary">
                                {project.name}
                              </span>
                              {project.overdueTasks > 0 && (
                                <span className="px-2 py-0.5 text-xs bg-error-light text-error rounded-full">
                                  {project.overdueTasks} überfällig
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-text-muted">
                              {project.completedTasks}/{project.totalTasks} ({percentage}%)
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-divider rounded-full overflow-hidden">
                              <div
                                className="h-full bg-success rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>

                          {/* Mini stats */}
                          <div className="flex gap-4 mt-2 text-xs text-text-muted">
                            <span>{project.totalTasks - project.completedTasks - project.inProgressTasks} offen</span>
                            <span>{project.inProgressTasks} in Arbeit</span>
                            <span>{project.completedTasks} erledigt</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-text-muted">
                    <p>Noch keine Aufgabenlisten vorhanden</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}