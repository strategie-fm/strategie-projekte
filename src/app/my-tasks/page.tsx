"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SortableTaskItem } from "@/components/tasks/SortableTaskItem";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { QuickAddTask } from "@/components/tasks/QuickAddTask";
import { getTasks, getTaskAssignees } from "@/lib/database";
import { supabase } from "@/lib/supabase";
import type { TaskWithRelations } from "@/types/database";
import { User, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [completedTasks, setCompletedTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }
      
      setCurrentUserId(user.id);
      
      // Get all tasks
      const allTasks = await getTasks();
      
      // Filter tasks assigned to current user
      const myTasks: TaskWithRelations[] = [];
      const myCompletedTasks: TaskWithRelations[] = [];
      
      await Promise.all(
        allTasks.map(async (task) => {
          const assignees = await getTaskAssignees(task.id);
          const isAssignedToMe = assignees.some((a) => a.user_id === user.id);
          
          if (isAssignedToMe) {
            if (task.status === "done") {
              myCompletedTasks.push(task);
            } else {
              myTasks.push(task);
            }
          }
        })
      );
      
      // Sort by priority then due date
      const sortTasks = (a: TaskWithRelations, b: TaskWithRelations) => {
        const priorityOrder = { p1: 0, p2: 1, p3: 2, p4: 3 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        if (a.due_date && b.due_date) {
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        if (a.due_date) return -1;
        if (b.due_date) return 1;
        return 0;
      };
      
      setTasks(myTasks.sort(sortTasks));
      setCompletedTasks(myCompletedTasks);
      setLoading(false);
    };
    
    loadData();
  }, []);

  const handleTaskUpdate = (updatedTask: TaskWithRelations) => {
    if (updatedTask.status === "done") {
      setTasks((prev) => prev.filter((t) => t.id !== updatedTask.id));
      setCompletedTasks((prev) => [updatedTask, ...prev.filter((t) => t.id !== updatedTask.id)]);
    } else {
      setCompletedTasks((prev) => prev.filter((t) => t.id !== updatedTask.id));
      setTasks((prev) => {
        const exists = prev.some((t) => t.id === updatedTask.id);
        if (exists) {
          return prev.map((t) => (t.id === updatedTask.id ? updatedTask : t));
        }
        return [updatedTask, ...prev];
      });
    }
    if (selectedTask?.id === updatedTask.id) {
      setSelectedTask(updatedTask);
    }
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setCompletedTasks((prev) => prev.filter((t) => t.id !== taskId));
    setSelectedTask(null);
  };

  const handleTaskCreated = () => {
    window.location.reload();
  };

  // Group tasks by priority
  const p1Tasks = tasks.filter((t) => t.priority === "p1");
  const p2Tasks = tasks.filter((t) => t.priority === "p2");
  const p3Tasks = tasks.filter((t) => t.priority === "p3");
  const p4Tasks = tasks.filter((t) => t.priority === "p4");

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="ml-sidebar-width">
        <Header title="Meine Aufgaben" subtitle="Mir zugewiesene Aufgaben" />

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Header with completed toggle */}
              <div className="flex justify-end mb-4">
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
              </div>

              {tasks.length > 0 ? (
                <div className="space-y-6">
                  {/* P1 Tasks */}
                  {p1Tasks.length > 0 && (
                    <section>
                      <h2 className="text-sm font-semibold text-error mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-error" />
                        Priorität 1 - Dringend ({p1Tasks.length})
                      </h2>
                      <div className="bg-surface rounded-xl shadow-sm border border-border">
                        {p1Tasks.map((task) => (
                          <SortableTaskItem
                            key={task.id}
                            task={task}
                            onUpdate={handleTaskUpdate}
                            onClick={setSelectedTask}
                            showProject={true}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* P2 Tasks */}
                  {p2Tasks.length > 0 && (
                    <section>
                      <h2 className="text-sm font-semibold text-warning mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-warning" />
                        Priorität 2 - Hoch ({p2Tasks.length})
                      </h2>
                      <div className="bg-surface rounded-xl shadow-sm border border-border">
                        {p2Tasks.map((task) => (
                          <SortableTaskItem
                            key={task.id}
                            task={task}
                            onUpdate={handleTaskUpdate}
                            onClick={setSelectedTask}
                            showProject={true}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* P3 Tasks */}
                  {p3Tasks.length > 0 && (
                    <section>
                      <h2 className="text-sm font-semibold text-info mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-info" />
                        Priorität 3 - Normal ({p3Tasks.length})
                      </h2>
                      <div className="bg-surface rounded-xl shadow-sm border border-border">
                        {p3Tasks.map((task) => (
                          <SortableTaskItem
                            key={task.id}
                            task={task}
                            onUpdate={handleTaskUpdate}
                            onClick={setSelectedTask}
                            showProject={true}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* P4 Tasks */}
                  {p4Tasks.length > 0 && (
                    <section>
                      <h2 className="text-sm font-semibold text-text-muted mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-text-muted" />
                        Priorität 4 - Niedrig ({p4Tasks.length})
                      </h2>
                      <div className="bg-surface rounded-xl shadow-sm border border-border">
                        {p4Tasks.map((task) => (
                          <SortableTaskItem
                            key={task.id}
                            task={task}
                            onUpdate={handleTaskUpdate}
                            onClick={setSelectedTask}
                            showProject={true}
                          />
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              ) : (
                <div className="bg-surface rounded-xl shadow-sm border border-border p-12 text-center">
                  <User className="w-12 h-12 text-text-muted mx-auto mb-4" />
                  <p className="text-text-muted mb-2">Keine Aufgaben zugewiesen</p>
                  <p className="text-sm text-text-muted">
                    Dir wurden noch keine Aufgaben zugewiesen
                  </p>
                </div>
              )}

              {/* Completed Tasks */}
              {showCompleted && completedTasks.length > 0 && (
                <section className="mt-6">
                  <h2 className="text-sm font-semibold text-text-muted mb-3 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Erledigt ({completedTasks.length})
                  </h2>
                  <div className="bg-surface rounded-xl shadow-sm border border-border opacity-60">
                    {completedTasks.map((task) => (
                      <SortableTaskItem
                        key={task.id}
                        task={task}
                        onUpdate={handleTaskUpdate}
                        onClick={setSelectedTask}
                        showProject={true}
                      />
                    ))}
                  </div>
                </section>
              )}

              <div className="mt-6">
                <QuickAddTask onTaskCreated={handleTaskCreated} />
              </div>
            </>
          )}
        </div>
      </main>

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