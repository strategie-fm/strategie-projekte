import { create } from "zustand";
import type { Project, Profile } from "@/types/database";
import { getProjects, getProfile, getAllProjectsProgress } from "./database";
import { supabase } from "./supabase";

interface SidebarState {
  // Data
  projects: Project[];
  userProfile: Profile | null;
  projectProgress: Record<string, { total: number; completed: number }>;

  // Loading states
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  loadSidebarData: () => Promise<void>;
  refreshProjects: () => Promise<void>;
  refreshProgress: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  addProject: (project: Project) => void;
  reset: () => void;
}

export const useSidebarStore = create<SidebarState>((set, get) => ({
  // Initial state
  projects: [],
  userProfile: null,
  projectProgress: {},
  isLoading: false,
  isInitialized: false,

  // Load all sidebar data (only if not already initialized)
  loadSidebarData: async () => {
    // Skip if already initialized or currently loading
    if (get().isInitialized || get().isLoading) {
      return;
    }

    set({ isLoading: true });

    try {
      // Load user profile
      const { data: { user } } = await supabase.auth.getUser();
      let profile: Profile | null = null;
      if (user) {
        profile = await getProfile(user.id);
      }

      // Load projects and progress in parallel
      const [projects, progress] = await Promise.all([
        getProjects(),
        getAllProjectsProgress(),
      ]);

      set({
        userProfile: profile,
        projects,
        projectProgress: progress,
        isInitialized: true,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error loading sidebar data:", error);
      set({ isLoading: false });
    }
  },

  // Refresh only projects
  refreshProjects: async () => {
    const projects = await getProjects();
    set({ projects });
  },

  // Refresh only progress
  refreshProgress: async () => {
    const progress = await getAllProjectsProgress();
    set({ projectProgress: progress });
  },

  // Refresh user profile
  refreshUserProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const profile = await getProfile(user.id);
      set({ userProfile: profile });
    }
  },

  // Add a new project locally (optimistic update)
  addProject: (project: Project) => {
    set((state) => ({
      projects: [...state.projects, project],
    }));
  },

  // Reset store (on logout)
  reset: () => {
    set({
      projects: [],
      userProfile: null,
      projectProgress: {},
      isLoading: false,
      isInitialized: false,
    });
  },
}));
