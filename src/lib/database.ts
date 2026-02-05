import { supabase } from "./supabase";
import type { Project, Task, TaskWithRelations, Label, Comment, Section, Profile, TaskAssignee, TaskRecurrence, RecurrenceType } from "@/types/database";

// ============================================
// PROJECTS
// ============================================

export async function getProjects(): Promise<Project[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // RLS handles access control - no need to filter by created_by
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .is("archived_at", null)
    .order("position", { ascending: true });

  if (error) {
    console.error("Error fetching projects:", error);
    return [];
  }

  return data || [];
}

export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching project:", error);
    return null;
  }

  return data;
}

export async function createProject(project: {
  name: string;
  description?: string;
  color?: string;
}): Promise<Project | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("projects")
    .insert({
      name: project.name,
      description: project.description || null,
      color: project.color || "#183c6c",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating project:", error);
    return null;
  }

  return data;
}

export async function updateProject(
  id: string,
  updates: Partial<Pick<Project, "name" | "description" | "color" | "position">>
): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating project:", error);
    return null;
  }

  return data;
}

export async function deleteProject(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting project:", error);
    return false;
  }

  return true;
}

export async function archiveProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .update({
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error archiving project:", error);
    return null;
  }

  return data;
}

export async function unarchiveProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .update({
      archived_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error unarchiving project:", error);
    return null;
  }

  return data;
}

export async function getArchivedProjects(): Promise<Project[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .not("archived_at", "is", null)
    .order("archived_at", { ascending: false });

  if (error) {
    console.error("Error fetching archived projects:", error);
    return [];
  }

  return data || [];
}

// ============================================
// TASKS
// ============================================

// Helper: Parse view data into TaskWithRelations
function parseViewTask(viewTask: Record<string, unknown>): TaskWithRelations {
  const subtaskCountData = viewTask.subtask_count as { total: number; completed: number } | null;

  return {
    id: viewTask.id as string,
    title: viewTask.title as string,
    description: viewTask.description as string | null,
    status: viewTask.status as Task["status"],
    priority: viewTask.priority as Task["priority"],
    due_date: viewTask.due_date as string | null,
    completed_at: viewTask.completed_at as string | null,
    position: viewTask.position as number,
    section_id: viewTask.section_id as string | null,
    parent_task_id: viewTask.parent_task_id as string | null,
    created_by: viewTask.created_by as string,
    created_at: viewTask.created_at as string,
    updated_at: viewTask.updated_at as string,
    projects: (viewTask.projects as Project[]) || [],
    labels: (viewTask.labels as Label[]) || [],
    assignees: (viewTask.assignees as TaskAssignee[]) || [],
    subtaskCount: subtaskCountData && subtaskCountData.total > 0 ? subtaskCountData : undefined,
  };
}

export async function getTasks(options?: { excludeCompleted?: boolean }): Promise<TaskWithRelations[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Use view for single-query loading of all relations
  let query = supabase
    .from("tasks_with_relations")
    .select("*");

  // Optionally exclude completed tasks
  if (options?.excludeCompleted) {
    query = query.neq("status", "done");
  }

  const { data, error } = await query.order("position", { ascending: true });

  if (error) {
    console.error("Error fetching tasks from view:", error);
    return [];
  }

  return (data || []).map(parseViewTask);
}

// Lazy loading: Fetch only completed tasks (for "Show completed" toggle)
export async function getCompletedTasks(options?: {
  dueDateLte?: string;  // Only get completed tasks with due_date <= this date
  projectId?: string;   // Filter by project
}): Promise<TaskWithRelations[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Use view for single-query loading
  let query = supabase
    .from("tasks_with_relations")
    .select("*")
    .eq("status", "done");

  if (options?.dueDateLte) {
    query = query.lte("due_date", options.dueDateLte);
  }

  const { data, error } = await query.order("completed_at", { ascending: false });

  if (error) {
    console.error("Error fetching completed tasks from view:", error);
    return [];
  }

  let tasks = (data || []).map(parseViewTask);

  // Filter by projectId in JavaScript (projects is already loaded as JSON array)
  if (options?.projectId) {
    tasks = tasks.filter(task =>
      (task.projects || []).some(p => p.id === options.projectId)
    );
  }

  return tasks;
}

export async function getTasksByProject(projectId: string): Promise<TaskWithRelations[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get task IDs for this project first (needed for filtering view)
  const { data: taskProjectLinks, error: linkError } = await supabase
    .from("task_projects")
    .select("task_id")
    .eq("project_id", projectId);

  if (linkError || !taskProjectLinks || taskProjectLinks.length === 0) {
    return [];
  }

  const taskIds = taskProjectLinks.map(tp => tp.task_id);

  // Use view for single-query loading, filtered by task IDs
  const { data, error } = await supabase
    .from("tasks_with_relations")
    .select("*")
    .in("id", taskIds)
    .neq("status", "done")
    .order("position", { ascending: true });

  if (error) {
    console.error("Error fetching tasks from view:", error);
    return [];
  }

  return (data || []).map(parseViewTask);
}

export async function getInboxTasks(): Promise<TaskWithRelations[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Use view and filter for tasks without projects (inbox)
  const { data, error } = await supabase
    .from("tasks_with_relations")
    .select("*")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching inbox tasks from view:", error);
    return [];
  }

  // Filter for tasks without projects (inbox tasks)
  return (data || [])
    .map(parseViewTask)
    .filter(task => (task.projects || []).length === 0);
}

export async function createTask(task: {
  title: string;
  description?: string;
  priority?: Task["priority"];
  status?: Task["status"];
  due_date?: string;
  project_id?: string;
  section_id?: string;
}): Promise<Task | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: newTask, error: taskError } = await supabase
    .from("tasks")
    .insert({
      title: task.title,
      description: task.description || null,
      priority: task.priority || "p4",
      status: task.status || "todo",
      due_date: task.due_date || null,
      section_id: task.section_id || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (taskError) {
    console.error("Error creating task:", taskError);
    return null;
  }

  if (task.project_id && newTask) {
    const { error: linkError } = await supabase
      .from("task_projects")
      .insert({
        task_id: newTask.id,
        project_id: task.project_id,
      });

    if (linkError) {
      console.error("Error linking task to project:", linkError);
    }
  }

  return newTask;
}

export async function updateTask(
  id: string,
  updates: Partial<Pick<Task, "title" | "description" | "status" | "priority" | "due_date" | "completed_at" | "position" | "section_id">>
): Promise<Task | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from("tasks")
    .update({ 
      ...updates, 
      updated_at: new Date().toISOString(),
      updated_by: user?.id || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating task:", error);
    return null;
  }

  return data;
}

export async function toggleTaskComplete(id: string, completed: boolean): Promise<Task | null> {
  return updateTask(id, {
    status: completed ? "done" : "todo",
    completed_at: completed ? new Date().toISOString() : null,
  });
}

export async function deleteTask(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting task:", error);
    return false;
  }

  return true;
}

export async function updateTaskProject(taskId: string, projectId: string | null): Promise<boolean> {
  // Remove existing project links
  const { error: deleteError } = await supabase
    .from("task_projects")
    .delete()
    .eq("task_id", taskId);

  if (deleteError) {
    console.error("Error removing task project link:", deleteError);
    return false;
  }

  // Add new project link if projectId is provided
  if (projectId) {
    const { error: insertError } = await supabase
      .from("task_projects")
      .insert({
        task_id: taskId,
        project_id: projectId,
      });

    if (insertError) {
      console.error("Error linking task to project:", insertError);
      return false;
    }
  }

  return true;
}

export async function searchTasks(query: string): Promise<TaskWithRelations[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !query.trim()) return [];

  // RLS handles access control - search across all accessible tasks
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .neq("status", "archived")
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error searching tasks:", error);
    return [];
  }

  if (!tasks || tasks.length === 0) {
    return [];
  }

  const taskIds = tasks.map(t => t.id);
  
  const { data: taskProjects } = await supabase
    .from("task_projects")
    .select("task_id, project_id, projects(*)")
    .in("task_id", taskIds);

  // Load subtask counts
  const subtaskCounts = await getSubtaskCount(taskIds);

  // Load labels
  const { data: taskLabels } = await supabase
    .from("task_labels")
    .select("task_id, label_id, labels(*)")
    .in("task_id", taskIds);

  // Load assignees
  const { data: taskAssignees } = await supabase
    .from("task_assignees")
    .select("task_id, user_id, profile:profiles!task_assignees_user_id_fkey(*)")
    .in("task_id", taskIds);

  return tasks.map((task) => {
    const projectLinks = taskProjects?.filter(tp => tp.task_id === task.id) || [];
    const projects: Project[] = [];

    projectLinks.forEach(tp => {
      if (tp.projects && typeof tp.projects === 'object' && !Array.isArray(tp.projects)) {
        projects.push(tp.projects as unknown as Project);
      }
    });

    const labelLinks = taskLabels?.filter(tl => tl.task_id === task.id) || [];
    const labels: Label[] = [];

    labelLinks.forEach(tl => {
      if (tl.labels && typeof tl.labels === 'object' && !Array.isArray(tl.labels)) {
        labels.push(tl.labels as unknown as Label);
      }
    });

    // Map assignees
    const assigneeLinks = taskAssignees?.filter(ta => ta.task_id === task.id) || [];
    const assignees: TaskAssignee[] = assigneeLinks.map(ta => ({
      task_id: ta.task_id,
      user_id: ta.user_id,
      profile: ta.profile as unknown as Profile,
    })) as TaskAssignee[];

    return {
      ...task,
      projects,
      assignees,
      labels,
      subtaskCount: subtaskCounts[task.id] || undefined,
    };
  });
}

// ============================================
// SUBTASKS
// ============================================

export async function getSubtasks(parentTaskId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("parent_task_id", parentTaskId)
    .neq("status", "archived")
    .order("position", { ascending: true });

  if (error) {
    console.error("Error fetching subtasks:", error);
    return [];
  }

  return data || [];
}

export async function createSubtask(
  parentTaskId: string,
  title: string
): Promise<Task | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title,
      parent_task_id: parentTaskId,
      created_by: user.id,
      priority: "p4",
      status: "todo",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating subtask:", error);
    return null;
  }

  return data;
}

export async function getSubtaskCount(taskIds: string[]): Promise<Record<string, { total: number; completed: number }>> {
  if (taskIds.length === 0) return {};

  const { data, error } = await supabase
    .from("tasks")
    .select("parent_task_id, status")
    .in("parent_task_id", taskIds)
    .neq("status", "archived");

  if (error) {
    console.error("Error fetching subtask counts:", error);
    return {};
  }

  const counts: Record<string, { total: number; completed: number }> = {};
  
  (data || []).forEach((subtask) => {
    if (!subtask.parent_task_id) return;
    
    if (!counts[subtask.parent_task_id]) {
      counts[subtask.parent_task_id] = { total: 0, completed: 0 };
    }
    counts[subtask.parent_task_id].total++;
    if (subtask.status === "done") {
      counts[subtask.parent_task_id].completed++;
    }
  });

  return counts;
}

// ============================================
// LABELS
// ============================================

export async function getLabels(): Promise<Label[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Labels are personal - keep created_by filter
  const { data, error } = await supabase
    .from("labels")
    .select("*")
    .eq("created_by", user.id)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching labels:", error);
    return [];
  }

  return data || [];
}

export async function createLabel(label: {
  name: string;
  color?: string;
}): Promise<Label | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("labels")
    .insert({
      name: label.name,
      color: label.color || "#6b7280",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating label:", error);
    return null;
  }

  return data;
}

export async function deleteLabel(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("labels")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting label:", error);
    return false;
  }

  return true;
}

export async function addLabelToTask(taskId: string, labelId: string): Promise<boolean> {
  const { error } = await supabase
    .from("task_labels")
    .insert({ task_id: taskId, label_id: labelId });

  if (error) {
    console.error("Error adding label to task:", error);
    return false;
  }

  return true;
}

export async function removeLabelFromTask(taskId: string, labelId: string): Promise<boolean> {
  const { error } = await supabase
    .from("task_labels")
    .delete()
    .eq("task_id", taskId)
    .eq("label_id", labelId);

  if (error) {
    console.error("Error removing label from task:", error);
    return false;
  }

  return true;
}

export async function getTaskLabels(taskId: string): Promise<Label[]> {
  const { data, error } = await supabase
    .from("task_labels")
    .select("label_id, labels(*)")
    .eq("task_id", taskId);

  if (error) {
    console.error("Error fetching task labels:", error);
    return [];
  }

  const labels: Label[] = [];
  (data || []).forEach(tl => {
    if (tl.labels && typeof tl.labels === 'object' && !Array.isArray(tl.labels)) {
      labels.push(tl.labels as unknown as Label);
    }
  });
  
  return labels;
}

// ============================================
// COMMENTS
// ============================================

export async function getComments(taskId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select(`
      *,
      profiles:user_id (id, email, full_name, avatar_url)
    `)
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching comments:", error);
    return [];
  }

  return (data || []).map(comment => ({
    ...comment,
    user: comment.profiles,
  })) as Comment[];
}

export async function createComment(taskId: string, content: string): Promise<Comment | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("comments")
    .insert({
      task_id: taskId,
      user_id: user.id,
      content,
    })
    .select(`
      *,
      profiles:user_id (id, email, full_name, avatar_url)
    `)
    .single();

  if (error) {
    console.error("Error creating comment:", error);
    return null;
  }

  return {
    ...data,
    user: data.profiles,
  } as Comment;
}

export async function deleteComment(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting comment:", error);
    return false;
  }

  return true;
}

// ============================================
// SECTIONS
// ============================================

export async function getSections(projectId: string): Promise<Section[]> {
  // RLS handles access control
  const { data, error } = await supabase
    .from("sections")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true });

  if (error) {
    console.error("Error fetching sections:", error);
    return [];
  }

  return data || [];
}

export async function createSection(projectId: string, name: string): Promise<Section | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get max position
  const { data: existing } = await supabase
    .from("sections")
    .select("position")
    .eq("project_id", projectId)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const { data, error } = await supabase
    .from("sections")
    .insert({
      name,
      project_id: projectId,
      position: nextPosition,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating section:", error);
    return null;
  }

  return data;
}

export async function updateSection(
  id: string,
  updates: Partial<Pick<Section, "name" | "position">>
): Promise<Section | null> {
  const { data, error } = await supabase
    .from("sections")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating section:", error);
    return null;
  }

  return data;
}

export async function deleteSection(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("sections")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting section:", error);
    return false;
  }

  return true;
}

export async function moveTaskToSection(taskId: string, sectionId: string | null): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from("tasks")
    .update({ 
      section_id: sectionId,
      updated_at: new Date().toISOString(),
      updated_by: user?.id || null,
    })
    .eq("id", taskId);

  if (error) {
    console.error("Error moving task to section:", error);
    return false;
  }

  return true;
}

export async function getProjectProgress(projectId: string): Promise<{ total: number; completed: number }> {
  const { data: taskProjectLinks } = await supabase
    .from("task_projects")
    .select("task_id")
    .eq("project_id", projectId);

  if (!taskProjectLinks || taskProjectLinks.length === 0) {
    return { total: 0, completed: 0 };
  }

  const taskIds = taskProjectLinks.map(tp => tp.task_id);

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("status")
    .in("id", taskIds)
    .is("parent_task_id", null)
    .neq("status", "archived");

  if (error || !tasks) {
    return { total: 0, completed: 0 };
  }

  return {
    total: tasks.length,
    completed: tasks.filter(t => t.status === "done").length,
  };
}

export async function getAllProjectsProgress(): Promise<Record<string, { total: number; completed: number }>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  // RLS handles access control - get all accessible projects
  const { data: projects } = await supabase
    .from("projects")
    .select("id")
    .is("archived_at", null);

  if (!projects || projects.length === 0) return {};

  const projectIds = projects.map(p => p.id);

  // Get all task-project links
  const { data: taskProjectLinks } = await supabase
    .from("task_projects")
    .select("task_id, project_id")
    .in("project_id", projectIds);

  if (!taskProjectLinks || taskProjectLinks.length === 0) {
    return projectIds.reduce((acc, id) => ({ ...acc, [id]: { total: 0, completed: 0 } }), {});
  }

  const taskIds = [...new Set(taskProjectLinks.map(tp => tp.task_id))];

  // Get task statuses
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, status")
    .in("id", taskIds)
    .is("parent_task_id", null)
    .neq("status", "archived");

  const taskStatusMap = new Map(tasks?.map(t => [t.id, t.status]) || []);

  // Calculate progress per project
  const progress: Record<string, { total: number; completed: number }> = {};
  
  projectIds.forEach(projectId => {
    progress[projectId] = { total: 0, completed: 0 };
  });

  taskProjectLinks.forEach(link => {
    const status = taskStatusMap.get(link.task_id);
    if (status) {
      progress[link.project_id].total++;
      if (status === "done") {
        progress[link.project_id].completed++;
      }
    }
  });

  return progress;
}

// ============================================
// PROFILES
// ============================================

export async function getProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name");

  if (error) {
    console.error("Error fetching profiles:", error);
    return [];
  }

  return data || [];
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data;
}

// ============================================
// TASK ASSIGNEES
// ============================================

export async function getTaskAssignees(taskId: string): Promise<TaskAssignee[]> {
  const { data, error } = await supabase
    .from("task_assignees")
    .select(`
      *,
      profile:profiles!task_assignees_user_id_fkey(*)
    `)
    .eq("task_id", taskId);

  if (error) {
    console.error("Error fetching task assignees:", error);
    return [];
  }

  return data || [];
}

export async function assignTask(taskId: string, userId: string): Promise<TaskAssignee | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from("task_assignees")
    .insert({
      task_id: taskId,
      user_id: userId,
      assigned_by: user?.id,
    })
    .select(`
      *,
      profile:profiles!task_assignees_user_id_fkey(*)
    `)
    .single();

  if (error) {
    console.error("Error assigning task:", error);
    return null;
  }

  return data;
}

export async function unassignTask(taskId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from("task_assignees")
    .delete()
    .eq("task_id", taskId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error unassigning task:", error);
    return false;
  }

  return true;
}

import type { Team, TeamMember, TeamWithMembers, ProjectTeamAccess, TeamRole, AccessLevel } from "@/types/database";

// ============================================
// TEAMS
// ============================================

export async function getTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching teams:", error);
    return [];
  }

  return data || [];
}

export async function getTeam(teamId: string): Promise<TeamWithMembers | null> {
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (teamError) {
    console.error("Error fetching team:", teamError);
    return null;
  }

  const { data: members, error: membersError } = await supabase
    .from("team_members")
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq("team_id", teamId);

  if (membersError) {
    console.error("Error fetching team members:", membersError);
    return { ...team, members: [] };
  }

  return { ...team, members: members || [] };
}

export async function createTeam(name: string, description?: string, color?: string): Promise<Team | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({
      name,
      description: description || null,
      color: color || "#183c6c",
      created_by: user.id,
    })
    .select()
    .single();

  if (teamError) {
    console.error("Error creating team:", teamError);
    return null;
  }

  // Add creator as owner
  const { error: memberError } = await supabase
    .from("team_members")
    .insert({
      team_id: team.id,
      user_id: user.id,
      role: "owner",
    });

  if (memberError) {
    console.error("Error adding owner to team:", memberError);
  }

  return team;
}

export async function updateTeam(teamId: string, updates: Partial<Team>): Promise<Team | null> {
  const { data, error } = await supabase
    .from("teams")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", teamId)
    .select()
    .single();

  if (error) {
    console.error("Error updating team:", error);
    return null;
  }

  return data;
}

export async function deleteTeam(teamId: string): Promise<boolean> {
  const { error } = await supabase
    .from("teams")
    .delete()
    .eq("id", teamId);

  if (error) {
    console.error("Error deleting team:", error);
    return false;
  }

  return true;
}

// ============================================
// TEAM MEMBERS
// ============================================

export async function addTeamMember(teamId: string, userId: string, role: TeamRole = "member"): Promise<TeamMember | null> {
  const { data, error } = await supabase
    .from("team_members")
    .insert({
      team_id: teamId,
      user_id: userId,
      role,
    })
    .select(`
      *,
      profile:profiles(*)
    `)
    .single();

  if (error) {
    console.error("Error adding team member:", error);
    return null;
  }

  return data;
}

export async function removeTeamMember(teamId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error removing team member:", error);
    return false;
  }

  return true;
}

export async function updateTeamMemberRole(teamId: string, userId: string, role: TeamRole): Promise<boolean> {
  const { error } = await supabase
    .from("team_members")
    .update({ role })
    .eq("team_id", teamId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error updating team member role:", error);
    return false;
  }

  return true;
}

export async function getUserTeams(userId: string): Promise<Team[]> {
  const { data, error } = await supabase
    .from("team_members")
    .select(`
      team:teams(*)
    `)
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching user teams:", error);
    return [];
  }

  if (!data) return [];
  
  const teams: Team[] = [];
  data.forEach((d) => {
    if (d.team && typeof d.team === 'object' && !Array.isArray(d.team)) {
      teams.push(d.team as Team);
    }
  });
  
  return teams;
}

// ============================================
// PROJECT TEAM ACCESS
// ============================================

export async function getProjectTeamAccess(projectId: string): Promise<ProjectTeamAccess[]> {
  const { data, error } = await supabase
    .from("project_team_access")
    .select(`
      *,
      team:teams(*)
    `)
    .eq("project_id", projectId);

  if (error) {
    console.error("Error fetching project team access:", error);
    return [];
  }

  return data || [];
}

export async function grantProjectAccess(projectId: string, teamId: string, accessLevel: AccessLevel = "view"): Promise<ProjectTeamAccess | null> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("project_team_access")
    .insert({
      project_id: projectId,
      team_id: teamId,
      access_level: accessLevel,
      granted_by: user?.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Error granting project access:", error);
    return null;
  }

  // Load the team separately
  if (data) {
    const { data: team } = await supabase
      .from("teams")
      .select("*")
      .eq("id", teamId)
      .single();
    
    return { ...data, team } as ProjectTeamAccess;
  }

  return data;
}

export async function updateProjectAccess(projectId: string, teamId: string, accessLevel: AccessLevel): Promise<boolean> {
  const { error } = await supabase
    .from("project_team_access")
    .update({ access_level: accessLevel })
    .eq("project_id", projectId)
    .eq("team_id", teamId);

  if (error) {
    console.error("Error updating project access:", error);
    return false;
  }

  return true;
}

export async function revokeProjectAccess(projectId: string, teamId: string): Promise<boolean> {
  const { error } = await supabase
    .from("project_team_access")
    .delete()
    .eq("project_id", projectId)
    .eq("team_id", teamId);

  if (error) {
    console.error("Error revoking project access:", error);
    return false;
  }

  return true;
}

export async function getTaskRecurrence(taskId: string): Promise<TaskRecurrence | null> {
  const { data, error } = await supabase
    .from("task_recurrence")
    .select("*")
    .eq("task_id", taskId)
    .single();

  if (error) {
    if (error.code !== "PGRST116") { // Not found is OK
      console.error("Error fetching task recurrence:", error);
    }
    return null;
  }

  return data;
}

export async function createTaskRecurrence(recurrence: {
  task_id: string;
  recurrence_type: RecurrenceType;
  interval_value?: number;
  weekdays?: number[] | null;
  month_day?: number | null;
  year_month?: number | null;
  year_day?: number | null;
  end_date?: string | null;
  end_after_count?: number | null;
  next_due_date?: string | null;
}): Promise<TaskRecurrence | null> {
  const { data, error } = await supabase
    .from("task_recurrence")
    .insert({
      task_id: recurrence.task_id,
      recurrence_type: recurrence.recurrence_type,
      interval_value: recurrence.interval_value || 1,
      weekdays: recurrence.weekdays || null,
      month_day: recurrence.month_day || null,
      year_month: recurrence.year_month || null,
      year_day: recurrence.year_day || null,
      end_date: recurrence.end_date || null,
      end_after_count: recurrence.end_after_count || null,
      next_due_date: recurrence.next_due_date || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating task recurrence:", error);
    return null;
  }

  // Update task to mark as recurring
  await supabase
    .from("tasks")
    .update({ is_recurring: true })
    .eq("id", recurrence.task_id);

  return data;
}

export async function updateTaskRecurrence(
  taskId: string,
  updates: Partial<Omit<TaskRecurrence, "id" | "task_id" | "created_at" | "updated_at">>
): Promise<TaskRecurrence | null> {
  const { data, error } = await supabase
    .from("task_recurrence")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("task_id", taskId)
    .select()
    .single();

  if (error) {
    console.error("Error updating task recurrence:", error);
    return null;
  }

  return data;
}

export async function deleteTaskRecurrence(taskId: string): Promise<boolean> {
  const { error } = await supabase
    .from("task_recurrence")
    .delete()
    .eq("task_id", taskId);

  if (error) {
    console.error("Error deleting task recurrence:", error);
    return false;
  }

  // Update task to mark as not recurring
  await supabase
    .from("tasks")
    .update({ is_recurring: false })
    .eq("id", taskId);

  return true;
}

// Hilfsfunktion: Berechnet das nächste Fälligkeitsdatum
export function calculateNextDueDate(
  currentDueDate: string,
  recurrenceType: RecurrenceType,
  intervalValue: number,
  weekdays?: number[] | null,
  monthDay?: number | null
): string {
  const current = new Date(currentDueDate);
  const next = new Date(current);

  switch (recurrenceType) {
    case "daily":
      next.setDate(next.getDate() + intervalValue);
      break;

    case "weekly":
      if (weekdays && weekdays.length > 0) {
        // Finde den nächsten passenden Wochentag
        let found = false;
        for (let i = 1; i <= 7 * intervalValue; i++) {
          next.setDate(current.getDate() + i);
          if (weekdays.includes(next.getDay())) {
            // Bei interval > 1, überspringe Wochen
            const weeksDiff = Math.floor(i / 7);
            if (weeksDiff % intervalValue === 0 || i <= 7) {
              found = true;
              break;
            }
          }
        }
        if (!found) {
          next.setDate(current.getDate() + 7 * intervalValue);
        }
      } else {
        next.setDate(next.getDate() + 7 * intervalValue);
      }
      break;

    case "monthly":
      next.setMonth(next.getMonth() + intervalValue);
      if (monthDay) {
        if (monthDay === -1) {
          // Letzter Tag des Monats
          next.setMonth(next.getMonth() + 1, 0);
        } else {
          // Bestimmter Tag, aber nicht über Monatslänge hinaus
          const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
          next.setDate(Math.min(monthDay, maxDay));
        }
      }
      break;

    case "yearly":
      next.setFullYear(next.getFullYear() + intervalValue);
      break;

    case "custom":
      // Custom verwendet die gleiche Logik wie die anderen, basierend auf den Parametern
      next.setDate(next.getDate() + intervalValue);
      break;
  }

  return next.toISOString().split("T")[0];
}

// Hauptfunktion: Wird aufgerufen wenn eine wiederkehrende Aufgabe erledigt wird
export async function completeRecurringTask(taskId: string): Promise<TaskWithRelations | null> {
  // 1. Hole Aufgabe und Recurrence
  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (!task) return null;

  const recurrence = await getTaskRecurrence(taskId);
  if (!recurrence) return null;

  // 2. Prüfe ob Wiederholung beendet werden soll
  const newCompletedCount = recurrence.completed_count + 1;
  
  if (recurrence.end_after_count && newCompletedCount >= recurrence.end_after_count) {
    // Wiederholung beenden
    await deleteTaskRecurrence(taskId);
    return null;
  }

  if (recurrence.end_date) {
    const endDate = new Date(recurrence.end_date);
    const today = new Date();
    if (today >= endDate) {
      // Wiederholung beenden
      await deleteTaskRecurrence(taskId);
      return null;
    }
  }

  // 3. Berechne nächstes Fälligkeitsdatum
  const currentDue = task.due_date || new Date().toISOString().split("T")[0];
  const nextDueDate = calculateNextDueDate(
    currentDue,
    recurrence.recurrence_type,
    recurrence.interval_value,
    recurrence.weekdays,
    recurrence.month_day
  );

  // 4. Erstelle neue Aufgabe
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: newTask, error: createError } = await supabase
    .from("tasks")
    .insert({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: "todo",
      due_date: nextDueDate,
      section_id: task.section_id,
      parent_task_id: task.parent_task_id,
      created_by: user?.id || task.created_by,
      is_recurring: true,
    })
    .select()
    .single();

  if (createError || !newTask) {
    console.error("Error creating recurring task:", createError);
    return null;
  }

  // 5. Kopiere Projekt-Verknüpfungen
  const { data: taskProjects } = await supabase
    .from("task_projects")
    .select("project_id")
    .eq("task_id", taskId);

  if (taskProjects && taskProjects.length > 0) {
    await supabase
      .from("task_projects")
      .insert(taskProjects.map(tp => ({
        task_id: newTask.id,
        project_id: tp.project_id,
      })));
  }

  // 6. Kopiere Assignees
  const { data: assignees } = await supabase
    .from("task_assignees")
    .select("user_id, assigned_by")
    .eq("task_id", taskId);

  if (assignees && assignees.length > 0) {
    await supabase
      .from("task_assignees")
      .insert(assignees.map(a => ({
        task_id: newTask.id,
        user_id: a.user_id,
        assigned_by: a.assigned_by,
      })));
  }

  // 7. Kopiere Labels
  const { data: labels } = await supabase
    .from("task_labels")
    .select("label_id")
    .eq("task_id", taskId);

  if (labels && labels.length > 0) {
    await supabase
      .from("task_labels")
      .insert(labels.map(l => ({
        task_id: newTask.id,
        label_id: l.label_id,
      })));
  }

  // 8. Verschiebe Recurrence zur neuen Aufgabe
  await supabase
    .from("task_recurrence")
    .update({
      task_id: newTask.id,
      completed_count: newCompletedCount,
      next_due_date: nextDueDate,
      updated_at: new Date().toISOString(),
    })
    .eq("task_id", taskId);

  // 9. Entferne recurring flag von alter Aufgabe
  await supabase
    .from("tasks")
    .update({ is_recurring: false })
    .eq("id", taskId);

  return newTask as TaskWithRelations;
}










































































