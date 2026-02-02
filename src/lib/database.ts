import { supabase } from "./supabase";
import type { Project, Task, TaskWithRelations, Label, Comment } from "@/types/database";

// ============================================
// PROJECTS
// ============================================

export async function getProjects(): Promise<Project[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("created_by", user.id)
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

// ============================================
// TASKS
// ============================================

export async function getTasks(): Promise<TaskWithRelations[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Erst nur die Tasks laden
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("created_by", user.id)
    .is("parent_task_id", null)
    .neq("status", "archived")
    .order("position", { ascending: true });

  if (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }

  if (!tasks || tasks.length === 0) {
    return [];
  }

  // Dann die Projekt-Verknüpfungen laden
  const taskIds = tasks.map(t => t.id);
  
  const { data: taskProjects } = await supabase
    .from("task_projects")
    .select("task_id, project_id, projects(*)")
    .in("task_id", taskIds);

  // Tasks mit Projekten kombinieren
  return tasks.map((task) => {
    const projectLinks = taskProjects?.filter(tp => tp.task_id === task.id) || [];
    const projects = projectLinks.map(tp => tp.projects).filter(Boolean);
    
    return {
      ...task,
      projects: projects as Project[],
      assignees: [],
      labels: [],
    };
  });
}

export async function getTasksByProject(projectId: string): Promise<TaskWithRelations[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Erst die Task-IDs für dieses Projekt holen
  const { data: taskProjectLinks, error: linkError } = await supabase
    .from("task_projects")
    .select("task_id")
    .eq("project_id", projectId);

  if (linkError || !taskProjectLinks || taskProjectLinks.length === 0) {
    return [];
  }

  const taskIds = taskProjectLinks.map(tp => tp.task_id);

  // Dann die Tasks laden
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .in("id", taskIds)
    .is("parent_task_id", null)
    .neq("status", "archived")
    .order("position", { ascending: true });

  if (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }

  // Projekt-Info laden
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  return (tasks || []).map((task) => ({
    ...task,
    projects: project ? [project] : [],
    assignees: [],
    labels: [],
  }));
}

export async function getInboxTasks(): Promise<TaskWithRelations[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Alle Tasks des Users laden
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("created_by", user.id)
    .is("parent_task_id", null)
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }

  if (!tasks || tasks.length === 0) {
    return [];
  }

  // Alle Task-Projekt-Verknüpfungen laden
  const taskIds = tasks.map(t => t.id);
  
  const { data: taskProjects } = await supabase
    .from("task_projects")
    .select("task_id")
    .in("task_id", taskIds);

  // Tasks filtern, die KEINE Projekt-Verknüpfung haben
  const tasksWithProjects = new Set(taskProjects?.map(tp => tp.task_id) || []);
  const inboxTasks = tasks.filter(task => !tasksWithProjects.has(task.id));

  return inboxTasks.map((task) => ({
    ...task,
    projects: [],
    assignees: [],
    labels: [],
  }));
}

export async function createTask(task: {
  title: string;
  description?: string;
  priority?: Task["priority"];
  status?: Task["status"];
  due_date?: string;
  project_id?: string;
}): Promise<Task | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Create the task
  const { data: newTask, error: taskError } = await supabase
    .from("tasks")
    .insert({
      title: task.title,
      description: task.description || null,
      priority: task.priority || "p4",
      status: task.status || "todo",
      due_date: task.due_date || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (taskError) {
    console.error("Error creating task:", taskError);
    return null;
  }

  // If project_id provided, link to project
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
  updates: Partial<Pick<Task, "title" | "description" | "priority" | "status" | "due_date" | "completed_at">>
): Promise<Task | null> {
  const { data, error } = await supabase
    .from("tasks")
    .update({ ...updates, updated_at: new Date().toISOString() })
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

export async function searchTasks(query: string): Promise<TaskWithRelations[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !query.trim()) return [];

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("created_by", user.id)
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

  // Load project links
  const taskIds = tasks.map(t => t.id);
  
  const { data: taskProjects } = await supabase
    .from("task_projects")
    .select("task_id, project_id, projects(*)")
    .in("task_id", taskIds);

  return tasks.map((task) => {
    const projectLinks = taskProjects?.filter(tp => tp.task_id === task.id) || [];
    const projects = projectLinks.map(tp => tp.projects).filter(Boolean);
    
    return {
      ...task,
      projects: projects as Project[],
      assignees: [],
      labels: [],
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

  return (data || []).map(tl => tl.labels).filter(Boolean) as Label[];
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