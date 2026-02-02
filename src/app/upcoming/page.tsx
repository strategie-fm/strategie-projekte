"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { TaskItem } from "@/components/tasks/TaskItem";
import { QuickAddTask } from "@/components/tasks/QuickAddTask";
import { getTasks } from "@/lib/database";
import type { TaskWithRelations } from "@/types/database";
import { CalendarDays } from "lucide-react";

interface GroupedTasks {
  [key: string]: TaskWithRelations[];
}

export default function UpcomingPage() {
  const [groupedTasks, setGroupedTasks] = useState<GroupedTasks>({});
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    setLoading(true);
    const allTasks = await getTasks();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Filter and group tasks by date
    const grouped: GroupedTasks = {};

    allTasks.forEach((task) => {
      if (task.status === "done") return;
      if (!task.due_date) return;

      const taskDate = new Date(task.due_date);
      taskDate.setHours(0, 0, 0, 0);

      // Only include tasks from today to next 7 days
      if (taskDate >= today && taskDate < nextWeek) {
        const dateKey = taskDate.toISOString().split("T")[0];
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(task);
      }
    });

    setGroupedTasks(grouped);
    setLoading(false);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleTaskUpdate = (updatedTask: TaskWithRelations) => {
    if (updatedTask.status === "done") {
      setGroupedTasks((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((key) => {
          updated[key] = updated[key].filter((t) => t.id !== updatedTask.id);
          if (updated[key].length === 0) {
            delete updated[key];
          }
        });
        return updated;
      });
    }
  };

  const handleTaskCreated = () => {
    loadTasks();
  };

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);

    if (taskDate.getTime() === today.getTime()) {
      return "Heute";
    } else if (taskDate.getTime() === tomorrow.getTime()) {
      return "Morgen";
    } else {
      return date.toLocaleDateString("de-DE", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    }
  };

  const sortedDates = Object.keys(groupedTasks).sort();
  const totalTasks = Object.values(groupedTasks).flat().length;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="ml-sidebar-width">
        <Header
          title="Anstehend"
          subtitle="Die nächsten 7 Tage"
        />

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {sortedDates.length > 0 ? (
                sortedDates.map((dateKey) => (
                  <section key={dateKey} className="mb-6">
                    <h2 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-info" />
                      {formatDateHeader(dateKey)} ({groupedTasks[dateKey].length})
                    </h2>
                    <div className="bg-surface rounded-xl shadow-sm border border-border">
                      {groupedTasks[dateKey].map((task) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          onUpdate={handleTaskUpdate}
                        />
                      ))}
                    </div>
                  </section>
                ))
              ) : (
                <div className="bg-surface rounded-xl shadow-sm border border-border p-12 text-center">
                  <CalendarDays className="w-12 h-12 text-text-muted mx-auto mb-4" />
                  <p className="text-text-muted mb-2">Keine anstehenden Aufgaben</p>
                  <p className="text-sm text-text-muted">
                    Plane deine nächste Woche
                  </p>
                </div>
              )}

              <QuickAddTask onTaskCreated={handleTaskCreated} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}