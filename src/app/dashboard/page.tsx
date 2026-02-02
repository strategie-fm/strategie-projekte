"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { DonutChart, DonutLegend } from "@/components/charts/DonutChart";
import { getProjects, getTasks, getProfiles, getTaskAssignees } from "@/lib/database";
import type { Project, TaskWithRelations, Profile } from "@/types/database";
import { LayoutDashboard, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

interface ProjectWithStats extends Project {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
}

function WeeklyOverview({ tasks }: { tasks: TaskWithRelations[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get start of week (Monday)
  const startOfWeek = new Date(today);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    days.push(date);
  }

  const dayNames = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-2">
        {days.map((date, index) => {
          const dateStr = date.toISOString().split("T")[0];
          const isToday = date.getTime() === today.getTime();
          const isPast = date < today;

          const completedOnDay = tasks.filter((t) => {
            if (t.status !== "done" || !t.completed_at) return false;
            const completedDate = new Date(t.completed_at);
            return completedDate.toISOString().split("T")[0] === dateStr;
          }).length;

          const dueOnDay = tasks.filter((t) => {
            if (!t.due_date) return false;
            return t.due_date.split("T")[0] === dateStr;
          }).length;

          return (
            <div
              key={index}
              className={`flex flex-col items-center p-2 rounded-lg ${
                isToday ? "bg-primary-surface border border-primary" : "bg-divider/50"
              }`}
            >
              <span className={`text-xs font-medium ${isToday ? "text-primary" : "text-text-muted"}`}>
                {dayNames[index]}
              </span>
              <span className={`text-lg font-semibold ${isToday ? "text-primary" : "text-text-primary"}`}>
                {date.getDate()}
              </span>
              <div className="flex gap-1 mt-1">
                {completedOnDay > 0 && (
                  <span className="text-xs px-1.5 py-0.5 bg-success text-white rounded-full">
                    {completedOnDay}
                  </span>
                )}
                {dueOnDay > 0 && !isPast && (
                  <span className="text-xs px-1.5 py-0.5 bg-primary text-white rounded-full">
                    {dueOnDay}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-6 text-xs text-text-muted">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-success rounded-full" />
          <span>Erledigt</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-primary rounded-full" />
          <span>Fällig</span>
        </div>
      </div>

      {/* Weekly Stats */}
      <div className="pt-4 border-t border-divider">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-success">
              {tasks.filter((t) => {
                if (t.status !== "done" || !t.completed_at) return false;
                const completedDate = new Date(t.completed_at);
                return completedDate >= startOfWeek && completedDate <= today;
              }).length}
            </p>
            <p className="text-xs text-text-muted">Diese Woche erledigt</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">
              {tasks.filter((t) => {
                if (t.status === "done" || !t.due_date) return false;
                const dueDate = new Date(t.due_date);
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                return dueDate >= today && dueDate <= endOfWeek;
              }).length}
            </p>
            <p className="text-xs text-text-muted">Noch fällig diese Woche</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [allTasks, setAllTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamStats, setTeamStats] = useState<{
    profile: Profile;
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
  }[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const [projectsData, tasksData, profilesData] = await Promise.all([
        getProjects(),
        getTasks(),
        getProfiles(),
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

      // Calculate team stats
      const taskAssigneeMap: Record<string, string[]> = {};
      await Promise.all(
        tasksData.map(async (task) => {
          const assignees = await getTaskAssignees(task.id);
          taskAssigneeMap[task.id] = assignees.map((a) => a.user_id);
        })
      );

      const teamStatsData = profilesData.map((profile) => {
        const userTasks = tasksData.filter((task) =>
          taskAssigneeMap[task.id]?.includes(profile.id)
        );

        const overdue = userTasks.filter((t) => {
          if (t.status === "done" || !t.due_date) return false;
          const dueDate = new Date(t.due_date);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate < today;
        }).length;

        return {
          profile,
          total: userTasks.length,
          completed: userTasks.filter((t) => t.status === "done").length,
          inProgress: userTasks.filter((t) => t.status === "in_progress").length,
          overdue,
        };
      });

      setTeamStats(teamStatsData.filter((s) => s.total > 0));
      setLoading(false);
    };

    loadData();
  }, []);

  // Global stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.status === "done").length;
  const inProgressTasks = allTasks.filter((t) => t.status === "in_progress").length;
  const openTasks = allTasks.filter((t) => t.status === "todo").length;

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

              {/* Activity & Weekly Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Recent Activity */}
                <div className="bg-surface rounded-xl border border-border p-6">
                  <h3 className="text-sm font-semibold text-text-secondary mb-4">Kürzlich erledigt</h3>
                  {allTasks
                    .filter((t) => t.status === "done" && t.completed_at)
                    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
                    .slice(0, 5).length > 0 ? (
                    <div className="space-y-3">
                      {allTasks
                        .filter((t) => t.status === "done" && t.completed_at)
                        .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
                        .slice(0, 5)
                        .map((task) => {
                          const completedDate = new Date(task.completed_at!);
                          const isToday = completedDate.toDateString() === today.toDateString();
                          const yesterday = new Date(today);
                          yesterday.setDate(yesterday.getDate() - 1);
                          const isYesterday = completedDate.toDateString() === yesterday.toDateString();

                          let dateLabel: string;
                          if (isToday) {
                            dateLabel = `Heute, ${completedDate.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`;
                          } else if (isYesterday) {
                            dateLabel = `Gestern, ${completedDate.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`;
                          } else {
                            dateLabel = completedDate.toLocaleDateString("de-DE", { day: "numeric", month: "short" });
                          }

                          return (
                            <div key={task.id} className="flex items-center gap-3 py-2 border-b border-divider last:border-0">
                              <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-text-primary truncate">{task.title}</p>
                                <p className="text-xs text-text-muted">{dateLabel}</p>
                              </div>
                              {task.projects?.[0] && (
                                <span
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: task.projects[0].color }}
                                  title={task.projects[0].name}
                                />
                              )}
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <p className="text-sm text-text-muted text-center py-4">Noch keine erledigten Aufgaben</p>
                  )}
                </div>

                {/* Weekly Overview */}
                <div className="bg-surface rounded-xl border border-border p-6">
                  <h3 className="text-sm font-semibold text-text-secondary mb-4">Diese Woche</h3>
                  <WeeklyOverview tasks={allTasks} />
                </div>
              </div>

              {/* Team Overview */}
              {teamStats.length > 0 && (
                <div className="bg-surface rounded-xl border border-border p-6 mb-6">
                  <h3 className="text-sm font-semibold text-text-secondary mb-4">Team Übersicht</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teamStats.map((stat) => {
                      const displayName = stat.profile.full_name || stat.profile.email.split("@")[0];
                      const initials = (stat.profile.full_name || stat.profile.email)
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2);
                      const openTasks = stat.total - stat.completed;

                      return (
                        <div
                          key={stat.profile.id}
                          className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-primary-surface/30 transition-colors"
                        >
                          {stat.profile.avatar_url ? (
                            <img
                              src={stat.profile.avatar_url}
                              alt={displayName}
                              className="w-12 h-12 rounded-full"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-primary text-white text-lg font-medium flex items-center justify-center">
                              {initials}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-text-primary truncate">
                              {displayName}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
                              <span>{openTasks} offen</span>
                              <span>{stat.inProgress} in Arbeit</span>
                              {stat.overdue > 0 && (
                                <span className="text-error">{stat.overdue} überfällig</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">{stat.total}</p>
                            <p className="text-xs text-text-muted">{stat.completed} erledigt</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
