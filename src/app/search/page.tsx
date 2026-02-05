"use client";

import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Header } from "@/components/layout/Header";
import { SortableTaskItem } from "@/components/tasks/SortableTaskItem";
import { TaskDetailView } from "@/components/tasks/TaskDetailView";
import { getTasks, getLabels, getProfiles, getTaskAssignees } from "@/lib/database";
import type { TaskWithRelations, Label, Profile } from "@/types/database";
import { Search as SearchIcon, X, Filter } from "lucide-react";
import { filterTasks, TaskFilterState } from "@/components/filters/TaskFilters";
import { cn } from "@/lib/utils";

const priorities = [
  { value: "p1", label: "P1", color: "bg-error" },
  { value: "p2", label: "P2", color: "bg-warning" },
  { value: "p3", label: "P3", color: "bg-info" },
  { value: "p4", label: "P4", color: "bg-text-muted" },
];

const statuses = [
  { value: "todo", label: "Offen" },
  { value: "in_progress", label: "In Arbeit" },
  { value: "done", label: "Erledigt" },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [allTasks, setAllTasks] = useState<TaskWithRelations[]>([]);
  const [taskAssigneeMap, setTaskAssigneeMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [labels, setLabels] = useState<Label[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [filters, setFilters] = useState<TaskFilterState>({
    priorities: [],
    labels: [],
    status: ["todo", "in_progress"],
  });

  // Load all tasks, labels, and profiles
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const [tasksData, labelsData, profilesData] = await Promise.all([
      getTasks(),
      getLabels(),
      getProfiles(),
    ]);
    setAllTasks(tasksData);
    setLabels(labelsData);
    setProfiles(profilesData);

    // Build assignee map from batch-loaded data
    const assigneeMap: Record<string, string[]> = {};
    tasksData.forEach((task) => {
      assigneeMap[task.id] = (task.assignees || []).map((a) => a.user_id);
    });
    setTaskAssigneeMap(assigneeMap);

    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
    const handleTaskUpdated = () => loadData(true);
    window.addEventListener("taskUpdated", handleTaskUpdated);
    return () => window.removeEventListener("taskUpdated", handleTaskUpdated);
  }, [loadData]);

  const handleTaskUpdate = (updatedTask: TaskWithRelations) => {
    setAllTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
    if (selectedTask?.id === updatedTask.id) {
      setSelectedTask(updatedTask);
    }
  };

  const handleTaskDelete = (taskId: string) => {
    setAllTasks((prev) => prev.filter((t) => t.id !== taskId));
    setSelectedTask(null);
  };

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

  const togglePriority = (priority: string) => {
    setFilters((f) => ({
      ...f,
      priorities: f.priorities.includes(priority)
        ? f.priorities.filter((p) => p !== priority)
        : [...f.priorities, priority],
    }));
  };

  const toggleStatus = (status: string) => {
    setFilters((f) => ({
      ...f,
      status: f.status.includes(status)
        ? f.status.filter((s) => s !== status)
        : [...f.status, status],
    }));
  };

  const toggleLabel = (labelId: string) => {
    setFilters((f) => ({
      ...f,
      labels: f.labels.includes(labelId)
        ? f.labels.filter((l) => l !== labelId)
        : [...f.labels, labelId],
    }));
  };

  const toggleAssignee = (userId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const clearAll = () => {
    setQuery("");
    setFilters({ priorities: [], labels: [], status: [] });
    setSelectedAssignees([]);
  };

  // Filter by search query
  const searchFiltered = query.trim()
    ? allTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(query.toLowerCase()) ||
          task.description?.toLowerCase().includes(query.toLowerCase())
      )
    : allTasks;

  // Apply priority/status/label filters
  const filteredByFilters = filterTasks(searchFiltered, filters);

  // Apply assignee filter
  const filteredResults = selectedAssignees.length > 0
    ? filteredByFilters.filter((task) => {
        const taskAssignees = taskAssigneeMap[task.id] || [];
        
        // Check for "unassigned" filter
        if (selectedAssignees.includes("unassigned") && taskAssignees.length === 0) {
          return true;
        }
        
        // Check for specific assignees
        const specificAssignees = selectedAssignees.filter((id) => id !== "unassigned");
        if (specificAssignees.length > 0 && specificAssignees.some((userId) => taskAssignees.includes(userId))) {
          return true;
        }
        
        return false;
      })
    : filteredByFilters;

  const activeFilterCount =
    filters.priorities.length + filters.labels.length + filters.status.length + selectedAssignees.length;
  const hasActiveSearch = query.trim().length > 0 || activeFilterCount > 0;

  return (
    <AppLayout>
      <Header title="Suche" subtitle="Aufgaben durchsuchen und filtern" />

      <div className="pt-6 flex gap-6">
        {/* Left Column: Search and Results */}
        <div className="flex-1 min-w-0">
          {/* Search and Filter Card */}
          <div className="bg-surface rounded-xl border border-border p-4 mb-6">
            {/* Search Input */}
            <div className="relative mb-4">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Aufgaben suchen..."
                className="w-full pl-12 pr-12 py-3 bg-background border border-border rounded-lg text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary rounded-full hover:bg-divider transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Sections */}
            <div className="space-y-4">
              {/* Priority, Status & Person Row */}
              <div className="flex flex-wrap gap-6">
                {/* Priority Filter */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-text-muted">Priorität</span>
                  <div className="flex gap-2">
                    {priorities.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => togglePriority(p.value)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                          filters.priorities.includes(p.value)
                            ? "bg-primary text-white"
                            : "bg-background border border-border text-text-secondary hover:border-primary"
                        )}
                      >
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full",
                            filters.priorities.includes(p.value) ? "bg-white" : p.color
                          )}
                        />
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-text-muted">Status</span>
                  <div className="flex gap-2">
                    {statuses.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => toggleStatus(s.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                          filters.status.includes(s.value)
                            ? "bg-primary text-white"
                            : "bg-background border border-border text-text-secondary hover:border-primary"
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assignee Filter */}
                {profiles.length > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-text-muted">Person</span>
                    <div className="flex flex-wrap gap-2">
                      {/* Unassigned Option */}
                      <button
                        onClick={() => toggleAssignee("unassigned")}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                          selectedAssignees.includes("unassigned")
                            ? "bg-primary text-white"
                            : "bg-background border border-border text-text-secondary hover:border-primary"
                        )}
                      >
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full text-[10px] font-medium flex items-center justify-center border-2 border-dashed",
                            selectedAssignees.includes("unassigned")
                              ? "border-white/50 text-white"
                              : "border-text-muted text-text-muted"
                          )}
                        >
                          ?
                        </div>
                        Nicht zugewiesen
                      </button>

                      {profiles.map((profile) => {
                        const isSelected = selectedAssignees.includes(profile.id);
                        const displayName = profile.full_name || profile.email.split("@")[0];
                        const initials = (profile.full_name || profile.email)
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2);

                        return (
                          <button
                            key={profile.id}
                            onClick={() => toggleAssignee(profile.id)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                              isSelected
                                ? "bg-primary text-white"
                                : "bg-background border border-border text-text-secondary hover:border-primary"
                            )}
                          >
                            {profile.avatar_url ? (
                              <img
                                src={profile.avatar_url}
                                alt={displayName}
                                className="w-5 h-5 rounded-full"
                              />
                            ) : (
                              <div
                                className={cn(
                                  "w-5 h-5 rounded-full text-[10px] font-medium flex items-center justify-center",
                                  isSelected ? "bg-white/20 text-white" : "bg-primary text-white"
                                )}
                              >
                                {initials}
                              </div>
                            )}
                            {displayName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Labels Filter */}
              {labels.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-text-muted">Labels</span>
                  <div className="flex flex-wrap gap-2">
                    {labels.map((label) => (
                      <button
                        key={label.id}
                        onClick={() => toggleLabel(label.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                          filters.labels.includes(label.id)
                            ? "ring-2 ring-offset-1 ring-primary"
                            : ""
                        )}
                        style={{
                          backgroundColor: filters.labels.includes(label.id)
                            ? label.color
                            : `${label.color}25`,
                          color: filters.labels.includes(label.id) ? "white" : label.color,
                        }}
                      >
                        {label.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Clear All */}
            {hasActiveSearch && (
              <div className="flex justify-end mt-4 pt-4 border-t border-border">
                <button
                  onClick={clearAll}
                  className="text-sm text-text-muted hover:text-error transition-colors flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Alle zurücksetzen
                </button>
              </div>
            )}
          </div>

          {/* Results Count */}
          {hasActiveSearch && !loading && (
            <p className="text-sm text-text-muted mb-4">
              {filteredResults.length} Aufgabe{filteredResults.length !== 1 ? "n" : ""} gefunden
            </p>
          )}

          {/* Results */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : hasActiveSearch ? (
            filteredResults.length > 0 ? (
              <div className="flex flex-col gap-2">
                {filteredResults.map((task) => (
                  <SortableTaskItem
                    key={task.id}
                    task={task}
                    onUpdate={handleTaskUpdate}
                    onClick={handleTaskClick}
                    onDelete={handleTaskDelete}
                    showProject={true}
                    hideDragHandle
                    isSelected={selectedTask?.id === task.id}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-surface rounded-xl shadow-sm border border-border p-12 text-center">
                <SearchIcon className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <p className="text-text-muted mb-2">Keine Aufgaben gefunden</p>
                <p className="text-sm text-text-muted">
                  Versuche andere Suchbegriffe oder Filter
                </p>
              </div>
            )
          ) : (
            <div className="bg-surface rounded-xl shadow-sm border border-border p-12 text-center">
              <Filter className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-muted mb-2">Suchen und Filtern</p>
              <p className="text-sm text-text-muted">
                Gib einen Suchbegriff ein oder wähle Filter aus
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Task Detail View - only show when task is selected */}
        {selectedTask && (
          <div className="w-[500px] shrink min-w-[320px] sticky top-6 self-start max-h-[calc(100vh-120px)]">
            <TaskDetailView
              task={selectedTask}
              onUpdate={handleTaskUpdate}
              onDelete={handleTaskDelete}
              onClose={handleCloseDetail}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
