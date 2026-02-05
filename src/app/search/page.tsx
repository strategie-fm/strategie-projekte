"use client";

import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Header } from "@/components/layout/Header";
import { SortableTaskItem } from "@/components/tasks/SortableTaskItem";
import { TaskDetailView } from "@/components/tasks/TaskDetailView";
import { FilterBar } from "@/components/ui/FilterBar";
import { FilterChips } from "@/components/ui/FilterChips";
import { EmptyState } from "@/components/ui/EmptyState";
import { getTasks, getLabels, getProfiles, getTaskAssignees } from "@/lib/database";
import type { TaskWithRelations, Label, Profile } from "@/types/database";
import { Search as SearchIcon, X } from "lucide-react";
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
  { value: "done", label: "Erledigt" },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [allTasks, setAllTasks] = useState<TaskWithRelations[]>([]);
  const [taskAssigneeMap, setTaskAssigneeMap] = useState<Record<string, string[]>>({});
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [labels, setLabels] = useState<Label[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  // Filter state - all empty by default (no preselection)
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  // Check if any search/filter is active
  const hasActiveSearch =
    query.trim().length > 0 ||
    selectedPriorities.length > 0 ||
    selectedLabels.length > 0 ||
    selectedStatus.length > 0 ||
    selectedAssignees.length > 0;

  // Load data only when search/filters become active
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

    setDataLoaded(true);
    if (!silent) setLoading(false);
  }, []);

  // Lazy load: only load data when search/filters become active
  useEffect(() => {
    if (hasActiveSearch && !dataLoaded) {
      loadData();
    }
  }, [hasActiveSearch, dataLoaded, loadData]);

  // Event listeners for live updates (only when data is loaded)
  useEffect(() => {
    if (!dataLoaded) return;

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
  }, [dataLoaded]);

  useEffect(() => {
    if (!dataLoaded) return;

    const handleTaskLabelsChanged = () => loadData(true);
    window.addEventListener("taskLabelsChanged", handleTaskLabelsChanged);
    return () => window.removeEventListener("taskLabelsChanged", handleTaskLabelsChanged);
  }, [dataLoaded, loadData]);

  useEffect(() => {
    if (!dataLoaded) return;

    const handleTaskUpdated = () => loadData(true);
    window.addEventListener("taskUpdated", handleTaskUpdated);
    return () => window.removeEventListener("taskUpdated", handleTaskUpdated);
  }, [dataLoaded, loadData]);

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

  const handleResetFilters = () => {
    setQuery("");
    setSelectedPriorities([]);
    setSelectedLabels([]);
    setSelectedStatus([]);
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
  const filteredByFilters = filterTasks(searchFiltered, {
    priorities: selectedPriorities,
    labels: selectedLabels,
    status: selectedStatus,
  }, taskAssigneeMap);

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

  // Build label options for FilterChips
  const labelOptions = labels.map((label) => ({
    value: label.id,
    label: label.name,
    color: label.color,
  }));

  // Build assignee options for FilterChips (including "unassigned")
  const assigneeOptions = [
    { value: "unassigned", label: "Nicht zugewiesen" },
    ...profiles.map((profile) => ({
      value: profile.id,
      label: profile.full_name || profile.email.split("@")[0],
    })),
  ];

  return (
    <AppLayout>
      <Header title="Suche" subtitle="Aufgaben durchsuchen und filtern" />

      {/* Search Input */}
      <div className="pt-4">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Aufgaben suchen..."
            className="w-full pl-12 pr-12 py-3 bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
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
      </div>

      {/* FilterBar */}
      <FilterBar onReset={handleResetFilters} showReset={hasActiveSearch}>
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
        {(dataLoaded ? assigneeOptions.length > 1 : true) && (
          <FilterChips
            label="Person"
            options={dataLoaded ? assigneeOptions : [{ value: "unassigned", label: "Nicht zugewiesen" }]}
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
      </FilterBar>

      <div className="pt-6 flex gap-6">
        {/* Left Column: Results */}
        <div className="flex-1 min-w-0">
          {/* Results Count */}
          {hasActiveSearch && dataLoaded && !loading && (
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
              <EmptyState
                icon={SearchIcon}
                title="Keine Aufgaben gefunden"
                description="Versuche andere Suchbegriffe oder Filter"
              />
            )
          ) : (
            <EmptyState
              icon={SearchIcon}
              title="Suchen und Filtern"
              description="Gib einen Suchbegriff ein oder wähle Filter aus"
            />
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
