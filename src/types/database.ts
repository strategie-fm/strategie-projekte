export type UserRole = "admin" | "manager" | "member";
export type TaskStatus = "todo" | "in_progress" | "done" | "archived";
export type TaskPriority = "p1" | "p2" | "p3" | "p4";
export type ProjectRole = "owner" | "editor" | "viewer";
export type RecurrenceType = "daily" | "weekly" | "monthly" | "yearly" | "custom";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  team_id: string | null;
  parent_id: string | null;
  is_inbox: boolean;
  position: number;
  archived_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Section {
  id: string;
  name: string;
  project_id: string;
  position: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done" | "archived";
  priority: "p1" | "p2" | "p3" | "p4";
  due_date: string | null;
  completed_at: string | null;
  position: number;
  parent_task_id: string | null;
  section_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_recurring?: boolean;
}

export interface TaskWithRelations extends Task {
  projects?: Project[];
  assignees?: Profile[];
  labels?: Label[];
  subtasks?: Task[];
  subtaskCount?: {
    total: number;
    completed: number;
  };
}

export interface Label {
  id: string;
  name: string;
  color: string;
  team_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string | null;
  content: string;
  mentions: string[] | null;
  edited_at: string | null;
  created_at: string;
  user?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  task_id: string | null;
  project_id: string | null;
  actor_id: string | null;
  read_at: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskAssignee {
  id: string;
  task_id: string;
  user_id: string;
  assigned_by: string | null;
  assigned_at: string;
  // Joined data
  profile?: Profile;
}