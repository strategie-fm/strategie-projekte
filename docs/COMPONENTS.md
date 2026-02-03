# Komponenten

Dieses Dokument beschreibt die wichtigsten React-Komponenten der STRATEGIE Projekte Anwendung und ihre Props.

## Verzeichnisstruktur

```
src/components/
├── charts/
│   └── DonutChart.tsx
├── filters/
│   └── TaskFilters.tsx
├── layout/
│   ├── Header.tsx
│   └── Sidebar.tsx
├── projects/
│   ├── ProjectSettingsModal.tsx
│   └── ProjectTeamAccess.tsx
├── providers/
│   ├── AuthProvider.tsx
│   └── KeyboardShortcuts.tsx
├── sections/
│   ├── DroppableSection.tsx
│   └── SectionList.tsx
├── tasks/
│   ├── AssigneeSelector.tsx
│   ├── CommentList.tsx
│   ├── LabelSelector.tsx
│   ├── QuickAddTask.tsx
│   ├── QuickAddTaskModal.tsx
│   ├── RecurrenceSelector.tsx
│   ├── SortableTaskItem.tsx
│   ├── SortableTaskList.tsx
│   ├── SubtaskList.tsx
│   ├── TaskDetailModal.tsx
│   ├── TaskDetailPanel.tsx
│   └── TaskItem.tsx
└── ui/
    ├── KeyboardShortcutsHelp.tsx
    └── Modal.tsx
```

---

## Layout-Komponenten

### Sidebar

**Datei:** `src/components/layout/Sidebar.tsx`

Haupt-Navigation der Anwendung mit resizable Breite.

```typescript
function Sidebar(): JSX.Element
```

**Features:**
- Navigationslinks zu allen Hauptansichten
- Projektliste mit Fortschrittsanzeige
- Quick-Add-Button für neue Aufgaben
- Neues Projekt erstellen
- Logout-Funktion
- Resizable (200-400px)
- Keyboard Shortcuts

**State:**
- `projects` - Liste aller Projekte
- `projectProgress` - Fortschrittsdaten pro Projekt
- `width` - Aktuelle Breite (localStorage)
- `showQuickAdd` - Quick-Add-Modal sichtbar

**Events:**
- Empfängt: `projectsUpdated`, `taskUpdated`, `openNewTaskModal`
- Sendet: `taskCreated`

---

### Header

**Datei:** `src/components/layout/Header.tsx`

Seiten-Header mit Titel und optionalen Aktionen.

```typescript
interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

function Header({ title, subtitle, actions }: HeaderProps): JSX.Element
```

**Props:**
| Prop | Typ | Beschreibung |
|------|-----|--------------|
| `title` | `string` | Hauptüberschrift |
| `subtitle` | `string` | Optionale Unterzeile |
| `actions` | `ReactNode` | Optionale Aktions-Buttons |

---

## Provider-Komponenten

### AuthProvider

**Datei:** `src/components/providers/AuthProvider.tsx`

Verwaltet Authentifizierungsstatus und schützt Routen.

```typescript
interface AuthProviderProps {
  children: React.ReactNode;
}

function AuthProvider({ children }: AuthProviderProps): JSX.Element
```

**Funktionalität:**
- Prüft Session beim Start
- Reagiert auf Auth-Änderungen
- Redirect zu `/login` ohne Session
- Redirect zu `/` nach Login
- Zeigt Lade-Spinner während Prüfung

**Öffentliche Routen:**
- `/login`
- `/register`
- `/forgot-password`

---

### KeyboardShortcutsProvider

**Datei:** `src/components/providers/KeyboardShortcuts.tsx`

Registriert globale Tastaturkürzel.

```typescript
function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }): JSX.Element
```

**Registrierte Shortcuts:**
| Taste | Event |
|-------|-------|
| `?` | Öffnet Shortcuts-Hilfe |

---

## Task-Komponenten

### TaskItem

**Datei:** `src/components/tasks/TaskItem.tsx`

Einzelne Aufgabe in einer Liste.

```typescript
interface TaskItemProps {
  task: TaskWithRelations;
  onToggle: (id: string, completed: boolean) => void;
  onClick: (task: TaskWithRelations) => void;
  showProject?: boolean;
}

function TaskItem({ task, onToggle, onClick, showProject }: TaskItemProps): JSX.Element
```

**Props:**
| Prop | Typ | Beschreibung |
|------|-----|--------------|
| `task` | `TaskWithRelations` | Aufgaben-Daten |
| `onToggle` | `function` | Checkbox-Handler |
| `onClick` | `function` | Klick-Handler |
| `showProject` | `boolean` | Projekt-Badge anzeigen |

**Darstellung:**
- Checkbox für Status
- Titel mit Prioritätskennzeichnung
- Fälligkeitsdatum (farbig bei überfällig)
- Projekt-Badge (optional)
- Labels
- Subtask-Anzeige
- Wiederkehrend-Icon

---

### TaskDetailPanel

**Datei:** `src/components/tasks/TaskDetailPanel.tsx`

Sliding Panel für Aufgabendetails.

```typescript
interface TaskDetailPanelProps {
  task: TaskWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (task: TaskWithRelations) => void;
  onDelete: (taskId: string) => void;
  onNewRecurringTask?: (task: TaskWithRelations) => void;
}

function TaskDetailPanel(props: TaskDetailPanelProps): JSX.Element | null
```

**Features:**
- Titel-Bearbeitung (Auto-Save)
- Beschreibung
- Fälligkeitsdatum
- Prioritäts-Buttons
- Status-Dropdown
- Sektions-Auswahl
- Wiederholungs-Selector
- Assignee-Selector
- Subtasks
- Labels
- Kommentare
- Löschen-Dialog

---

### QuickAddTask

**Datei:** `src/components/tasks/QuickAddTask.tsx`

Formular zum schnellen Erstellen einer Aufgabe.

```typescript
interface QuickAddTaskProps {
  projectId?: string;
  sectionId?: string;
  onTaskCreated?: () => void;
}

function QuickAddTask({ projectId, sectionId, onTaskCreated }: QuickAddTaskProps): JSX.Element
```

**Props:**
| Prop | Typ | Beschreibung |
|------|-----|--------------|
| `projectId` | `string` | Vorausgewähltes Projekt |
| `sectionId` | `string` | Vorausgewählte Sektion |
| `onTaskCreated` | `function` | Callback nach Erstellung |

**Features:**
- Titel-Eingabe
- Fälligkeitsdatum
- Prioritäts-Auswahl
- Projekt-Auswahl

---

### RecurrenceSelector

**Datei:** `src/components/tasks/RecurrenceSelector.tsx`

Dropdown zur Konfiguration wiederkehrender Aufgaben.

```typescript
interface RecurrenceSelectorProps {
  taskId: string;
  dueDate: string | null;
  onRecurrenceChange?: (recurrence: TaskRecurrence | null) => void;
}

function RecurrenceSelector(props: RecurrenceSelectorProps): JSX.Element
```

**Optionen:**
- Keine Wiederholung
- Täglich
- Wöchentlich
- Monatlich
- Jährlich
- Benutzerdefiniert (Modal)

**Benutzerdefinierte Einstellungen:**
- Intervall (alle X Tage/Wochen/...)
- Wochentage (für wöchentlich)
- Monatstag (für monatlich)
- Endbedingung (nie/Datum/Anzahl)

---

### SubtaskList

**Datei:** `src/components/tasks/SubtaskList.tsx`

Liste der Unteraufgaben einer Hauptaufgabe.

```typescript
interface SubtaskListProps {
  parentTaskId: string;
}

function SubtaskList({ parentTaskId }: SubtaskListProps): JSX.Element
```

**Features:**
- Laden bestehender Subtasks
- Neuen Subtask hinzufügen
- Checkbox zum Erledigen
- Löschen per Hover-Button

---

### AssigneeSelector

**Datei:** `src/components/tasks/AssigneeSelector.tsx`

Benutzer einer Aufgabe zuweisen.

```typescript
interface AssigneeSelectorProps {
  taskId: string;
}

function AssigneeSelector({ taskId }: AssigneeSelectorProps): JSX.Element
```

**Features:**
- Anzeige aktueller Assignees (Avatare)
- Dropdown zur Auswahl
- Mehrfachauswahl möglich
- Entfernen per Klick

---

### LabelSelector

**Datei:** `src/components/tasks/LabelSelector.tsx`

Labels einer Aufgabe verwalten.

```typescript
interface LabelSelectorProps {
  taskId: string;
  onLabelsChange?: (labels: Label[]) => void;
}

function LabelSelector({ taskId, onLabelsChange }: LabelSelectorProps): JSX.Element
```

**Features:**
- Anzeige zugewiesener Labels
- Dropdown zur Auswahl
- Neues Label erstellen
- Label entfernen

---

### CommentList

**Datei:** `src/components/tasks/CommentList.tsx`

Kommentare einer Aufgabe anzeigen und erstellen.

```typescript
interface CommentListProps {
  taskId: string;
}

function CommentList({ taskId }: CommentListProps): JSX.Element
```

**Features:**
- Laden bestehender Kommentare
- Eingabefeld für neue Kommentare
- Autor-Avatar und Name
- Relative Zeitangabe
- Löschen eigener Kommentare

---

### SortableTaskList

**Datei:** `src/components/tasks/SortableTaskList.tsx`

Sortierbare Aufgabenliste mit Drag & Drop.

```typescript
interface SortableTaskListProps {
  tasks: TaskWithRelations[];
  onToggle: (id: string, completed: boolean) => void;
  onClick: (task: TaskWithRelations) => void;
  onReorder?: (tasks: TaskWithRelations[]) => void;
  showProject?: boolean;
}

function SortableTaskList(props: SortableTaskListProps): JSX.Element
```

Verwendet `@dnd-kit/sortable` für Drag & Drop.

---

## Projekt-Komponenten

### ProjectSettingsModal

**Datei:** `src/components/projects/ProjectSettingsModal.tsx`

Modal für Projekteinstellungen.

```typescript
interface ProjectSettingsModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (project: Project) => void;
  onDelete: () => void;
}

function ProjectSettingsModal(props: ProjectSettingsModalProps): JSX.Element
```

**Features:**
- Name bearbeiten
- Beschreibung bearbeiten
- Farbe ändern
- Team-Zugriff verwalten
- Projekt löschen

---

### ProjectTeamAccess

**Datei:** `src/components/projects/ProjectTeamAccess.tsx`

Team-Zugriff für ein Projekt verwalten.

```typescript
interface ProjectTeamAccessProps {
  projectId: string;
}

function ProjectTeamAccess({ projectId }: ProjectTeamAccessProps): JSX.Element
```

**Features:**
- Liste der Teams mit Zugriff
- Zugriffsebene ändern (view/edit/admin)
- Team hinzufügen
- Zugriff entziehen

---

## Sektionen-Komponenten

### SectionList

**Datei:** `src/components/sections/SectionList.tsx`

Verwaltung von Projekt-Sektionen.

```typescript
interface SectionListProps {
  projectId: string;
  tasks: TaskWithRelations[];
  onTaskUpdate: (task: TaskWithRelations) => void;
  onTaskToggle: (id: string, completed: boolean) => void;
  onTaskClick: (task: TaskWithRelations) => void;
}

function SectionList(props: SectionListProps): JSX.Element
```

**Features:**
- Sektionen anzeigen
- Neue Sektion erstellen
- Sektion umbenennen
- Sektion löschen
- Aufgaben in Sektionen gruppieren

---

### DroppableSection

**Datei:** `src/components/sections/DroppableSection.tsx`

Drop-Zone für Aufgaben innerhalb einer Sektion.

```typescript
interface DroppableSectionProps {
  section: Section;
  tasks: TaskWithRelations[];
  // ... weitere Props
}

function DroppableSection(props: DroppableSectionProps): JSX.Element
```

---

## UI-Komponenten

### Modal

**Datei:** `src/components/ui/Modal.tsx`

Wiederverwendbarer Modal-Container.

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

function Modal({ isOpen, onClose, title, children, maxWidth = "md" }: ModalProps): JSX.Element | null
```

**Props:**
| Prop | Typ | Default | Beschreibung |
|------|-----|---------|--------------|
| `isOpen` | `boolean` | - | Sichtbarkeitsstatus |
| `onClose` | `function` | - | Schließen-Handler |
| `title` | `string` | - | Optionaler Titel |
| `children` | `ReactNode` | - | Modal-Inhalt |
| `maxWidth` | `string` | `"md"` | Maximale Breite |

**Features:**
- Backdrop mit Klick zum Schließen
- Escape zum Schließen
- Animierte Ein-/Ausblendung
- Portal-basiert

---

### KeyboardShortcutsHelp

**Datei:** `src/components/ui/KeyboardShortcutsHelp.tsx`

Modal mit Übersicht aller Tastaturkürzel.

```typescript
function KeyboardShortcutsHelp(): JSX.Element
```

Wird durch Drücken von `?` geöffnet.

---

## Chart-Komponenten

### DonutChart

**Datei:** `src/components/charts/DonutChart.tsx`

Kreisdiagramm für Dashboard-Statistiken.

```typescript
interface DonutChartProps {
  size?: number;
  strokeWidth?: number;
  segments: Array<{
    value: number;
    color: string;
    label: string;
  }>;
}

function DonutChart({ size = 100, strokeWidth = 12, segments }: DonutChartProps): JSX.Element
```

**Props:**
| Prop | Typ | Default | Beschreibung |
|------|-----|---------|--------------|
| `size` | `number` | `100` | Durchmesser in Pixel |
| `strokeWidth` | `number` | `12` | Strichstärke |
| `segments` | `Array` | - | Segmente mit Wert, Farbe, Label |

---

### DonutLegend

Legende für DonutChart.

```typescript
interface DonutLegendProps {
  segments: Array<{
    value: number;
    color: string;
    label: string;
  }>;
}

function DonutLegend({ segments }: DonutLegendProps): JSX.Element
```

---

## Filter-Komponenten

### TaskFilters

**Datei:** `src/components/filters/TaskFilters.tsx`

Filter-Leiste für Aufgabenlisten.

```typescript
interface TaskFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  initialFilters?: FilterState;
}

interface FilterState {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  hasLabels?: boolean;
  hasDueDate?: boolean;
}

function TaskFilters({ onFilterChange, initialFilters }: TaskFiltersProps): JSX.Element
```

**Filter-Optionen:**
- Status (todo, in_progress, done)
- Priorität (p1, p2, p3, p4)
- Mit Labels
- Mit Fälligkeitsdatum

---

## Komponenten-Verwendung

### Beispiel: Task erstellen und anzeigen

```tsx
import { QuickAddTask } from "@/components/tasks/QuickAddTask";
import { TaskItem } from "@/components/tasks/TaskItem";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";

function MyTasksPage() {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);

  return (
    <div>
      <QuickAddTask
        onTaskCreated={() => loadTasks()}
      />

      {tasks.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={handleToggle}
          onClick={setSelectedTask}
        />
      ))}

      <TaskDetailPanel
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
```
