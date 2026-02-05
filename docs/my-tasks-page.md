# Meine Aufgaben-Seite (My Tasks View)

## Übersicht

Die Meine Aufgaben-Seite (`src/app/my-tasks/page.tsx`) zeigt alle Aufgaben an, die dem aktuell angemeldeten Benutzer zugewiesen sind. Die Seite bietet flexible Gruppierungsoptionen (Priorität, Datum, Projekt) und umfangreiche Filtermöglichkeiten.

## Layout

### Mit ausgewählter Aufgabe (Zwei-Spalten-Layout)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Header: "Meine Aufgaben" + "Mir zugewiesene Aufgaben"                   │
├─────────────────────────────────────────────────────────────────────────┤
│ FilterBar: [Priorität|Datum|Projekt] │ Priorität │ Status │ Labels     │
├───────────────────────────────────────┬─────────────────────────────────┤
│ Linke Spalte (flex-1)                 │ Rechte Spalte (max 500px)       │
│                                       │                                 │
│ ┌───────────────────────────────────┐ │ ┌─────────────────────────────┐ │
│ │ Gruppierte Sektionen              │ │ │ TaskDetailView        [X]   │ │
│ │ (je nach Gruppierung)             │ │ │                             │ │
│ │                                   │ │ │ - Titel (editierbar)        │ │
│ │ Prioritäts-Gruppierung:           │ │ │ - Projekt/Wiederkehrend     │ │
│ │ - P1 Dringend (rot)               │ │ │ - Tab-Navigation            │ │
│ │ - P2 Hoch (orange)                │ │ │   - Aufgabe                 │ │
│ │ - P3 Normal (blau)                │ │ │   - Unteraufgaben           │ │
│ │ - P4 Niedrig (grau)               │ │ │   - Kommentare              │ │
│ │                                   │ │ │                             │ │
│ │ Datums-Gruppierung:               │ │ │ Aufgabe-Tab:                │ │
│ │ - Überfällig (rot)                │ │ │ - Datum/Wiederholung        │ │
│ │ - Heute                           │ │ │ - Status/Priorität          │ │
│ │ - Demnächst (blau)                │ │ │ - Zugewiesen                │ │
│ │ - Ohne Datum (grau)               │ │ │ - Labels                    │ │
│ │                                   │ │ │ - Beschreibung              │ │
│ │ Projekt-Gruppierung:              │ │ └─────────────────────────────┘ │
│ │ - [Projekt A] (alphabetisch)      │ │                                 │
│ │ - [Projekt B]                     │ │                                 │
│ │ - Inbox (Kein Projekt)            │ │                                 │
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
│ Header: "Meine Aufgaben" + "Mir zugewiesene Aufgaben"                   │
├─────────────────────────────────────────────────────────────────────────┤
│ FilterBar: [Priorität|Datum|Projekt] │ Priorität │ Status │ Labels     │
├─────────────────────────────────────────────────────────────────────────┤
│ Volle Breite (flex-1)                                                   │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Gruppierte Sektionen (volle Breite)                                 │ │
│ │ - Task Cards                                                        │ │
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
- Titel: "Meine Aufgaben"
- Untertitel: "Mir zugewiesene Aufgaben"

### 2. FilterBar mit Segmented Control

Die FilterBar enthält als erstes Element einen Segmented Control für die Gruppierungsauswahl.

#### Segmented Control (Gruppierung)

```
┌─────────────────────────────────────────────┐
│ [🚩 Priorität] │ [📅 Datum] │ [📁 Projekt]  │
└─────────────────────────────────────────────┘
```

| Gruppierung | Icon | Sektionen |
|-------------|------|-----------|
| Priorität | Flag | P1 Dringend, P2 Hoch, P3 Normal, P4 Niedrig |
| Datum | Calendar | Überfällig, Heute, Demnächst, Ohne Datum |
| Projekt | Folder | Alphabetisch sortierte Projekte, Inbox |

**Styling:**
- Container: `bg-divider rounded-lg px-1 py-1`
- Aktiver Button: `bg-surface text-primary shadow-sm`
- Inaktiver Button: `text-text-muted hover:text-text-primary`

#### Filter

| Filter | Optionen |
|--------|----------|
| Priorität | P1 (rot), P2 (orange), P3 (blau), P4 (grau) |
| Status | Offen, In Arbeit |
| Labels | Dynamisch aus verwendeten Labels |
| Erledigte anzeigen | Toggle (nur wenn erledigte vorhanden) |

**Hinweis:** Der "Zugewiesen"-Filter ist auf dieser Seite nicht verfügbar, da alle angezeigten Aufgaben bereits dem aktuellen Benutzer zugewiesen sind.

### 3. Gruppierte Aufgabenlisten

#### Prioritäts-Gruppierung (Standard)

| Sektion | Titel | Variante | Farbe |
|---------|-------|----------|-------|
| P1 | "Priorität 1 - Dringend" | error | Rot |
| P2 | "Priorität 2 - Hoch" | warning | Orange |
| P3 | "Priorität 3 - Normal" | info | Blau |
| P4 | "Priorität 4 - Niedrig" | muted | Grau |

#### Datums-Gruppierung

| Sektion | Titel | Variante | Farbe |
|---------|-------|----------|-------|
| Überfällig | "Überfällig" | error | Rot |
| Heute | "Heute" | default | Primary |
| Demnächst | "Demnächst" | info | Blau |
| Ohne Datum | "Ohne Datum" | muted | Grau |

#### Projekt-Gruppierung

- **Projekte**: Alphabetisch nach Projektname sortiert (deutsch)
- **Header**: Farbpunkt + Projektname + Anzahl
- **Inbox**: "Inbox (Kein Projekt)" - Aufgaben ohne Projekt (immer am Ende)
- **Projekt-Badge versteckt**: Bei Projekt-Gruppierung wird das Projekt-Badge in den Task-Karten ausgeblendet

### 4. SortableTaskItem

Einzelne Aufgaben-Karte mit:

**Titelzeile:**
- Status-Toggle (Checkbox)
- Aufgabentitel (`font-medium`, 16px)
- Projekt (rechtsbündig mit Farbpunkt, versteckt bei Projekt-Gruppierung)

**Metadaten-Zeile:**
- Fälligkeitsdatum
- Unteraufgaben-Zähler
- Wiederkehrend-Icon
- Prioritäts-Badge
- Zugewiesene Personen (als Text-Badges)
- Labels (farbige Badges)
- Löschen-Button (rechtsbündig, bei Hover)

**Props:**
- `task`: Die Aufgabe
- `onUpdate`: Callback bei Aktualisierung
- `onClick`: Callback bei Klick (öffnet/schließt Detail-Ansicht)
- `onDelete`: Callback bei Löschen
- `showProject`: Projekt-Badge anzeigen (false bei Projekt-Gruppierung)
- `hideDragHandle`: Versteckt den Drag-Handle
- `isSelected`: Visuell hervorgehoben wenn ausgewählt

### 5. TaskDetailView

Detailansicht der ausgewählten Aufgabe. Wird nur angezeigt, wenn eine Aufgabe ausgewählt ist.

**Header:**
- Titel (editierbar, 22px)
- Löschen-Button (Papierkorb-Icon)
- Schließen-Button (X-Icon)

**Badges unter Titel:**
- Projekt (mit Farbpunkt)
- Wiederkehrend-Badge (falls aktiv)

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

**Props:**
- `task`: Die ausgewählte Aufgabe
- `onUpdate`: Callback bei Änderungen
- `onDelete`: Callback beim Löschen
- `onClose`: Callback zum Schließen der Ansicht

### 6. QuickAddTask

Erweiterte Schnelleingabe für neue Aufgaben.

**Geschlossener Zustand:**
- Button "Aufgabe hinzufügen" mit Plus-Icon

**Geöffneter Zustand (Formular):**
- Titel (Pflichtfeld)
- Datum (Default: heute)
- Projekt (Dropdown mit allen Projekten)
- Status (Offen oder In Arbeit)
- Priorität (P1-P4, Default: P4)

**Besonderheit auf dieser Seite:**
Nach dem Erstellen einer Aufgabe wird der **aktuelle Benutzer automatisch zugewiesen**. Dies stellt sicher, dass die Aufgabe sofort in der Liste erscheint.

**Verhalten nach Erstellen:**
1. Aufgabe wird in der Datenbank gespeichert
2. Aktueller Benutzer wird automatisch zugewiesen (`assignTask`)
3. `assigneesChanged` Event wird ausgelöst
4. Aufgabenliste wird aktualisiert
5. Erstellte Aufgabe wird automatisch in TaskDetailView geöffnet

## Interaktionen

### Aufgabe auswählen
- **Klick auf Task-Karte** → Öffnet TaskDetailView
- Task-Karte wird visuell hervorgehoben (linker Akzent, Hintergrund)

### Aufgabe abwählen (zwei Wege)
1. **X-Button** in TaskDetailView → Schließt die Ansicht
2. **Erneuter Klick** auf dieselbe Task-Karte → Toggle-Verhalten

### Gruppierung wechseln
1. Klick auf Segmented Control Option
2. Aufgaben werden sofort neu gruppiert
3. Ausgewählte Aufgabe bleibt ausgewählt

### Aufgabe erstellen
1. Klick auf "Aufgabe hinzufügen"
2. Felder ausfüllen
3. "Erstellen" klicken
4. **Benutzer wird automatisch zugewiesen**
5. Aufgabe erscheint in der Liste und automatisch in TaskDetailView

### Aufgabe erledigen
- Klick auf Checkbox → Status wechselt zu "done"
- Aufgabe verschwindet aus den gruppierten Listen
- Aufgabe erscheint in "Erledigt" (wenn sichtbar)
- Bei wiederkehrenden Aufgaben: Neue Instanz wird erstellt

## State Management

```typescript
// Task-Listen
const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
const [completedTasks, setCompletedTasks] = useState<TaskWithRelations[]>([]);

// UI State
const [loading, setLoading] = useState(true);
const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
const [currentUserId, setCurrentUserId] = useState<string | null>(null);

// Filter State
const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
const [showCompleted, setShowCompleted] = useState(false);

// Grouping State
const [groupBy, setGroupBy] = useState<GroupBy>("priority");

// Referenzdaten
const [labels, setLabels] = useState<Label[]>([]);
const [projects, setProjects] = useState<Project[]>([]);
const [taskAssigneeMap, setTaskAssigneeMap] = useState<Record<string, string[]>>({});
```

## Handler-Funktionen

| Handler | Beschreibung |
|---------|--------------|
| `handleTaskUpdate` | Aktualisiert eine Aufgabe in den Listen und in selectedTask |
| `handleTaskDelete` | Entfernt Aufgabe aus allen Listen, setzt selectedTask auf null |
| `handleTaskCreated` | Auto-Assign, lädt Listen neu, öffnet erstellte Aufgabe |
| `handleTaskClick` | Toggle: Wählt Aufgabe aus oder hebt Auswahl auf |
| `handleCloseDetail` | Setzt selectedTask auf null |
| `handleResetFilters` | Setzt alle Filter zurück |

## Gruppierungs-Funktionen

### groupByPriority

```typescript
const groupByPriority = (taskList: TaskWithRelations[]) => {
  return {
    p1: taskList.filter((t) => t.priority === "p1"),
    p2: taskList.filter((t) => t.priority === "p2"),
    p3: taskList.filter((t) => t.priority === "p3"),
    p4: taskList.filter((t) => t.priority === "p4"),
  };
};
```

### groupByDate

```typescript
const groupByDate = (taskList: TaskWithRelations[]) => {
  // Kategorisiert in: overdue, today, upcoming, noDate
  // Basierend auf dem Fälligkeitsdatum
};
```

### groupByProject

```typescript
const groupByProject = (taskList: TaskWithRelations[]) => {
  // Gruppiert nach task.projects[0].id
  // Projekte werden alphabetisch sortiert
  // Aufgaben ohne Projekt kommen in "noProject"
};
```

## Event-System

Die Seite reagiert auf folgende Custom Events:

| Event | Auslöser | Reaktion |
|-------|----------|----------|
| `assigneesChanged` | Zuweisung geändert | Aktualisiert `taskAssigneeMap`, lädt Aufgaben neu |
| `taskLabelsChanged` | Labels geändert | Lädt Aufgaben neu |
| `taskUpdated` | Aufgabe aktualisiert | Lädt Aufgaben neu |

## Datenfluss

```
1. Seite lädt
   ↓
2. supabase.auth.getUser() - Aktuellen Benutzer ermitteln
   ↓
3. loadData() - Lädt alle Aufgaben, Labels, Projekte
   ↓
4. Für jede Aufgabe: getTaskAssignees() prüfen
   ↓
5. Nur Aufgaben behalten, die dem Benutzer zugewiesen sind
   ↓
6. Sortierung: Priorität (P1 zuerst) → Datum (früher zuerst)
   ↓
7. Filter werden angewendet (filterTasks)
   ↓
8. Gruppierung wird angewendet (groupByPriority/Date/Project)
   ↓
9. UI wird gerendert
   ↓
10. Bei Klick auf Aufgabe: TaskDetailView wird eingeblendet
   ↓
11. Bei Erstellen: Auto-Assign + Aufgabe automatisch ausgewählt
```

## Unterschiede zur Heute-Seite

| Aspekt | Heute-Seite | Meine Aufgaben |
|--------|-------------|----------------|
| Filter | Aufgaben mit due_date ≤ heute | Dem Benutzer zugewiesene Aufgaben |
| Gruppierung | Fest (Überfällig/Heute/Erledigt) | Wählbar (Priorität/Datum/Projekt) |
| Zuweisungs-Filter | Verfügbar | Nicht verfügbar (alle sind "meine") |
| Auto-Assign | Nein | Ja, bei Aufgabenerstellung |
| Projekt-Sortierung | - | Alphabetisch (bei Projekt-Gruppierung) |

## Styling

### Segmented Control
- Container: `bg-divider rounded-lg px-1 py-1`
- Buttons: `flex items-center gap-1.5 px-3 py-1.5 rounded-md`
- Aktiv: `bg-surface text-primary shadow-sm`
- Inaktiv: `text-text-muted hover:text-text-primary`
- Trenner: `w-px h-6 bg-border` (zwischen Control und Filtern)

### SectionHeader Varianten

| Variante | Text-Farbe | Punkt-Farbe |
|----------|------------|-------------|
| default | `text-text-secondary` | `bg-primary` |
| error | `text-error` | `bg-error` |
| warning | `text-warning` | `bg-warning` |
| info | `text-info` | `bg-info` |
| muted | `text-text-muted` | `bg-text-muted` |

### Projekt-Header (bei Projekt-Gruppierung)
- Farbpunkt: `w-3 h-3 rounded-sm` mit Projektfarbe
- Text: `text-label-lg text-text-secondary`

### Task-Karten
- Hintergrund: `bg-surface`
- Border: `border border-border rounded-lg`
- Schatten: `shadow-sm` (hover: `shadow-md`)
- Ausgewählt: `bg-primary-bg/50 border-l-[3px] border-l-primary`

## Abhängigkeiten

### Interne Komponenten
- `AppLayout` - Haupt-Layout mit Sidebar
- `Header` - Seitenkopf
- `SortableTaskItem` - Task-Karte
- `TaskDetailView` - Detailansicht
- `QuickAddTask` - Schnelleingabe
- `FilterBar` / `FilterChips` / `ToggleSwitch` - Filter-UI
- `SectionHeader` / `EmptyState` - UI-Elemente

### Externe Bibliotheken
- `lucide-react` - Icons (User, Check, Flag, Calendar, Folder)

### Datenbank-Funktionen
- `getTasks()` - Alle Aufgaben laden
- `getTaskAssignees(taskId)` - Zuweisungen einer Aufgabe
- `getLabels()` - Alle Labels laden
- `getProjects()` - Alle Projekte laden
- `assignTask(taskId, userId)` - Benutzer zu Aufgabe zuweisen
- `supabase.auth.getUser()` - Aktuellen Benutzer ermitteln

### Filter-Logik
- `filterTasks()` aus `@/components/filters/TaskFilters`

## Dateien

```
src/
├── app/
│   └── my-tasks/
│       └── page.tsx                # Diese Seite
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx           # Haupt-Layout
│   │   └── Header.tsx              # Seitenkopf
│   ├── tasks/
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
│   │   ├── SectionHeader.tsx       # Sektions-Überschrift (5 Varianten)
│   │   ├── EmptyState.tsx          # Leerer Zustand
│   │   ├── Input.tsx               # Texteingabe
│   │   ├── FormField.tsx           # Formular-Feld
│   │   ├── PrioritySelector.tsx    # Prioritäts-Auswahl
│   │   └── StatusSelector.tsx      # Status-Auswahl
│   └── filters/
│       └── TaskFilters.tsx         # Filter-Logik
└── lib/
    ├── database.ts                 # Datenbank-Funktionen
    └── supabase.ts                 # Supabase Client
```
