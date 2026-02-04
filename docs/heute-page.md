# Heute-Seite (Today View)

## Übersicht

Die Heute-Seite (`src/app/page.tsx`) ist die Hauptansicht der Anwendung. Sie zeigt alle Aufgaben an, die heute oder früher fällig sind, aufgeteilt in drei Kategorien: Überfällig, Heute und Erledigt.

## Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Header: "Heute" + Datum                                         │
├─────────────────────────────────────────────────────────────────┤
│ FilterBar: Priorität | Status | Zugewiesen | Labels | Erledigt  │
├─────────────────────────────────┬───────────────────────────────┤
│ Linke Spalte (flex-1)           │ Rechte Spalte (max 500px)     │
│                                 │                               │
│ ┌─────────────────────────────┐ │ ┌───────────────────────────┐ │
│ │ Überfällig (rot)            │ │ │ TaskDetailView            │ │
│ │ - Task Cards                │ │ │                           │ │
│ └─────────────────────────────┘ │ │ - Titel (editierbar)      │ │
│                                 │ │ - Projekt/Wiederkehrend   │ │
│ ┌─────────────────────────────┐ │ │ - Tab-Navigation          │ │
│ │ Heute                       │ │ │   - Aufgabe               │ │
│ │ - Task Cards                │ │ │   - Unteraufgaben         │ │
│ └─────────────────────────────┘ │ │   - Kommentare            │ │
│                                 │ │                           │ │
│ ┌─────────────────────────────┐ │ │ Aufgabe-Tab:              │ │
│ │ Erledigt (optional)         │ │ │ - Datum/Wiederholung      │ │
│ │ - Task Cards                │ │ │ - Status/Priorität        │ │
│ └─────────────────────────────┘ │ │ - Zugewiesen              │ │
│                                 │ │ - Labels                  │ │
│ ┌─────────────────────────────┐ │ │ - Beschreibung            │ │
│ │ QuickAddTask                │ │ └───────────────────────────┘ │
│ └─────────────────────────────┘ │                               │
└─────────────────────────────────┴───────────────────────────────┘
```

## Responsive Verhalten

- **Linke Spalte**: `flex-1` - nimmt den verfügbaren Platz
- **Rechte Spalte**:
  - Bevorzugte Breite: `500px`
  - Minimale Breite: `320px`
  - Kann schrumpfen (`shrink`) bei kleineren Bildschirmen
  - Sticky-Position mit `max-h-[calc(100vh-120px)]`

## Komponenten

### 1. Header
- Titel: "Heute"
- Untertitel: Aktuelles Datum (z.B. "Mittwoch, 4. Februar 2026")

### 2. FilterBar
Ermöglicht das Filtern der Aufgaben nach:

| Filter | Optionen |
|--------|----------|
| Priorität | P1 (rot), P2 (orange), P3 (blau), P4 (grau) |
| Status | Offen, In Arbeit |
| Zugewiesen | Dynamisch aus Profilen |
| Labels | Dynamisch aus verwendeten Labels |
| Erledigte anzeigen | Toggle (nur wenn erledigte vorhanden) |

### 3. SortableTaskList
Zeigt Aufgaben als sortierbare Liste mit Drag-and-Drop-Unterstützung (via dnd-kit).

**Props:**
- `tasks`: Array der Aufgaben
- `onTasksReorder`: Callback bei Neuordnung
- `onTaskUpdate`: Callback bei Aktualisierung
- `onTaskClick`: Callback bei Klick (öffnet Detail-Ansicht)
- `onTaskDelete`: Callback bei Löschen
- `hideDragHandle`: Versteckt den Drag-Handle
- `selectedTaskId`: ID der ausgewählten Aufgabe
- `isOverdueSection`: Markiert überfällige Aufgaben

### 4. SortableTaskItem
Einzelne Aufgaben-Karte mit:

**Titelzeile:**
- Status-Toggle (Checkbox)
- Aufgabentitel (`font-medium`, 16px)
- Projekt (rechtsbündig mit Farbpunkt)

**Metadaten-Zeile:**
- Fälligkeitsdatum
- Unteraufgaben-Zähler
- Wiederkehrend-Icon
- Prioritäts-Badge
- Zugewiesene Personen (als Text-Badges)
- Labels (farbige Badges)
- Löschen-Button (rechtsbündig, bei Hover)

**Abstände:**
- Zwischen Gruppen: 16px (`gap-4`)
- Innerhalb Gruppen (Assignees/Labels): 4px (`gap-1`)
- Titel zu Metadaten: 8px (`mb-2`)

**Badges:**
- Padding: `px-2.5 py-1`
- Border-Radius: `rounded-lg`
- Schriftgröße: 12px (`text-label-md`)

### 5. TaskDetailView
Detailansicht der ausgewählten Aufgabe.

**Tab-Navigation:**
- Aufgabe (Formulare)
- Unteraufgaben (mit Zähler)
- Kommentare (mit Zähler)

**Aufgabe-Tab Felder:**
1. Datum + Wiederholung (nebeneinander)
2. Status + Priorität (nebeneinander)
3. Zugewiesen
4. Labels
5. Beschreibung (auto-resize)

### 6. QuickAddTask
Schnelleingabe für neue Aufgaben am Ende der Liste.

## State Management

```typescript
// Task-Listen (nach Kategorie)
const [overdueTasks, setOverdueTasks] = useState<TaskWithRelations[]>([]);
const [todayTasks, setTodayTasks] = useState<TaskWithRelations[]>([]);
const [completedTasks, setCompletedTasks] = useState<TaskWithRelations[]>([]);

// UI State
const [loading, setLoading] = useState(true);
const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);

// Filter State
const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
const [showCompleted, setShowCompleted] = useState(false);

// Referenzdaten
const [labels, setLabels] = useState<Label[]>([]);
const [profiles, setProfiles] = useState<Profile[]>([]);
const [taskAssigneeMap, setTaskAssigneeMap] = useState<Record<string, string[]>>({});
```

## Event-System

Die Seite reagiert auf folgende Custom Events:

| Event | Auslöser | Reaktion |
|-------|----------|----------|
| `assigneesChanged` | Zuweisung geändert | Aktualisiert `taskAssigneeMap` |
| `taskLabelsChanged` | Labels geändert | Lädt Aufgaben neu |
| `taskDateChanged` | Datum geändert | Lädt Aufgaben neu (re-sort) |
| `taskUpdated` | Aufgabe aktualisiert | Allgemeine Aktualisierung |

## Datenfluss

```
1. Seite lädt
   ↓
2. loadTasks() - Lädt alle Aufgaben, Labels, Profile
   ↓
3. Aufgaben werden kategorisiert (overdue/today/completed)
   ↓
4. Sortierung: Datum (aufsteigend) → Priorität (P1 zuerst)
   ↓
5. Filter werden angewendet (filterTasks)
   ↓
6. UI wird gerendert
```

## Styling

### Typografie
| Element | Klasse | Größe |
|---------|--------|-------|
| Aufgabentitel | `text-h4 font-medium` | 16px |
| Metadaten | `text-label-md` | 12px |
| Badges | `text-label-md` | 12px |
| Beschreibungsvorschau | `text-caption` | 12px |

### Farben
| Priorität | Badge-Farben |
|-----------|--------------|
| P1 | `bg-error-light text-error` |
| P2 | `bg-warning-light text-warning` |
| P3 | `bg-info-light text-info` |
| P4 | `bg-divider text-text-muted` |

### Task-Karten
- Hintergrund: `bg-surface`
- Border: `border border-border rounded-lg`
- Schatten: `shadow-sm` (hover: `shadow-md`)
- Ausgewählt: `bg-primary-bg/50 border-l-[3px] border-l-primary`
- Überfällig: `border-l-[3px] border-l-error`

## Abhängigkeiten

### Interne Komponenten
- `AppLayout` - Haupt-Layout mit Sidebar
- `Header` - Seitenkopf
- `SortableTaskList` / `SortableTaskItem` - Aufgabenliste
- `TaskDetailView` - Detailansicht
- `QuickAddTask` - Schnelleingabe
- `FilterBar` / `FilterChips` / `ToggleSwitch` - Filter-UI
- `SectionHeader` / `EmptyState` - UI-Elemente

### Externe Bibliotheken
- `@dnd-kit/core` / `@dnd-kit/sortable` - Drag-and-Drop
- `lucide-react` - Icons

### Datenbank-Funktionen
- `getTasks()` - Alle Aufgaben laden
- `getLabels()` - Alle Labels laden
- `getProfiles()` - Alle Benutzerprofile laden
- `getTaskAssignees(taskId)` - Zuweisungen einer Aufgabe

## Dateien

```
src/
├── app/
│   └── page.tsx                    # Diese Seite
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx           # Haupt-Layout
│   │   └── Header.tsx              # Seitenkopf
│   ├── tasks/
│   │   ├── SortableTaskList.tsx    # Drag-Drop-Liste
│   │   ├── SortableTaskItem.tsx    # Task-Karte
│   │   ├── TaskDetailView.tsx      # Detailansicht
│   │   ├── QuickAddTask.tsx        # Schnelleingabe
│   │   ├── SubtaskList.tsx         # Unteraufgaben
│   │   ├── CommentList.tsx         # Kommentare
│   │   ├── LabelSelector.tsx       # Label-Auswahl
│   │   ├── AssigneeSelector.tsx    # Zuweisungs-Auswahl
│   │   └── RecurrenceSelector.tsx  # Wiederholungs-Auswahl
│   ├── ui/
│   │   ├── FilterBar.tsx           # Filter-Container
│   │   ├── FilterChips.tsx         # Filter-Chips
│   │   ├── ToggleSwitch.tsx        # Toggle für Erledigte
│   │   ├── SectionHeader.tsx       # Sektions-Überschrift
│   │   └── EmptyState.tsx          # Leerer Zustand
│   └── filters/
│       └── TaskFilters.tsx         # Filter-Logik
└── lib/
    └── database.ts                 # Datenbank-Funktionen
```
