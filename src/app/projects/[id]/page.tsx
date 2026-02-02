"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SortableTaskItem } from "@/components/tasks/SortableTaskItem";
import { QuickAddTask } from "@/components/tasks/QuickAddTask";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { ProjectSettingsModal } from "@/components/projects/ProjectSettingsModal";
import { SectionList } from "@/components/sections/SectionList";
import { getProject, getTasksByProject, getSections } from "@/lib/database";
import type { Project, TaskWithRelations, Section } from "@/types/database";
import { FolderOpen, Settings, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskFilters, TaskFilterState, filterTasks } from "@/components/filters/TaskFilters";
import { getLabels } from "@/lib/database";
import type { Label } from "@/types/database";
import { DonutChart, DonutLegend } from "@/components/charts/DonutChart";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [labels, setLabels] = useState<Label[]>([]);
  const [filters, setFilters] = useState<TaskFilterState>({
    priorities: [],
    labels: [],
    status: [],
  });

  const loadData = async () => {
  setLoading(true);

  const [projectData, tasksData, sectionsData, labelsData] = await Promise.all([
      getProject(projectId),
      getTasksByProject(projectId),
      getSections(projectId),
      getLabels(),
    ]);

    setProject(projectData);
    setTasks(tasksData);
    setSections(sectionsData);
    setLabels(labelsData);
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
    if (selectedTask?.id === updatedTask.id) {
      setSelectedTask(updatedTask);
    }
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setSelectedTask(null);
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

  // Apply filters
  const filteredTasks = filterTasks(tasks, filters);
  const activeTasks = filteredTasks.filter((t) => t.status !== "done");
  const completedTasks = filteredTasks.filter((t) => t.status === "done");

  // Count for header (unfiltered)
  const totalActiveTasks = tasks.filter((t) => t.status !== "done").length;

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
            <p className="text-text-muted">Aufgabenliste nicht gefunden</p>
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
          {/* Project Header with Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: project.color }}
                />
                Aufgaben ({activeTasks.length}
                {filters.priorities.length > 0 || filters.labels.length > 0 || filters.status.length > 0
                  ? ` von ${totalActiveTasks}`
                  : ""
                })
              </h2>
              <div className="flex items-center gap-2">
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
                <button
                  onClick={() => setShowSettings(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-muted hover:text-text-primary hover:bg-divider rounded-lg transition-colors"
                  title="Einstellungen"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Donut Charts */}
            {tasks.length > 0 && (
              <div className="bg-surface rounded-xl border border-border p-6 mt-4">
                <div className="flex items-start justify-around gap-8">
                  {/* Status Donut */}
                  <div className="flex flex-col items-center gap-4">
                    <DonutChart
                      size={120}
                      strokeWidth={14}
                      title="Status"
                      segments={[
                        { value: tasks.filter(t => t.status === "todo").length, color: "#e0e0e0", label: "Offen" },
                        { value: tasks.filter(t => t.status === "in_progress").length, color: "#183c6c", label: "In Arbeit" },
                        { value: tasks.filter(t => t.status === "done").length, color: "#059669", label: "Erledigt" },
                      ]}
                    />
                    <DonutLegend
                      segments={[
                        { value: tasks.filter(t => t.status === "todo").length, color: "#e0e0e0", label: "Offen" },
                        { value: tasks.filter(t => t.status === "in_progress").length, color: "#183c6c", label: "In Arbeit" },
                        { value: tasks.filter(t => t.status === "done").length, color: "#059669", label: "Erledigt" },
                      ]}
                    />
                  </div>

                  {/* Priority Donut */}
                  <div className="flex flex-col items-center gap-4">
                    <DonutChart
                      size={120}
                      strokeWidth={14}
                      title="Priorität"
                      segments={[
                        { value: tasks.filter(t => t.priority === "p1").length, color: "#dc2626", label: "P1" },
                        { value: tasks.filter(t => t.priority === "p2").length, color: "#f59e0b", label: "P2" },
                        { value: tasks.filter(t => t.priority === "p3").length, color: "#3b82f6", label: "P3" },
                        { value: tasks.filter(t => t.priority === "p4").length, color: "#e0e0e0", label: "P4" },
                      ]}
                    />
                    <DonutLegend
                      segments={[
                        { value: tasks.filter(t => t.priority === "p1").length, color: "#dc2626", label: "P1" },
                        { value: tasks.filter(t => t.priority === "p2").length, color: "#f59e0b", label: "P2" },
                        { value: tasks.filter(t => t.priority === "p3").length, color: "#3b82f6", label: "P3" },
                        { value: tasks.filter(t => t.priority === "p4").length, color: "#e0e0e0", label: "P4" },
                      ]}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tasks with Sections */}
          {activeTasks.length > 0 || sections.length > 0 ? (
            <section className="mb-6">
              <SectionList
                projectId={projectId}
                sections={sections}
                tasks={filteredTasks}
                onSectionsChange={setSections}
                onTaskUpdate={handleTaskUpdate}
                onTaskClick={setSelectedTask}
                onTasksReorder={(reorderedTasks) => {
                  // Merge reordered filtered tasks back with unfiltered tasks
                  const filteredIds = new Set(reorderedTasks.map(t => t.id));
                  const unchangedTasks = tasks.filter(t => !filteredIds.has(t.id));
                  setTasks([...unchangedTasks, ...reorderedTasks]);
                }}
              />

              {/* Completed Tasks */}
              {showCompleted && completedTasks.length > 0 && (
                <div className="mt-6">
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
            </section>
          ) : (
            <section className="mb-6">
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
                    Keine Aufgaben in dieser Aufgabenliste
                  </p>
                  <p className="text-sm text-text-muted">
                    Füge deine erste Aufgabe hinzu
                  </p>
                </div>
              )}
            </section>
          )}

          <QuickAddTask projectId={projectId} onTaskCreated={handleTaskCreated} />
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