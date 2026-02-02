import { supabase } from "./supabase";
import type { Project, Task, TaskWithRelations, Label, Comment, Section } from "@/types/database";

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

  const taskIds = tasks.map(t => t.id);
  
  // Load project links
  const { data: taskProjects } = await supabase
    .from("task_projects")
    .select("task_id, project_id, projects(*)")
    .in("task_id", taskIds);

  // Load subtask counts
  const subtaskCounts = await getSubtaskCount(taskIds);

  // Load labels for all tasks
  const { data: taskLabels } = await supabase
    .from("task_labels")
    .select("task_id, label_id, labels(*)")
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
    
    return {
      ...task,
      projects,
      assignees: [],
      labels,
      subtaskCount: subtaskCounts[task.id] || undefined,
    };
  });
}

export async function getTasksByProject(projectId: string): Promise<TaskWithRelations[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: taskProjectLinks, error: linkError } = await supabase
    .from("task_projects")
    .select("task_id")
    .eq("project_id", projectId);

  if (linkError || !taskProjectLinks || taskProjectLinks.length === 0) {
    return [];
  }

  const taskIds = taskProjectLinks.map(tp => tp.task_id);

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

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  // Load subtask counts
  const subtaskCounts = await getSubtaskCount(taskIds);

  // Load labels
  const { data: taskLabels } = await supabase
    .from("task_labels")
    .select("task_id, label_id, labels(*)")
    .in("task_id", taskIds);

  return (tasks || []).map((task) => {
    const labelLinks = taskLabels?.filter(tl => tl.task_id === task.id) || [];
    const labels: Label[] = [];
    
    labelLinks.forEach(tl => {
      if (tl.labels && typeof tl.labels === 'object' && !Array.isArray(tl.labels)) {
        labels.push(tl.labels as unknown as Label);
      }
    });

    return {
      ...task,
      projects: project ? [project] : [],
      assignees: [],
      labels,
      subtaskCount: subtaskCounts[task.id] || undefined,
      section_id: task.section_id,
    };
  });
}

export async function getInboxTasks(): Promise<TaskWithRelations[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

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

  const taskIds = tasks.map(t => t.id);
  
  const { data: taskProjects } = await supabase
    .from("task_projects")
    .select("task_id")
    .in("task_id", taskIds);

  const tasksWithProjects = new Set(taskProjects?.map(tp => tp.task_id) || []);
  const inboxTasks = tasks.filter(task => !tasksWithProjects.has(task.id));

  if (inboxTasks.length === 0) {
    return [];
  }

  const inboxTaskIds = inboxTasks.map(t => t.id);

  // Load subtask counts
  const subtaskCounts = await getSubtaskCount(inboxTaskIds);

  // Load labels
  const { data: taskLabels } = await supabase
    .from("task_labels")
    .select("task_id, label_id, labels(*)")
    .in("task_id", inboxTaskIds);

  return inboxTasks.map((task) => {
    const labelLinks = taskLabels?.filter(tl => tl.task_id === task.id) || [];
    const labels: Label[] = [];
    
    labelLinks.forEach(tl => {
      if (tl.labels && typeof tl.labels === 'object' && !Array.isArray(tl.labels)) {
        labels.push(tl.labels as unknown as Label);
      }
    });

    return {
      ...task,
      projects: [],
      assignees: [],
      labels,
      subtaskCount: subtaskCounts[task.id] || undefined,
    };
  });
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
    
    return {
      ...task,
      projects,
      assignees: [],
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
  const { error } = await supabase
    .from("tasks")
    .update({ section_id: sectionId, updated_at: new Date().toISOString() })
    .eq("id", taskId);

  if (error) {
    console.error("Error moving task to section:", error);
    return false;
  }

  return true;
}