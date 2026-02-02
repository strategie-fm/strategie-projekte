"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { TaskItem } from "@/components/tasks/TaskItem";
import { QuickAddTask } from "@/components/tasks/QuickAddTask";
import { getTasks } from "@/lib/database";
import type { TaskWithRelations } from "@/types/database";

export default function Home() {
  const [overdueTasks, setOverdueTasks] = useState<TaskWithRelations[]>([]);
  const [todayTasks, setTodayTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    setLoading(true);
    
    // Get all tasks and filter client-side for simplicity
    const allTasks = await getTasks();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const overdue: TaskWithRelations[] = [];
    const todayList: TaskWithRelations[] = [];
    const noDueDate: TaskWithRelations[] = [];

    allTasks.forEach((task) => {
      if (task.status === "done") return;
      
      if (!task.due_date) {
        noDueDate.push(task);
        return;
      }

      const taskDate = new Date(task.due_date);
      taskDate.setHours(0, 0, 0, 0);

      if (taskDate < today) {
        overdue.push(task);
      } else if (taskDate.getTime() === today.getTime()) {
        todayList.push(task);
      }
    });

    setOverdueTasks(overdue);
    setTodayTasks([...todayList, ...noDueDate]);
    setLoading(false);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleTaskUpdate = (updatedTask: TaskWithRelations) => {
    // Remove from lists if completed
    if (updatedTask.status === "done") {
      setOverdueTasks((prev) => prev.filter((t) => t.id !== updatedTask.id));
      setTodayTasks((prev) => prev.filter((t) => t.id !== updatedTask.id));
    }
  };

  const handleTaskCreated = () => {
    loadTasks();
  };

  const todayDate = new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="ml-sidebar-width">
        <Header title="Heute" subtitle={todayDate} />

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Überfällig Section */}
              {overdueTasks.length > 0 && (
                <section className="mb-6">
                  <h2 className="text-sm font-semibold text-error mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-error" />
                    Überfällig ({overdueTasks.length})
                  </h2>
                  <div className="bg-surface rounded-xl shadow-sm border border-border">
                    {overdueTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onUpdate={handleTaskUpdate}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Heute Section */}
              <section className="mb-6">
                <h2 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Heute ({todayTasks.length})
                </h2>
                {todayTasks.length > 0 ? (
                  <div className="bg-surface rounded-xl shadow-sm border border-border">
                    {todayTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onUpdate={handleTaskUpdate}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-surface rounded-xl shadow-sm border border-border p-8 text-center">
                    <p className="text-text-muted">
                      Keine Aufgaben für heute. Genieße deinen Tag! 🎉
                    </p>
                  </div>
                )}
              </section>

              {/* Quick Add */}
              <QuickAddTask onTaskCreated={handleTaskCreated} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}