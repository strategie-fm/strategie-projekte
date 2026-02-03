# API-Referenz

Dieses Dokument dokumentiert alle Funktionen aus `src/lib/database.ts`, die als interne API für Datenbankoperationen dienen.

## Übersicht

Alle Funktionen kommunizieren mit Supabase und sind asynchron. Sie geben entweder die angeforderten Daten oder `null`/`false` bei Fehlern zurück.

---

## Projects

### getProjects

Lädt alle Projekte des aktuellen Benutzers.

```typescript
async function getProjects(): Promise<Project[]>
```

**Rückgabe:** Array von Projekten, nach Position sortiert. Archivierte Projekte werden ausgeschlossen.

**Beispiel:**
```typescript
const projects = await getProjects();
// [{ id: "...", name: "Projekt A", color: "#183c6c", ... }]
```

---

### getProject

Lädt ein einzelnes Projekt anhand der ID.

```typescript
async function getProject(id: string): Promise<Project | null>
```

**Parameter:**
| Name | Typ | Beschreibung |
|------|-----|--------------|
| `id` | `string` | Projekt-UUID |

**Rückgabe:** Das Projekt oder `null`, wenn nicht gefunden.

---

### createProject

Erstellt ein neues Projekt.

```typescript
async function createProject(project: {
  name: string;
  description?: string;
  color?: string;
}): Promise<Project | null>
```

**Parameter:**
| Name | Typ | Beschreibung |
|------|-----|--------------|
| `name` | `string` | Projektname (erforderlich) |
| `description` | `string` | Beschreibung (optional) |
| `color` | `string` | Hex-Farbe (Default: `#183c6c`) |

**Rückgabe:** Das erstellte Projekt oder `null` bei Fehler.

---

### updateProject

Aktualisiert ein bestehendes Projekt.

```typescript
async function updateProject(
  id: string,
  updates: Partial<Pick<Project, "name" | "description" | "color" | "position">>
): Promise<Project | null>
```

**Parameter:**
| Name | Typ | Beschreibung |
|------|-----|--------------|
| `id` | `string` | Projekt-UUID |
| `updates` | `object` | Zu aktualisierende Felder |

---

### deleteProject

Löscht ein Projekt.

```typescript
async function deleteProject(id: string): Promise<boolean>
```

**Rückgabe:** `true` bei Erfolg, `false` bei Fehler.

---

## Tasks

### getTasks

Lädt alle Aufgaben des Benutzers (nur Hauptaufgaben, keine Subtasks).

```typescript
async function getTasks(): Promise<TaskWithRelations[]>
```

**Rückgabe:** Array von Aufgaben mit Projekten, Labels und Subtask-Anzahl.

---

### getTasksByProject

Lädt alle Aufgaben eines bestimmten Projekts.

```typescript
async function getTasksByProject(projectId: string): Promise<TaskWithRelations[]>
```

**Parameter:**
| Name | Typ | Beschreibung |
|------|-----|--------------|
| `projectId` | `string` | Projekt-UUID |

---

### getInboxTasks

Lädt alle Aufgaben ohne Projektzuordnung.

```typescript
async function getInboxTasks(): Promise<TaskWithRelations[]>
```

**Rückgabe:** Eigene Aufgaben ohne `task_projects`-Eintrag.

---

### createTask

Erstellt eine neue Aufgabe.

```typescript
async function createTask(task: {
  title: string;
  description?: string;
  priority?: Task["priority"];
  status?: Task["status"];
  due_date?: string;
  project_id?: string;
  section_id?: string;
}): Promise<Task | null>
```

**Parameter:**
| Name | Typ | Beschreibung |
|------|-----|--------------|
| `title` | `string` | Aufgabentitel (erforderlich) |
| `description` | `string` | Beschreibung |
| `priority` | `"p1"` \| `"p2"` \| `"p3"` \| `"p4"` | Priorität (Default: `p4`) |
| `status` | `"todo"` \| `"in_progress"` \| `"done"` | Status (Default: `todo`) |
| `due_date` | `string` | Fälligkeitsdatum (ISO-Format) |
| `project_id` | `string` | Projekt-UUID zur Verknüpfung |
| `section_id` | `string` | Sektion-UUID |

---

### updateTask

Aktualisiert eine Aufgabe.

```typescript
async function updateTask(
  id: string,
  updates: Partial<Pick<Task, "title" | "description" | "status" | "priority" | "due_date" | "completed_at" | "position" | "section_id">>
): Promise<Task | null>
```

Setzt automatisch `updated_at` und `updated_by`.

---

### toggleTaskComplete

Schnelles Umschalten des Erledigt-Status.

```typescript
async function toggleTaskComplete(id: string, completed: boolean): Promise<Task | null>
```

**Parameter:**
| Name | Typ | Beschreibung |
|------|-----|--------------|
| `id` | `string` | Aufgaben-UUID |
| `completed` | `boolean` | `true` = erledigt, `false` = offen |

Setzt `status` auf `done`/`todo` und `completed_at` entsprechend.

---

### deleteTask

Löscht eine Aufgabe.

```typescript
async function deleteTask(id: string): Promise<boolean>
```

---

### searchTasks

Durchsucht Aufgaben nach Titel und Beschreibung.

```typescript
async function searchTasks(query: string): Promise<TaskWithRelations[]>
```

**Parameter:**
| Name | Typ | Beschreibung |
|------|-----|--------------|
| `query` | `string` | Suchbegriff (case-insensitive) |

**Rückgabe:** Maximal 50 Ergebnisse, neueste zuerst.

---

## Subtasks

### getSubtasks

Lädt alle Unteraufgaben einer Hauptaufgabe.

```typescript
async function getSubtasks(parentTaskId: string): Promise<Task[]>
```

---

### createSubtask

Erstellt eine neue Unteraufgabe.

```typescript
async function createSubtask(parentTaskId: string, title: string): Promise<Task | null>
```

**Parameter:**
| Name | Typ | Beschreibung |
|------|-----|--------------|
| `parentTaskId` | `string` | ID der übergeordneten Aufgabe |
| `title` | `string` | Subtask-Titel |

---

### getSubtaskCount

Lädt die Subtask-Statistik für mehrere Aufgaben.

```typescript
async function getSubtaskCount(taskIds: string[]): Promise<Record<string, { total: number; completed: number }>>
```

**Rückgabe:** Map von Task-ID zu `{ total, completed }`.

---

## Labels

### getLabels

Lädt alle Labels des Benutzers.

```typescript
async function getLabels(): Promise<Label[]>
```

---

### createLabel

Erstellt ein neues Label.

```typescript
async function createLabel(label: {
  name: string;
  color?: string;
}): Promise<Label | null>
```

**Parameter:**
| Name | Typ | Beschreibung |
|------|-----|--------------|
| `name` | `string` | Label-Name |
| `color` | `string` | Hex-Farbe (Default: `#6b7280`) |

---

### deleteLabel

Löscht ein Label.

```typescript
async function deleteLabel(id: string): Promise<boolean>
```

---

### addLabelToTask

Fügt ein Label zu einer Aufgabe hinzu.

```typescript
async function addLabelToTask(taskId: string, labelId: string): Promise<boolean>
```

---

### removeLabelFromTask

Entfernt ein Label von einer Aufgabe.

```typescript
async function removeLabelFromTask(taskId: string, labelId: string): Promise<boolean>
```

---

### getTaskLabels

Lädt alle Labels einer Aufgabe.

```typescript
async function getTaskLabels(taskId: string): Promise<Label[]>
```

---

## Comments

### getComments

Lädt alle Kommentare einer Aufgabe.

```typescript
async function getComments(taskId: string): Promise<Comment[]>
```

**Rückgabe:** Kommentare mit `user`-Profil, chronologisch sortiert.

---

### createComment

Erstellt einen neuen Kommentar.

```typescript
async function createComment(taskId: string, content: string): Promise<Comment | null>
```

---

### deleteComment

Löscht einen Kommentar.

```typescript
async function deleteComment(id: string): Promise<boolean>
```

---

## Sections

### getSections

Lädt alle Sektionen eines Projekts.

```typescript
async function getSections(projectId: string): Promise<Section[]>
```

**Rückgabe:** Nach Position sortiert.

---

### createSection

Erstellt eine neue Sektion.

```typescript
async function createSection(projectId: string, name: string): Promise<Section | null>
```

Position wird automatisch ans Ende gesetzt.

---

### updateSection

Aktualisiert eine Sektion.

```typescript
async function updateSection(
  id: string,
  updates: Partial<Pick<Section, "name" | "position">>
): Promise<Section | null>
```

---

### deleteSection

Löscht eine Sektion.

```typescript
async function deleteSection(id: string): Promise<boolean>
```

---

### moveTaskToSection

Verschiebt eine Aufgabe in eine andere Sektion.

```typescript
async function moveTaskToSection(taskId: string, sectionId: string | null): Promise<boolean>
```

**Parameter:**
| Name | Typ | Beschreibung |
|------|-----|--------------|
| `taskId` | `string` | Aufgaben-UUID |
| `sectionId` | `string \| null` | Ziel-Sektion oder `null` für keine Sektion |

---

## Project Progress

### getProjectProgress

Lädt den Fortschritt eines Projekts.

```typescript
async function getProjectProgress(projectId: string): Promise<{ total: number; completed: number }>
```

---

### getAllProjectsProgress

Lädt den Fortschritt aller zugänglichen Projekte.

```typescript
async function getAllProjectsProgress(): Promise<Record<string, { total: number; completed: number }>>
```

**Rückgabe:** Map von Projekt-ID zu Fortschritts-Objekt.

---

## Profiles

### getProfiles

Lädt alle Benutzerprofile.

```typescript
async function getProfiles(): Promise<Profile[]>
```

---

### getProfile

Lädt ein einzelnes Profil.

```typescript
async function getProfile(userId: string): Promise<Profile | null>
```

---

## Task Assignees

### getTaskAssignees

Lädt alle Zuweisungen einer Aufgabe.

```typescript
async function getTaskAssignees(taskId: string): Promise<TaskAssignee[]>
```

**Rückgabe:** Mit eingebettetem `profile`.

---

### assignTask

Weist eine Aufgabe einem Benutzer zu.

```typescript
async function assignTask(taskId: string, userId: string): Promise<TaskAssignee | null>
```

---

### unassignTask

Entfernt eine Zuweisung.

```typescript
async function unassignTask(taskId: string, userId: string): Promise<boolean>
```

---

## Teams

### getTeams

Lädt alle Teams.

```typescript
async function getTeams(): Promise<Team[]>
```

---

### getTeam

Lädt ein Team mit allen Mitgliedern.

```typescript
async function getTeam(teamId: string): Promise<TeamWithMembers | null>
```

---

### createTeam

Erstellt ein neues Team.

```typescript
async function createTeam(name: string, description?: string, color?: string): Promise<Team | null>
```

Der Ersteller wird automatisch als `owner` hinzugefügt.

---

### updateTeam

Aktualisiert ein Team.

```typescript
async function updateTeam(teamId: string, updates: Partial<Team>): Promise<Team | null>
```

---

### deleteTeam

Löscht ein Team.

```typescript
async function deleteTeam(teamId: string): Promise<boolean>
```

---

## Team Members

### addTeamMember

Fügt einen Benutzer zu einem Team hinzu.

```typescript
async function addTeamMember(teamId: string, userId: string, role: TeamRole = "member"): Promise<TeamMember | null>
```

**TeamRole:** `"owner"` | `"admin"` | `"member"` | `"viewer"`

---

### removeTeamMember

Entfernt einen Benutzer aus einem Team.

```typescript
async function removeTeamMember(teamId: string, userId: string): Promise<boolean>
```

---

### updateTeamMemberRole

Ändert die Rolle eines Team-Mitglieds.

```typescript
async function updateTeamMemberRole(teamId: string, userId: string, role: TeamRole): Promise<boolean>
```

---

### getUserTeams

Lädt alle Teams eines Benutzers.

```typescript
async function getUserTeams(userId: string): Promise<Team[]>
```

---

## Project Team Access

### getProjectTeamAccess

Lädt alle Team-Zugriffsberechtigungen eines Projekts.

```typescript
async function getProjectTeamAccess(projectId: string): Promise<ProjectTeamAccess[]>
```

---

### grantProjectAccess

Gewährt einem Team Zugriff auf ein Projekt.

```typescript
async function grantProjectAccess(projectId: string, teamId: string, accessLevel: AccessLevel = "view"): Promise<ProjectTeamAccess | null>
```

**AccessLevel:** `"view"` | `"edit"` | `"admin"`

---

### updateProjectAccess

Ändert die Zugriffsebene.

```typescript
async function updateProjectAccess(projectId: string, teamId: string, accessLevel: AccessLevel): Promise<boolean>
```

---

### revokeProjectAccess

Entzieht einem Team den Zugriff.

```typescript
async function revokeProjectAccess(projectId: string, teamId: string): Promise<boolean>
```

---

## Task Recurrence

### getTaskRecurrence

Lädt die Wiederholungskonfiguration einer Aufgabe.

```typescript
async function getTaskRecurrence(taskId: string): Promise<TaskRecurrence | null>
```

---

### createTaskRecurrence

Erstellt eine Wiederholungskonfiguration.

```typescript
async function createTaskRecurrence(recurrence: {
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
}): Promise<TaskRecurrence | null>
```

**RecurrenceType:** `"daily"` | `"weekly"` | `"monthly"` | `"yearly"` | `"custom"`

Setzt automatisch `is_recurring` auf `true` bei der Aufgabe.

---

### updateTaskRecurrence

Aktualisiert eine Wiederholungskonfiguration.

```typescript
async function updateTaskRecurrence(
  taskId: string,
  updates: Partial<Omit<TaskRecurrence, "id" | "task_id" | "created_at" | "updated_at">>
): Promise<TaskRecurrence | null>
```

---

### deleteTaskRecurrence

Löscht eine Wiederholungskonfiguration.

```typescript
async function deleteTaskRecurrence(taskId: string): Promise<boolean>
```

Setzt automatisch `is_recurring` auf `false`.

---

### calculateNextDueDate

Berechnet das nächste Fälligkeitsdatum.

```typescript
function calculateNextDueDate(
  currentDueDate: string,
  recurrenceType: RecurrenceType,
  intervalValue: number,
  weekdays?: number[] | null,
  monthDay?: number | null
): string
```

**Rückgabe:** ISO-Datumsstring (YYYY-MM-DD).

---

### completeRecurringTask

Schließt eine wiederkehrende Aufgabe ab und erstellt die nächste.

```typescript
async function completeRecurringTask(taskId: string): Promise<TaskWithRelations | null>
```

**Ablauf:**
1. Prüft ob Wiederholung beendet werden soll
2. Berechnet nächstes Fälligkeitsdatum
3. Erstellt neue Aufgabe mit gleichen Eigenschaften
4. Kopiert Projekt-Verknüpfungen, Assignees, Labels
5. Verschiebt Recurrence zur neuen Aufgabe
6. Entfernt `is_recurring` von alter Aufgabe

**Rückgabe:** Die neu erstellte Aufgabe oder `null`.

---

## Fehlerbehandlung

Alle Funktionen loggen Fehler via `console.error` und geben sichere Defaults zurück:

- `null` für Einzelobjekte
- `[]` für Arrays
- `false` für Erfolgsoperationen
- `{}` für Maps/Records

```typescript
// Beispiel-Fehlerbehandlung in einer Funktion
if (error) {
  console.error("Error fetching tasks:", error);
  return [];
}
```
