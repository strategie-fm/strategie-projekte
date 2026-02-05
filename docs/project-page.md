# Projekt-Seite (Project View)

## Übersicht

Die Projekt-Seite (`src/app/projects/[id]/page.tsx`) zeigt alle Aufgaben eines bestimmten Projekts an. Die Seite unterstützt Sektionen (Abschnitte) für die Aufgaben-Organisation, Drag&Drop zwischen Sektionen und bietet die gleichen Features wie die anderen Aufgabenseiten.

## Layout

### Mit ausgewählter Aufgabe (Zwei-Spalten-Layout)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Header: "[Projektname]" + "[Beschreibung]"              [⚙️ Settings]   │
├─────────────────────────────────────────────────────────────────────────┤
│ FilterBar: Priorität │ Status │ Labels │ Zugewiesen │ Erledigte Toggle  │
├───────────────────────────────────────┬─────────────────────────────────┤
│ Linke Spalte (flex-1)                 │ Rechte Spalte (max 500px)       │
│                                       │                                 │
│ ┌───────────────────────────────────┐ │ ┌─────────────────────────────┐ │
│ │ Projekt-Info mit Farbpunkt        │ │ │ TaskDetailView        [X]   │ │
│ │ "X Aufgaben"                      │ │ │                             │ │
│ └───────────────────────────────────┘ │ │ - Titel (editierbar)        │ │
│                                       │ │ - Projekt/Wiederkehrend     │ │
│ ┌───────────────────────────────────┐ │ │ - Tab-Navigation            │ │
│ │ Donut-Charts (Status/Priorität)   │ │ │   - Aufgabe                 │ │
│ └───────────────────────────────────┘ │ │   - Unteraufgaben           │ │
│                                       │ │   - Kommentare              │ │
│ ┌───────────────────────────────────┐ │ │                             │ │
│ │ Unsektionierte Aufgaben           │ │ │ Aufgabe-Tab:                │ │
│ └───────────────────────────────────┘ │ │ - Datum/Wiederholung        │ │
│                                       │ │ - Status/Priorität          │ │
│ ┌───────────────────────────────────┐ │ │ - Zugewiesen                │ │
│ │ ▼ Sektion 1                       │ │ │ - Labels                    │ │
│ │   - Aufgabe 1                     │ │ │ - Beschreibung              │ │
│ │   - Aufgabe 2                     │ │ └─────────────────────────────┘ │
│ └───────────────────────────────────┘ │                                 │
│                                       │                                 │
│ ┌───────────────────────────────────┐ │                                 │
│ │ ▶ Sektion 2 (eingeklappt)         │ │                                 │
│ └───────────────────────────────────┘ │                                 │
│                                       │                                 │
│ [+ Abschnitt hinzufügen]              │                                 │
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

## Responsive Verhalten

- **Linke Spalte**: `flex-1` - nimmt den verfügbaren Platz
- **Rechte Spalte** (nur wenn Aufgabe ausgewählt):
  - Bevorzugte Breite: `500px`
  - Minimale Breite: `320px`
  - Kann schrumpfen (`shrink`) bei kleineren Bildschirmen
  - Sticky-Position mit `max-h-[calc(100vh-120px)]`

## Komponenten

### 1. Header

- **Titel**: Projektname
- **Untertitel**: Projekt-Beschreibung (optional)
- **Settings-Button**: Öffnet Projekt-Einstellungen-Modal

### 2. FilterBar

| Filter | Optionen |
|--------|----------|
| Priorität | P1 (rot), P2 (orange), P3 (blau), P4 (grau) |
| Status | Offen, In Arbeit |
| Labels | Dynamisch aus verwendeten Labels |
| Zugewiesen | Dynamisch aus verfügbaren Profilen |
| Erledigte anzeigen | Toggle (nur wenn erledigte vorhanden) |

### 3. Projekt-Info

- Farbpunkt mit Projektfarbe (`w-3 h-3 rounded`)
- Anzahl aktiver Aufgaben
- Bei aktiven Filtern: "X von Y Aufgaben"

### 4. Donut-Charts

Zwei Donut-Charts für Projekt-Übersicht:

**Status-Chart:**
- Offen (grau #e0e0e0)
- In Arbeit (primary #183c6c)
- Erledigt (success #059669)

**Priorität-Chart:**
- P1 (rot #dc2626)
- P2 (orange #f59e0b)
- P3 (blau #3b82f6)
- P4 (grau #e0e0e0)

### 5. SectionList

Herzstück der Projekt-Seite für die Sektions-Verwaltung.

**Features:**
- Unsektionierte Aufgaben (immer oben)
- Benannte Sektionen mit Collapse/Expand
- Drag&Drop von Aufgaben zwischen Sektionen
- Sektion umbenennen/löschen
- Neue Sektion hinzufügen

**Props:**
- `projectId`: Projekt-ID
- `sections`: Liste der Sektionen
- `tasks`: Gefilterte Aufgabenliste
- `onSectionsChange`: Callback bei Sektions-Änderung
- `onTaskUpdate`: Callback bei Aufgaben-Update
- `onTaskClick`: Callback bei Klick (Toggle-Verhalten)
- `onTaskDelete`: Callback beim Löschen
- `selectedTaskId`: ID der ausgewählten Aufgabe
- `onTasksReorder`: Callback bei Neuordnung
- `onNewRecurringTask`: Callback bei wiederkehrender Aufgabe

### 6. SortableTaskItem

Einzelne Aufgaben-Karte innerhalb der Sektionen.

**Features:**
- Drag-Handle für Umsortierung
- Status-Toggle (Checkbox)
- Titel mit Metadaten
- Löschen-Button mit Bestätigung
- Visuell markiert wenn ausgewählt

**Props:**
- `task`: Die Aufgabe
- `onUpdate`: Callback bei Aktualisierung
- `onClick`: Callback bei Klick
- `onDelete`: Callback bei Löschen
- `showProject`: false (immer versteckt auf Projektseite)
- `hideDragHandle`: false (Drag-Handle sichtbar)
- `isSelected`: Visuell hervorgehoben

### 7. TaskDetailView

Detailansicht der ausgewählten Aufgabe.

**Header:**
- Titel (editierbar, 22px)
- Löschen-Button (Papierkorb-Icon)
- Schließen-Button (X-Icon)

**Tab-Navigation:**
- Aufgabe (Formulare)
- Unteraufgaben (mit Zähler)
- Kommentare (mit Zähler)

### 8. QuickAddTask

Schnelleingabe für neue Aufgaben mit vorausgewähltem Projekt.

### 9. ProjectSettingsModal

Modal für Projekt-Einstellungen:
- Projektname ändern
- Beschreibung ändern
- Farbe ändern
- Projekt löschen

## Interaktionen

### Aufgabe auswählen
- **Klick auf Task-Karte** → Öffnet TaskDetailView
- Task-Karte wird visuell hervorgehoben

### Aufgabe abwählen
1. **X-Button** in TaskDetailView
2. **Erneuter Klick** auf dieselbe Task-Karte (Toggle)

### Aufgabe zwischen Sektionen verschieben
1. Drag-Handle greifen
2. Aufgabe in andere Sektion ziehen
3. Sektion-Zuordnung wird automatisch aktualisiert

### Sektion verwalten
- **Collapse/Expand**: Klick auf Pfeil-Icon
- **Umbenennen**: Menü → Umbenennen
- **Löschen**: Menü → Löschen (Aufgaben werden unsektioniert)

### Aufgabe erstellen
1. Klick auf "Aufgabe hinzufügen"
2. Felder ausfüllen (Projekt ist vorausgewählt)
3. "Erstellen" klicken
4. Aufgabe erscheint in Liste und wird automatisch ausgewählt

## State Management

```typescript
// Projekt & Aufgaben
const [project, setProject] = useState<Project | null>(null);
const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
const [sections, setSections] = useState<Section[]>([]);

// UI State
const [loading, setLoading] = useState(true);
const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
const [showSettings, setShowSettings] = useState(false);

// Referenzdaten
const [labels, setLabels] = useState<Label[]>([]);
const [profiles, setProfiles] = useState<Profile[]>([]);
const [taskAssigneeMap, setTaskAssigneeMap] = useState<Record<string, string[]>>({});

// Filter State
const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
const [showCompleted, setShowCompleted] = useState(false);
```

## Handler-Funktionen

| Handler | Beschreibung |
|---------|--------------|
| `handleTaskUpdate` | Aktualisiert Aufgabe in der Liste und in selectedTask |
| `handleTaskDelete` | Entfernt Aufgabe aus Liste, setzt selectedTask auf null |
| `handleTaskCreated` | Lädt Listen neu, öffnet erstellte Aufgabe automatisch |
| `handleTaskClick` | Toggle: Wählt Aufgabe aus oder hebt Auswahl auf |
| `handleCloseDetail` | Setzt selectedTask auf null |
| `handleResetFilters` | Setzt alle Filter zurück |
| `handleNewRecurringTask` | Fügt neue wiederkehrende Aufgabe zur Liste hinzu |
| `handleProjectUpdate` | Aktualisiert Projekt-Daten |
| `handleProjectDelete` | Löscht Projekt, navigiert zur Startseite |

## Event-System

Die Seite reagiert auf folgende Custom Events:

| Event | Auslöser | Reaktion |
|-------|----------|----------|
| `assigneesChanged` | Zuweisung geändert | Aktualisiert `taskAssigneeMap` |
| `taskLabelsChanged` | Labels geändert | Lädt Aufgaben neu (silent) |
| `taskDateChanged` | Datum geändert | Lädt Aufgaben neu (silent) |
| `taskProjectChanged` | Projekt geändert | Lädt Aufgaben neu (silent) |
| `taskUpdated` | Aufgabe aktualisiert | Lädt Aufgaben neu (silent) |

## Datenfluss

```
1. Seite lädt mit projectId aus URL
   ↓
2. loadData() - Lädt Projekt, Aufgaben, Sektionen, Labels, Profiles
   ↓
3. Für jede Aufgabe: getTaskAssignees() für Assignee-Map
   ↓
4. Filter werden angewendet (filterTasks + Assignee-Filter)
   ↓
5. Aufgaben werden nach Sektionen gruppiert
   ↓
6. UI wird gerendert mit SectionList
   ↓
7. Bei Klick auf Aufgabe: TaskDetailView wird eingeblendet
   ↓
8. Bei Änderungen: Events triggern silent reload
```

## Unterschiede zu anderen Seiten

| Aspekt | Heute/Meine Aufgaben/Anstehend | Projekt-Seite |
|--------|--------------------------------|---------------|
| Gruppierung | Nach Datum/Priorität/Projekt | Nach Sektionen |
| Drag&Drop | Nur innerhalb Listen | Zwischen Sektionen |
| Sektionen | Nicht vorhanden | Kernfeature |
| Charts | Nicht vorhanden | Donut-Charts |
| Einstellungen | Nicht vorhanden | Projekt-Settings-Modal |
| Projekt-Badge | Sichtbar | Versteckt (immer gleiches Projekt) |

## Styling

### Donut-Charts Container
- `bg-surface rounded-xl border border-border p-6`
- Zwei Charts nebeneinander mit `justify-around gap-8`

### Sektions-Header
- Collapse-Button + Titel + Anzahl + Menü
- `text-sm font-semibold text-text-secondary`

### Task-Karten in Sektionen
- Container: `bg-surface rounded-xl shadow-sm border border-border`
- Ausgewählt: `bg-primary-bg/50 border-l-[3px] border-l-primary`

## Abhängigkeiten

### Interne Komponenten
- `AppLayout` - Haupt-Layout mit Sidebar
- `Header` - Seitenkopf (erweitert mit children)
- `SectionList` - Sektions-Verwaltung
- `SortableTaskItem` - Task-Karte
- `TaskDetailView` - Detailansicht
- `QuickAddTask` - Schnelleingabe
- `ProjectSettingsModal` - Projekt-Einstellungen
- `DonutChart` / `DonutLegend` - Statistik-Charts
- `FilterBar` / `FilterChips` / `ToggleSwitch` - Filter-UI
- `SectionHeader` / `EmptyState` - UI-Elemente

### Externe Bibliotheken
- `@dnd-kit/core`, `@dnd-kit/sortable` - Drag&Drop
- `lucide-react` - Icons

### Datenbank-Funktionen
- `getProject(projectId)` - Projekt laden
- `getTasksByProject(projectId)` - Aufgaben des Projekts
- `getSections(projectId)` - Sektionen des Projekts
- `getLabels()` - Alle Labels
- `getProfiles()` - Alle Profile
- `getTaskAssignees(taskId)` - Zuweisungen einer Aufgabe

## Dateien

```
src/
├── app/
│   └── projects/
│       └── [id]/
│           └── page.tsx              # Diese Seite
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx             # Haupt-Layout
│   │   └── Header.tsx                # Seitenkopf (mit children)
│   ├── sections/
│   │   ├── SectionList.tsx           # Sektions-Liste
│   │   └── DroppableSection.tsx      # Drop-Zone für DnD
│   ├── tasks/
│   │   ├── SortableTaskItem.tsx      # Task-Karte
│   │   ├── TaskDetailView.tsx        # Detailansicht
│   │   └── QuickAddTask.tsx          # Schnelleingabe
│   ├── projects/
│   │   └── ProjectSettingsModal.tsx  # Projekt-Einstellungen
│   ├── charts/
│   │   └── DonutChart.tsx            # Donut-Chart Komponenten
│   └── ui/
│       ├── FilterBar.tsx             # Filter-Container
│       ├── FilterChips.tsx           # Filter-Chips
│       ├── ToggleSwitch.tsx          # Toggle
│       ├── SectionHeader.tsx         # Sektions-Überschrift
│       └── EmptyState.tsx            # Leerer Zustand
└── lib/
    └── database.ts                   # Datenbank-Funktionen
```
