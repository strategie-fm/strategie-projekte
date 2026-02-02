"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { TaskItem } from "@/components/tasks/TaskItem";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { searchTasks } from "@/lib/database";
import type { TaskWithRelations } from "@/types/database";
import { Search as SearchIcon, Loader2 } from "lucide-react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    const data = await searchTasks(query.trim());
    setResults(data);
    setLoading(false);
  };

  const handleTaskUpdate = (updatedTask: TaskWithRelations) => {
    setResults((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
    if (selectedTask?.id === updatedTask.id) {
      setSelectedTask(updatedTask);
    }
  };

  const handleTaskDelete = (taskId: string) => {
    setResults((prev) => prev.filter((t) => t.id !== taskId));
    setSelectedTask(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="ml-sidebar-width">
        <Header title="Suche" subtitle="Durchsuche alle Aufgaben" />

        <div className="p-6">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Suche nach Aufgaben..."
                className="w-full pl-12 pr-4 py-3 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                autoFocus
              />
              {loading && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />
              )}
            </div>
          </form>

          {/* Results */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : hasSearched ? (
            results.length > 0 ? (
              <section>
                <h2 className="text-sm font-semibold text-text-secondary mb-3">
                  {results.length} Ergebnis{results.length !== 1 ? "se" : ""} für &ldquo;{query}&rdquo;
                </h2>
                <div className="bg-surface rounded-xl shadow-sm border border-border">
                  {results.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onUpdate={handleTaskUpdate}
                      onClick={setSelectedTask}
                    />
                  ))}
                </div>
              </section>
            ) : (
              <div className="bg-surface rounded-xl shadow-sm border border-border p-12 text-center">
                <SearchIcon className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <p className="text-text-muted mb-2">
                  Keine Ergebnisse für &ldquo;{query}&rdquo;
                </p>
                <p className="text-sm text-text-muted">
                  Versuche einen anderen Suchbegriff
                </p>
              </div>
            )
          ) : (
            <div className="bg-surface rounded-xl shadow-sm border border-border p-12 text-center">
              <SearchIcon className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-muted mb-2">Suche nach Aufgaben</p>
              <p className="text-sm text-text-muted">
                Durchsuche Titel und Beschreibungen
              </p>
            </div>
          )}
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
    </div>
  );
}