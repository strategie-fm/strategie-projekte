"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Home,
  User,
  Inbox,
  Calendar,
  CalendarDays,
  Search,
  Plus,
  FolderOpen,
  LogOut,
  ChevronDown,
  ChevronRight,
  X,
  GripVertical,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getProjects, createProject } from "@/lib/database";
import { getAllProjectsProgress } from "@/lib/database";
import type { Project } from "@/types/database";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { QuickAddTask } from "@/components/tasks/QuickAddTask";

const MIN_WIDTH = 200;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 256;

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/", icon: Home, label: "Heute" },
  { href: "/my-tasks", icon: User, label: "Meine Aufgaben" },
  { href: "/inbox", icon: Inbox, label: "Inbox" },
  { href: "/today", icon: Calendar, label: "Heute" },
  { href: "/upcoming", icon: CalendarDays, label: "Anstehend" },
  { href: "/search", icon: Search, label: "Suche" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [projectProgress, setProjectProgress] = useState<Record<string, { total: number; completed: number }>>({});
  
  // Resizable state
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Track if initial load is done
  const [isInitialized, setIsInitialized] = useState(false);

  // Load width from localStorage on mount
  useEffect(() => {
    const savedWidth = localStorage.getItem("sidebar-width");
    if (savedWidth) {
      const parsed = parseInt(savedWidth, 10);
      if (parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
        setWidth(parsed);
        document.documentElement.style.setProperty("--sidebar-width", `${parsed}px`);
      }
    } else {
      document.documentElement.style.setProperty("--sidebar-width", `${DEFAULT_WIDTH}px`);
    }
    setIsInitialized(true);
  }, []);

  // Save width to localStorage (only after initialization)
  useEffect(() => {
    if (!isInitialized) return;
    
    localStorage.setItem("sidebar-width", width.toString());
    document.documentElement.style.setProperty("--sidebar-width", `${width}px`);
  }, [width, isInitialized]);

  // Handle resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  const loadProjects = async () => {
    const data = await getProjects();
    setProjects(data);
  };

  useEffect(() => {
    loadProjects();
    loadProgress();
  }, []);

  const loadProgress = async () => {
    const progress = await getAllProjectsProgress();
    setProjectProgress(progress);
  };

  // Listen for project updates
  useEffect(() => {
    const handleProjectsUpdated = () => {
      loadProjects();
      loadProgress();
    };

    const handleTaskUpdated = () => {
      loadProgress();
    };

    window.addEventListener("projectsUpdated", handleProjectsUpdated);
    window.addEventListener("taskUpdated", handleTaskUpdated);
    
    return () => {
      window.removeEventListener("projectsUpdated", handleProjectsUpdated);
      window.removeEventListener("taskUpdated", handleTaskUpdated);
    };
  }, []);

  // Listen for keyboard shortcuts
  useEffect(() => {
    const handleOpenNewTask = () => setShowQuickAdd(true);
    const handleCloseModals = () => setShowQuickAdd(false);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Ignore if modifier keys are pressed (except for specific combos)
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "n":
          e.preventDefault();
          setShowQuickAdd(true);
          break;
        case "d":
          e.preventDefault();
          router.push("/dashboard");
          break;
        case "h":
          e.preventDefault();
          router.push("/");
          break;
        case "i":
          e.preventDefault();
          router.push("/inbox");
          break;
        case "u":
          e.preventDefault();
          router.push("/upcoming");
          break;
        case "s":
          e.preventDefault();
          router.push("/search");
          break;
        case "escape":
          setShowQuickAdd(false);
          break;
      }
    };

    window.addEventListener("openNewTaskModal", handleOpenNewTask);
    window.addEventListener("closeModals", handleCloseModals);
    window.addEventListener("keydown", handleKeyDown);
    
    return () => {
      window.removeEventListener("openNewTaskModal", handleOpenNewTask);
      window.removeEventListener("closeModals", handleCloseModals);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [router]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || isCreating) return;

    setIsCreating(true);
    const project = await createProject({ name: newProjectName.trim() });

    if (project) {
      setProjects((prev) => [...prev, project]);
      setNewProjectName("");
      setShowNewProject(false);
      router.push(`/projects/${project.id}`);
    }
    setIsCreating(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      <aside
        ref={sidebarRef}
        style={{ width }}
        className="fixed top-0 left-0 h-screen bg-primary text-white flex flex-col z-30"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <h1 className="text-xl font-bold tracking-tight">STRATEGIE</h1>
        </div>

        {/* Quick Add Button */}
        <div className="px-3 py-3">
          <button
            onClick={() => setShowQuickAdd(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Neue Aufgabe
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {/* Main Nav */}
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm",
                      isActive
                        ? "bg-white/15 text-white"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Projects Section */}
          <div className="mt-6">
            <button
              onClick={() => setProjectsExpanded(!projectsExpanded)}
              className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-white/50 uppercase tracking-wider hover:text-white/70 transition-colors"
            >
              <span>Aufgabenlisten</span>
              {projectsExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {projectsExpanded && (
              <ul className="mt-1 space-y-1">
                {projects.map((project) => {
                  const isActive = pathname === `/projects/${project.id}`;
                  const progress = projectProgress[project.id];
                  const percentage = progress && progress.total > 0 
                    ? Math.round((progress.completed / progress.total) * 100) 
                    : 0;
                  
                  return (
                    <li key={project.id}>
                      <Link
                        href={`/projects/${project.id}`}
                        className={cn(
                          "flex flex-col gap-1 px-3 py-2 rounded-lg transition-colors text-sm",
                          isActive
                            ? "bg-white/15 text-white"
                            : "text-white/70 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-3 h-3 rounded flex-shrink-0"
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="truncate flex-1">{project.name}</span>
                          {progress && progress.total > 0 && (
                            <span className="text-xs opacity-60">
                              {progress.completed}/{progress.total}
                            </span>
                          )}
                        </div>
                        {progress && progress.total > 0 && (
                          <div className="ml-6 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-white/60 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        )}
                      </Link>
                    </li>
                  );
                })}

                {projects.length === 0 && (
                  <li className="px-3 py-2 text-sm text-white/50">
                    Noch keine Listen
                  </li>
                )}

                {/* New Project Button/Input */}
                <li>
                  {showNewProject ? (
                    <div className="px-2 py-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCreateProject();
                            if (e.key === "Escape") {
                              setShowNewProject(false);
                              setNewProjectName("");
                            }
                          }}
                          placeholder="Listenname..."
                          className="flex-1 bg-white/10 border border-white/20 rounded px-2 py-1.5 text-sm text-white placeholder:text-white/50 outline-none focus:border-white/40"
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            setShowNewProject(false);
                            setNewProjectName("");
                          }}
                          className="p-1 text-white/50 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowNewProject(true)}
                      className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Neue Liste</span>
                    </button>
                  )}
                </li>
              </ul>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Abmelden</span>
          </button>
        </div>

        {/* Resize Handle */}
        <div
          onMouseDown={() => setIsResizing(true)}
          className={cn(
            "absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-white/30 transition-colors",
            isResizing && "bg-white/30"
          )}
        />
      </aside>

      {/* Quick Add Modal */}
      <Modal
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        title="Neue Aufgabe"
      >
        <QuickAddTask
          onTaskCreated={() => {
            setShowQuickAdd(false);
            window.dispatchEvent(new Event("taskCreated"));
          }}
        />
      </Modal>
    </>
  );
}