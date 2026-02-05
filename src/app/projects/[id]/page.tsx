"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Header } from "@/components/layout/Header";
import { SortableTaskItem } from "@/components/tasks/SortableTaskItem";
import { QuickAddTask } from "@/components/tasks/QuickAddTask";
import { TaskDetailView } from "@/components/tasks/TaskDetailView";
import { ProjectSettingsModal } from "@/components/projects/ProjectSettingsModal";
import { SectionList } from "@/components/sections/SectionList";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterBar } from "@/components/ui/FilterBar";
import { FilterChips } from "@/components/ui/FilterChips";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import {
  getProject,
  getTasksByProject,
  getSections,
  getLabels,
  getProfiles,
  getTaskAssignees,
  getProjectTeamAccess,
} from "@/lib/database";
import type { Project, TaskWithRelations, Section, Label, Profile, ProjectTeamAccess } from "@/types/database";
import { Settings, Check, ClipboardList, Globe, Users } from "lucide-react";
import { filterTasks } from "@/components/filters/TaskFilters";

// Filter options
const priorityOptions = [
  { value: "p1", label: "P1", dotColor: "bg-error" },
  { value: "p2", label: "P2", dotColor: "bg-warning" },
  { value: "p3", label: "P3", dotColor: "bg-info" },
  { value: "p4", label: "P4", dotColor: "bg-text-muted" },
];

const statusOptions = [
  { value: "todo", label: "Offen" },
  { value: "in_progress", label: "In Arbeit" },
];

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  // Existing state
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [labels, setLabels] = useState<Label[]>([]);

  // New state for profiles and assignees
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [taskAssigneeMap, setTaskAssigneeMap] = useState<Record<string, string[]>>({});
  const [teamAccess, setTeamAccess] = useState<ProjectTeamAccess[]>([]);

  // Filter state (separate states instead of single object)
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    const [projectData, tasksData, sectionsData, labelsData, profilesData, teamAccessData] = await Promise.all([
      getProject(projectId),
      getTasksByProject(projectId),
      getSections(projectId),
      getLabels(),
      getProfiles(),
      getProjectTeamAccess(projectId),
    ]);

    // Build assignee map from batch-loaded data
    const assigneeMap: Record<string, string[]> = {};
    tasksData.forEach((task) => {
      assigneeMap[task.id] = (task.assignees || []).map((a) => a.user_id);
    });
    setTaskAssigneeMap(assigneeMap);

    setProject(projectData);
    setTasks(tasksData);
    setSections(sectionsData);
    setLabels(labelsData);
    setProfiles(profilesData);
    setTeamAccess(teamAccessData);
    if (!silent) setLoading(false);
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId, loadData]);

  // Event listeners for live updates
  useEffect(() => {
    const handleAssigneesChanged = async (event: Event) => {
      const taskId = (event as CustomEvent<string>).detail;
      const assignees = await getTaskAssignees(taskId);
      setTaskAssigneeMap((prev) => ({
        ...prev,
        [taskId]: assignees.map((a) => a.user_id),
      }));
    };
    window.addEventListener("assigneesChanged", handleAssigneesChanged);
    return () => window.removeEventListener("assigneesChanged", handleAssigneesChanged);
  }, []);

  useEffect(() => {
    const handleTaskLabelsChanged = () => loadData(true);
    window.addEventListener("taskLabelsChanged", handleTaskLabelsChanged);
    return () => window.removeEventListener("taskLabelsChanged", handleTaskLabelsChanged);
  }, [loadData]);

  useEffect(() => {
    const handleTaskDateChanged = () => loadData(true);
    window.addEventListener("taskDateChanged", handleTaskDateChanged);
    return () => window.removeEventListener("taskDateChanged", handleTaskDateChanged);
  }, [loadData]);

  useEffect(() => {
    const handleTaskProjectChanged = () => loadData(true);
    window.addEventListener("taskProjectChanged", handleTaskProjectChanged);
    return () => window.removeEventListener("taskProjectChanged", handleTaskProjectChanged);
  }, [loadData]);

  useEffect(() => {
    const handleTaskUpdated = () => loadData(true);
    window.addEventListener("taskUpdated", handleTaskUpdated);
    return () => window.removeEventListener("taskUpdated", handleTaskUpdated);
  }, [loadData]);

  // Toggle behavior for task click
  const handleTaskClick = (task: TaskWithRelations) => {
    if (selectedTask?.id === task.id) {
      setSelectedTask(null);
    } else {
      setSelectedTask(task);
    }
  };

  const handleCloseDetail = () => {
    setSelectedTask(null);
  };

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
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
    }
  };

  // Auto-select created task
  const handleTaskCreated = (task: TaskWithRelations) => {
    loadData(true);
    setSelectedTask(task);
  };

  const handleNewRecurringTask = (newTask: TaskWithRelations) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleProjectUpdate = (updatedProject: Project) => {
    setProject(updatedProject);
  };

  const handleProjectDelete = () => {
    router.push("/");
  };

  // Filter reset
  const handleResetFilters = () => {
    setSelectedPriorities([]);
    setSelectedLabels([]);
    setSelectedStatus([]);
    setSelectedAssignees([]);
    setShowCompleted(false);
  };

  // Apply filters
  const hasActiveFilters =
    selectedPriorities.length > 0 ||
    selectedLabels.length > 0 ||
    selectedStatus.length > 0 ||
    selectedAssignees.length > 0;

  const filteredTasks = filterTasks(tasks, {
    priorities: selectedPriorities,
    labels: selectedLabels,
    status: selectedStatus,
  }).filter((task) => {
    // Assignee filter
    if (selectedAssignees.length > 0) {
      const taskAssignees = taskAssigneeMap[task.id] || [];
      if (!selectedAssignees.some((a) => taskAssignees.includes(a))) {
        return false;
      }
    }
    return true;
  });

  const completedTasks = filteredTasks.filter((t) => t.status === "done");
  const openTasks = filteredTasks.filter((t) => t.status !== "done");

  // Label options for filter (use 'color' for hex colors, which renders as colored buttons)
  const labelOptions = labels.map((label) => ({
    value: label.id,
    label: label.name,
    color: label.color,
  }));

  // Assignee options for filter
  const assigneeOptions = profiles.map((profile) => ({
    value: profile.id,
    label: profile.full_name || profile.email,
  }));

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-text-muted">Aufgabenliste nicht gefunden</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Header
        title={project.name}
        subtitle={project.description || undefined}
        meta={
          <div className="flex items-center gap-2">
            {teamAccess.length > 0 ? (
              teamAccess.map((access) => (
                access.team && (
                  <span
                    key={access.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: `${access.team.color}20`,
                      color: access.team.color,
                    }}
                  >
                    <Users className="w-3 h-3" />
                    {access.team.name}
                  </span>
                )
              ))
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium bg-divider text-text-muted">
                <Globe className="w-3 h-3" />
                Öffentlich
              </span>
            )}
          </div>
        }
      >
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-muted hover:text-text-primary hover:bg-divider rounded-lg transition-colors"
          title="Einstellungen"
        >
          <Settings className="w-5 h-5" />
        </button>
      </Header>

      {/* Filter Bar */}
      {!loading && (
        <FilterBar onReset={handleResetFilters} showReset={hasActiveFilters || showCompleted}>
          <FilterChips
            label="Priorität"
            options={priorityOptions}
            selected={selectedPriorities}
            onChange={setSelectedPriorities}
          />
          <FilterChips
            label="Status"
            options={statusOptions}
            selected={selectedStatus}
            onChange={setSelectedStatus}
          />
          {assigneeOptions.length > 0 && (
            <FilterChips
              label="Zugewiesen"
              options={assigneeOptions}
              selected={selectedAssignees}
              onChange={setSelectedAssignees}
            />
          )}
          {labelOptions.length > 0 && (
            <FilterChips
              label="Labels"
              options={labelOptions}
              selected={selectedLabels}
              onChange={setSelectedLabels}
            />
          )}
          {completedTasks.length > 0 && (
            <ToggleSwitch
              label={`Erledigte anzeigen (${completedTasks.length})`}
              checked={showCompleted}
              onChange={setShowCompleted}
            />
          )}
        </FilterBar>
      )}

      <div className="pt-6 flex gap-6">
        {/* Left Column: Sections + Tasks */}
        <div className="flex-1 min-w-0">
          {/* EmptyState when no tasks and no sections */}
          {openTasks.length === 0 && sections.length === 0 && (
            <EmptyState
              icon={ClipboardList}
              title={hasActiveFilters ? "Keine Aufgaben mit diesen Filtern" : "Keine Aufgaben in dieser Aufgabenliste"}
              description={hasActiveFilters ? "Passe die Filter an" : "Erstelle deine erste Aufgabe oder einen Abschnitt"}
            />
          )}

          {/* Tasks with Sections - Always show to allow creating sections */}
          <section className="mb-6">
            <SectionList
              projectId={projectId}
              sections={sections}
              tasks={filteredTasks}
              onSectionsChange={setSections}
              onTaskUpdate={handleTaskUpdate}
              onTaskClick={handleTaskClick}
              onTaskDelete={handleTaskDelete}
              selectedTaskId={selectedTask?.id}
              onTasksReorder={(reorderedTasks) => {
                const filteredIds = new Set(reorderedTasks.map(t => t.id));
                const unchangedTasks = tasks.filter(t => !filteredIds.has(t.id));
                setTasks([...unchangedTasks, ...reorderedTasks]);
              }}
              onNewRecurringTask={handleNewRecurringTask}
            />

            {/* Completed Tasks */}
            {showCompleted && completedTasks.length > 0 && (
              <section className="mt-6">
                <SectionHeader
                  title="Erledigt"
                  count={completedTasks.length}
                  icon={Check}
                  variant="muted"
                />
                <div className="flex flex-col gap-2">
                  {completedTasks.map((task) => (
                    <SortableTaskItem
                      key={task.id}
                      task={task}
                      onUpdate={handleTaskUpdate}
                      onClick={handleTaskClick}
                      onDelete={handleTaskDelete}
                      onNewRecurringTask={handleNewRecurringTask}
                      showProject={false}
                      hideDragHandle
                      isSelected={selectedTask?.id === task.id}
                    />
                  ))}
                </div>
              </section>
            )}
          </section>

          <QuickAddTask projectId={projectId} sections={sections} onTaskCreated={handleTaskCreated} />
        </div>

        {/* Right Column: TaskDetailView (only when selected) */}
        {selectedTask && (
          <div className="w-[500px] shrink min-w-[320px] sticky top-6 self-start max-h-[calc(100vh-120px)]">
            <TaskDetailView
              task={selectedTask}
              onUpdate={handleTaskUpdate}
              onDelete={handleTaskDelete}
              onClose={handleCloseDetail}
              onNewRecurringTask={handleNewRecurringTask}
            />
          </div>
        )}
      </div>

      {/* Project Settings Modal */}
      <ProjectSettingsModal
        project={project}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onUpdate={handleProjectUpdate}
        onDelete={handleProjectDelete}
      />
    </AppLayout>
  );
}
