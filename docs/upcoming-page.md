# Anstehend-Seite (Upcoming View)

## Übersicht

Die Anstehend-Seite (`src/app/upcoming/page.tsx`) zeigt alle Aufgaben mit einem Fälligkeitsdatum ab heute an. Die Seite bietet flexible Gruppierungsoptionen (Datum, Priorität, Projekt) und umfangreiche Filtermöglichkeiten.

**Besonderheit:** Nur Aufgaben mit `due_date >= heute` werden angezeigt.

## Layout

### Mit ausgewählter Aufgabe (Zwei-Spalten-Layout)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Header: "Anstehend" + "Kommende Aufgaben"                               │
├─────────────────────────────────────────────────────────────────────────┤
│ FilterBar: [Datum|Priorität|Projekt] │ Priorität │ Status │ Zugewiesen │
├───────────────────────────────────────┬─────────────────────────────────┤
│ Linke Spalte (flex-1)                 │ Rechte Spalte (max 500px)       │
│                                       │                                 │
│ ┌───────────────────────────────────┐ │ ┌─────────────────────────────┐ │
│ │ Gruppierte Sektionen              │ │ │ TaskDetailView        [X]   │ │
│ │ (je nach Gruppierung)             │ │ │                             │ │
│ │                                   │ │ │ - Titel (editierbar)        │ │
│ │ Datums-Gruppierung (Standard):    │ │ │ - Projekt/Wiederkehrend     │ │
│ │ - Heute                           │ │ │ - Tab-Navigation            │ │
│ │ - Morgen                          │ │ │   - Aufgabe                 │ │
│ │ - Mittwoch, 12. Februar           │ │ │   - Unteraufgaben           │ │
│ │ - Donnerstag, 13. Februar         │ │ │   - Kommentare              │ │
│ │ - ...                             │ │ │                             │ │
│ │                                   │ │ │ Aufgabe-Tab:                │ │
│ │ Prioritäts-Gruppierung:           │ │ │ - Aufgabenliste             │ │
│ │ - P1 Dringend (rot)               │ │ │ - Datum/Wiederholung        │ │
│ │ - P2 Hoch (orange)                │ │ │ - Status/Priorität          │ │
│ │ - P3 Normal (blau)                │ │ │ - Zugewiesen                │ │
│ │ - P4 Niedrig (grau)               │ │ │ - Labels                    │ │
│ │                                   │ │ │ - Beschreibung              │ │
│ │ Projekt-Gruppierung:              │ │ └─────────────────────────────┘ │
│ │ - [Projekt A] (alphabetisch)      │ │                                 │
│ │ - [Projekt B]                     │ │                                 │
│ │ - Eingang (Kein Projekt)          │ │                                 │
│ └───────────────────────────────────┘ │                                 │
│                                       │                                 │
│ ┌───────────────────────────────────┐ │                                 │
│ │ Erledigt (optional)               │ │                                 │
│ └───────────────────────────────────┘ │                                 │
│                                       │                                 │
│ ┌───────────────────────────────────┐ │                                 │
│ │ QuickAddTask                      │ │                                 │
│ └───────────────────────────────────┘ │                                 │
└───────────────────────────────────────┴─────────────────────────────────┘
```

### Ohne ausgewählte Aufgabe (Ein-Spalten-Layout)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Header: "Anstehend" + "Kommende Aufgaben"                               │
├─────────────────────────────────────────────────────────────────────────┤
│ FilterBar: [Datum|Priorität|Projekt] │ Priorität │ Status │ Zugewiesen │
├─────────────────────────────────────────────────────────────────────────┤
│ Volle Breite (flex-1)                                                   │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Gruppierte Sektionen (volle Breite)                                 │ │
│ │ - Task Cards mit showProject=true                                   │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ QuickAddTask                                                        │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

## Responsive Verhalten

- **Linke Spalte**: `flex-1` - nimmt den verfügbaren Platz
- **Rechte Spalte** (nur wenn Aufgabe ausgewählt):
  - Bevorzugte Breite: `500px`
  - Minimale Breite: `320px`
  - Kann schrumpfen (`shrink`) bei kleineren Bildschirmen
  - Sticky-Position mit `max-h-[calc(100vh-120px)]`

## Komponenten

### 1. Header
- Titel: "Anstehend"
- Untertitel: "Kommende Aufgaben"

### 2. FilterBar mit Segmented Control

Die FilterBar enthält als erstes Element einen Segmented Control für die Gruppierungsauswahl.

#### Segmented Control (Gruppierung)

```
┌─────────────────────────────────────────────┐
│ [📅 Datum] │ [🚩 Priorität] │ [📁 Projekt]  │
└─────────────────────────────────────────────┘
```

| Gruppierung | Icon | Sektionen |
|-------------|------|-----------|
| Datum (Standard) | Calendar | Heute, Morgen, Wochentage |
| Priorität | Flag | P1 Dringend, P2 Hoch, P3 Normal, P4 Niedrig |
| Projekt | Folder | Projekte alphabetisch, Eingang (Kein Projekt) |

#### Filter-Chips

| Filter | Optionen | Multi-Select |
|--------|----------|--------------|
| Priorität | P1, P2, P3, P4 | Ja |
| Status | Offen, In Arbeit | Ja |
| Zugewiesen | Dynamisch (nur Nutzer mit anstehenden Tasks) | Ja |
| Labels | Dynamisch (nur Labels auf anstehenden Tasks) | Ja |

#### Toggle
- "Erledigte anzeigen (X)" - Zeigt/versteckt erledigte Aufgaben

### 3. Gruppierte Task-Listen

#### Datums-Gruppierung (Standard)

Intelligente Datumslabels:
- **Heute** - Aufgaben für den aktuellen Tag
- **Morgen** - Aufgaben für den nächsten Tag
- **Wochentag, Tag. Monat** - z.B. "Mittwoch, 12. Februar"

SectionHeader-Varianten:
- Heute: `variant="default"` (Primary-Farbe)
- Alle anderen: `variant="info"` (Info-Farbe)

#### Prioritäts-Gruppierung

| Sektion | Variant | Farbe |
|---------|---------|-------|
| Priorität 1 - Dringend | error | Rot |
| Priorität 2 - Hoch | warning | Orange |
| Priorität 3 - Normal | info | Blau |
| Priorität 4 - Niedrig | muted | Grau |

#### Projekt-Gruppierung

- Projekte alphabetisch sortiert (deutsche Locale)
- Jeder Projekt-Header mit `dotColor={project.color}` und `dotShape="square"`
- "Eingang (Kein Projekt)" am Ende mit `variant="muted"`

### 4. SortableTaskItem

Jedes Task-Item wird mit folgenden Props gerendert:

```tsx
<SortableTaskItem
  task={task}
  onUpdate={handleTaskUpdate}
  onClick={handleTaskClick}
  onDelete={handleTaskDelete}
  showProject={true}  // Bei Projekt-Gruppierung: false
  hideDragHandle
  isSelected={selectedTask?.id === task.id}
/>
```

### 5. TaskDetailView

Detailansicht der ausgewählten Aufgabe. Wird nur angezeigt, wenn eine Aufgabe ausgewählt ist.

**Header:**
- Titel (editierbar)
- Löschen-Button mit Bestätigung
- Schließen-Button (X)
- Projekt-Badge (falls vorhanden)
- Wiederkehrend-Badge (falls aktiv)

**Tab-Navigation:**
- Aufgabe (Formulare)
- Unteraufgaben (mit Zähler)
- Kommentare (mit Zähler)

**Aufgabe-Tab Felder:**
1. **Aufgabenliste** (ProjectSelector) - ermöglicht Projekt-Zuweisung/Änderung
2. Datum + Wiederholung (nebeneinander)
3. Status + Priorität (nebeneinander)
4. Zugewiesen
5. Labels
6. Beschreibung (auto-resize)

**Props:**
- `task`: Die ausgewählte Aufgabe
- `onUpdate`: Callback bei Änderungen
- `onDelete`: Callback beim Löschen
- `onClose`: Callback zum Schließen der Ansicht

### 6. QuickAddTask

Schnelleingabe für neue Aufgaben am Ende der Liste.

```tsx
<QuickAddTask onTaskCreated={handleTaskCreated} />
```

### 7. EmptyState

Wird angezeigt wenn keine Aufgaben vorhanden sind:

```tsx
<EmptyState
  icon={CalendarDays}
  title={hasActiveFilters ? "Keine Aufgaben mit diesen Filtern" : "Keine anstehenden Aufgaben"}
  description={hasActiveFilters ? "Passe die Filter an" : "Aufgaben mit Fälligkeitsdatum erscheinen hier"}
/>
```

## State Management

### Lokaler State

```typescript
// Task-Daten
const [allTasks, setAllTasks] = useState<TaskWithRelations[]>([]);
const [completedTasks, setCompletedTasks] = useState<TaskWithRelations[]>([]);
const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);

// Referenzdaten
const [labels, setLabels] = useState<Label[]>([]);
const [profiles, setProfiles] = useState<Profile[]>([]);
const [projects, setProjects] = useState<Project[]>([]);
const [taskAssigneeMap, setTaskAssigneeMap] = useState<Record<string, string[]>>({});

// Filter-State
const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
const [showCompleted, setShowCompleted] = useState(false);

// Gruppierung
const [groupBy, setGroupBy] = useState<GroupBy>("date");

// UI-State
const [loading, setLoading] = useState(true);
```

### Datenfluss

1. `loadTasks(silent?)` lädt Tasks, Labels, Profiles, Projects
2. Tasks werden gefiltert: nur `due_date >= heute` und `status !== 'done'`
3. Erledigte Tasks separat in `completedTasks` gespeichert
4. `filterTasks()` wendet aktive Filter an
5. Gruppierung wird dynamisch basierend auf `groupBy` berechnet

## Event-System

Die Seite reagiert auf folgende Custom Events:

| Event | Auslöser | Reaktion |
|-------|----------|----------|
| `assigneesChanged` | AssigneeSelector | taskAssigneeMap aktualisieren |
| `taskLabelsChanged` | LabelSelector | Tasks neu laden (silent) |
| `taskDateChanged` | Datum-Änderung | Tasks neu laden (silent) |
| `taskProjectChanged` | ProjectSelector | Tasks neu laden (silent) |
| `taskUpdated` | Diverse Änderungen | Tasks neu laden (silent) |

## Handler-Funktionen

### handleTaskClick (Toggle-Verhalten)
```typescript
const handleTaskClick = (task: TaskWithRelations) => {
  if (selectedTask?.id === task.id) {
    setSelectedTask(null);  // Deselektieren
  } else {
    setSelectedTask(task);  // Selektieren
  }
};
```

### handleTaskCreated (Auto-Select)
```typescript
const handleTaskCreated = (task: TaskWithRelations) => {
  loadTasks(true);      // Silent reload
  setSelectedTask(task); // Automatisch auswählen
};
```

### handleResetFilters
```typescript
const handleResetFilters = () => {
  setSelectedPriorities([]);
  setSelectedLabels([]);
  setSelectedStatus([]);
  setSelectedAssignees([]);
  setShowCompleted(false);
};
```

## Datenbank-Funktionen

Die Seite verwendet folgende Funktionen aus `@/lib/database`:

- `getTasks()` - Alle Tasks laden
- `getLabels()` - Alle Labels laden
- `getProfiles()` - Alle Benutzerprofile laden
- `getProjects()` - Alle Projekte laden
- `getTaskAssignees(taskId)` - Zuweisungen für einen Task

## Filter-Logik

Die Filterung erfolgt über `filterTasks()` aus `@/components/filters/TaskFilters`:

```typescript
const filters = {
  priorities: selectedPriorities,
  labels: selectedLabels,
  status: selectedStatus,
  assignees: selectedAssignees,
};

const filteredTasks = filterTasks(allTasks, filters, taskAssigneeMap);
```

Die Filter-Optionen (Labels, Assignees) werden dynamisch aus den vorhandenen Tasks generiert.

## Keyboard Shortcuts

| Taste | Aktion |
|-------|--------|
| `4` | Zur Anstehend-Seite navigieren |
| `g u` | Zur Anstehend-Seite navigieren |

## Unterschiede zu anderen Seiten

| Feature | Anstehend | Heute | Meine Aufgaben | Eingang |
|---------|-----------|-------|----------------|---------|
| Task-Filter | due_date >= heute | due_date <= heute | assigned to me | kein Projekt |
| Gruppierung | Datum/Priorität/Projekt | Überfällig/Heute | Priorität/Datum/Projekt | Priorität/Datum |
| Standard-Gruppierung | Datum | - | Priorität | Priorität |
| showProject | true | true | true | false |

## Verwendete Komponenten

### Layout
- `AppLayout` - Haupt-Layout mit Sidebar
- `Header` - Seitenkopf

### Tasks
- `SortableTaskItem` - Task-Karte
- `TaskDetailView` - Detailansicht
- `QuickAddTask` - Schnelleingabe

### UI
- `FilterBar` / `FilterChips` / `ToggleSwitch` - Filter-UI
- `SectionHeader` / `EmptyState` - UI-Elemente

### Zentrale UI-Komponenten (wiederverwendet)
- `Input` - Texteingabe
- `FormField` / `FormRow` - Formularlayout
- `PrioritySelector` - Prioritätsauswahl (P1-P4)
- `StatusSelector` - Statusauswahl (Offen/In Arbeit/Erledigt)
- `ProjectSelector` - Projekt-/Aufgabenlisten-Auswahl
- `AssigneeSelector` - Personenzuweisung
- `LabelSelector` - Label-Auswahl
- `RecurrenceSelector` - Wiederholungs-Einstellungen

### Externe Bibliotheken
- `lucide-react` - Icons

## Dateien

```
src/
├── app/
│   └── upcoming/
│       └── page.tsx            # Anstehend-Seite
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx       # Layout-Wrapper
│   │   └── Header.tsx          # Seitenkopf
│   ├── tasks/
│   │   ├── SortableTaskItem.tsx    # Task-Karte
│   │   ├── TaskDetailView.tsx      # Detailansicht
│   │   ├── QuickAddTask.tsx        # Schnelleingabe
│   │   ├── SubtaskList.tsx         # Unteraufgaben
│   │   ├── CommentList.tsx         # Kommentare
│   │   ├── ProjectSelector.tsx     # Projekt-Auswahl
│   │   ├── LabelSelector.tsx       # Label-Auswahl
│   │   ├── AssigneeSelector.tsx    # Zuweisungs-Auswahl
│   │   └── RecurrenceSelector.tsx  # Wiederholungs-Auswahl
│   ├── ui/
│   │   ├── FilterBar.tsx           # Filter-Container
│   │   ├── FilterChips.tsx         # Filter-Chips
│   │   ├── ToggleSwitch.tsx        # Toggle für Erledigte
│   │   ├── SectionHeader.tsx       # Sektions-Überschrift
│   │   ├── EmptyState.tsx          # Leerzustand
│   │   ├── Input.tsx               # Texteingabe
│   │   ├── FormField.tsx           # Formular-Feld
│   │   ├── PrioritySelector.tsx    # Prioritäts-Auswahl
│   │   └── StatusSelector.tsx      # Status-Auswahl
│   └── filters/
│       └── TaskFilters.tsx         # Filter-Logik
└── lib/
    └── database.ts                 # Datenbank-Funktionen
```
