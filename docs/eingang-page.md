# Eingang-Seite (Inbox View)

## Übersicht

Die Eingang-Seite (`src/app/inbox/page.tsx`) zeigt alle Aufgaben an, die keinem Projekt (Aufgabenliste) zugeordnet sind. Diese Seite dient als Sammelstelle für neue, noch nicht organisierte Aufgaben. Die Seite bietet Gruppierungsoptionen (Priorität, Datum) und umfangreiche Filtermöglichkeiten.

## Layout

### Mit ausgewählter Aufgabe (Zwei-Spalten-Layout)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Header: "Eingang" + "Aufgaben ohne Aufgabenliste"                       │
├─────────────────────────────────────────────────────────────────────────┤
│ FilterBar: [Priorität|Datum] │ Priorität │ Status │ Zugewiesen │ Labels│
├───────────────────────────────────────┬─────────────────────────────────┤
│ Linke Spalte (flex-1)                 │ Rechte Spalte (max 500px)       │
│                                       │                                 │
│ ┌───────────────────────────────────┐ │ ┌─────────────────────────────┐ │
│ │ Gruppierte Sektionen              │ │ │ TaskDetailView        [X]   │ │
│ │ (je nach Gruppierung)             │ │ │                             │ │
│ │                                   │ │ │ - Titel (editierbar)        │ │
│ │ Prioritäts-Gruppierung:           │ │ │ - Wiederkehrend-Badge       │ │
│ │ - P1 Dringend (rot)               │ │ │ - Tab-Navigation            │ │
│ │ - P2 Hoch (orange)                │ │ │   - Aufgabe                 │ │
│ │ - P3 Normal (blau)                │ │ │   - Unteraufgaben           │ │
│ │ - P4 Niedrig (grau)               │ │ │   - Kommentare              │ │
│ │                                   │ │ │                             │ │
│ │ Datums-Gruppierung:               │ │ │ Aufgabe-Tab:                │ │
│ │ - Überfällig (rot)                │ │ │ - Aufgabenliste (Projekt)   │ │
│ │ - Heute                           │ │ │ - Datum/Wiederholung        │ │
│ │ - Demnächst (blau)                │ │ │ - Status/Priorität          │ │
│ │ - Ohne Datum (grau)               │ │ │ - Zugewiesen                │ │
│ │                                   │ │ │ - Labels                    │ │
│ └───────────────────────────────────┘ │ │ - Beschreibung              │ │
│                                       │ └─────────────────────────────┘ │
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
│ Header: "Eingang" + "Aufgaben ohne Aufgabenliste"                       │
├─────────────────────────────────────────────────────────────────────────┤
│ FilterBar: [Priorität|Datum] │ Priorität │ Status │ Zugewiesen │ Labels│
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
- Titel: "Eingang"
- Untertitel: "Aufgaben ohne Aufgabenliste"

### 2. FilterBar mit Segmented Control

Die FilterBar enthält als erstes Element einen Segmented Control für die Gruppierungsauswahl.

#### Segmented Control (Gruppierung)

```
┌───────────────────────────────┐
│ [🚩 Priorität] │ [📅 Datum]  │
└───────────────────────────────┘
```

| Gruppierung | Icon | Sektionen |
|-------------|------|-----------|
| Priorität | Flag | P1 Dringend, P2 Hoch, P3 Normal, P4 Niedrig |
| Datum | Calendar | Überfällig, Heute, Demnächst, Ohne Datum |

**Hinweis:** Im Gegensatz zur Meine Aufgaben-Seite gibt es hier keine Projekt-Gruppierung, da alle Aufgaben im Eingang per Definition keinem Projekt zugeordnet sind.

**Styling:**
- Container: `bg-divider rounded-lg px-1 py-1`
- Aktiver Button: `bg-surface text-primary shadow-sm`
- Inaktiver Button: `text-text-muted hover:text-text-primary`

#### Filter

| Filter | Optionen |
|--------|----------|
| Priorität | P1 (rot), P2 (orange), P3 (blau), P4 (grau) |
| Status | Offen, In Arbeit |
| Zugewiesen | Dynamisch aus zugewiesenen Benutzern |
| Labels | Dynamisch aus verwendeten Labels |
| Erledigte anzeigen | Toggle (nur wenn erledigte vorhanden) |

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

### 4. SortableTaskItem

Einzelne Aufgaben-Karte mit:

**Titelzeile:**
- Status-Toggle (Checkbox)
- Aufgabentitel (`font-medium`, 16px)
- **Kein Projekt-Badge** (da alle Tasks ohne Projekt)

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
- `showProject`: **false** (Projekt-Badge versteckt)
- `hideDragHandle`: Versteckt den Drag-Handle
- `isSelected`: Visuell hervorgehoben wenn ausgewählt

### 5. TaskDetailView

Detailansicht der ausgewählten Aufgabe. Wird nur angezeigt, wenn eine Aufgabe ausgewählt ist.

**Header:**
- Titel (editierbar, 22px)
- Löschen-Button (Papierkorb-Icon)
- Schließen-Button (X-Icon)

**Badges unter Titel:**
- Projekt (mit Farbpunkt) - erscheint wenn Aufgabe einem Projekt zugewiesen wird
- Wiederkehrend-Badge (falls aktiv)

**Tab-Navigation:**
- Aufgabe (Formulare)
- Unteraufgaben (mit Zähler)
- Kommentare (mit Zähler)

**Aufgabe-Tab Felder:**
1. **Aufgabenliste** (ProjectSelector) - ermöglicht Zuweisung zu einem Projekt
2. Datum + Wiederholung (nebeneinander)
3. Status + Priorität (nebeneinander)
4. Zugewiesen
5. Labels
6. Beschreibung (auto-resize)

**Besonderheit im Eingang:**
Über den ProjectSelector können Aufgaben direkt einem Projekt zugewiesen werden. Dadurch verlassen sie den Eingang und erscheinen in der jeweiligen Aufgabenliste.

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
- Projekt (Dropdown, Default: Inbox/Kein Projekt)
- Status (Offen oder In Arbeit)
- Priorität (P1-P4, Default: P4)

**Verhalten nach Erstellen:**
1. Aufgabe wird in der Datenbank gespeichert
2. Aufgabenliste wird aktualisiert
3. Erstellte Aufgabe wird automatisch in TaskDetailView geöffnet
4. Über TaskDetailView kann sie einem Projekt zugewiesen werden

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

### Aufgabe zu Projekt verschieben
1. Aufgabe in TaskDetailView öffnen
2. Im "Aufgabenliste"-Dropdown ein Projekt wählen
3. Aufgabe verschwindet aus dem Eingang
4. Aufgabe erscheint in der gewählten Aufgabenliste

### Aufgabe erstellen
1. Klick auf "Aufgabe hinzufügen"
2. Felder ausfüllen (Projekt auf "Inbox" lassen für Eingang)
3. "Erstellen" klicken
4. Aufgabe erscheint im Eingang und in TaskDetailView

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

// Filter State
const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
const [showCompleted, setShowCompleted] = useState(false);

// Grouping State
const [groupBy, setGroupBy] = useState<GroupBy>("priority");

// Referenzdaten
const [labels, setLabels] = useState<Label[]>([]);
const [profiles, setProfiles] = useState<Profile[]>([]);
const [taskAssigneeMap, setTaskAssigneeMap] = useState<Record<string, string[]>>({});
```

## Handler-Funktionen

| Handler | Beschreibung |
|---------|--------------|
| `handleTaskUpdate` | Aktualisiert eine Aufgabe in den Listen und in selectedTask |
| `handleTaskDelete` | Entfernt Aufgabe aus allen Listen, setzt selectedTask auf null |
| `handleTaskCreated` | Lädt Listen neu, öffnet erstellte Aufgabe in TaskDetailView |
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

## Event-System

Die Seite reagiert auf folgende Custom Events:

| Event | Auslöser | Reaktion |
|-------|----------|----------|
| `assigneesChanged` | Zuweisung geändert | Aktualisiert `taskAssigneeMap` |
| `taskLabelsChanged` | Labels geändert | Lädt Aufgaben neu |
| `taskUpdated` | Aufgabe aktualisiert (inkl. Projekt) | Lädt Aufgaben neu |

## Datenfluss

```
1. Seite lädt
   ↓
2. loadData() - Lädt Inbox-Aufgaben, Labels, Profiles
   ↓
3. getInboxTasks() - Nur Aufgaben ohne Projekt
   ↓
4. Für jede Aufgabe: getTaskAssignees() laden
   ↓
5. Sortierung: Priorität (P1 zuerst) → Datum (früher zuerst)
   ↓
6. Filter werden angewendet (filterTasks)
   ↓
7. Gruppierung wird angewendet (groupByPriority/Date)
   ↓
8. UI wird gerendert
   ↓
9. Bei Klick auf Aufgabe: TaskDetailView wird eingeblendet
   ↓
10. Bei Projekt-Zuweisung: Aufgabe verschwindet aus Eingang
```

## Unterschiede zu anderen Seiten

| Aspekt | Eingang | Heute | Meine Aufgaben |
|--------|---------|-------|----------------|
| Datenquelle | `getInboxTasks()` | Aufgaben mit due_date ≤ heute | Dem Benutzer zugewiesene |
| Gruppierung | Priorität, Datum | Überfällig/Heute/Erledigt | Priorität, Datum, Projekt |
| Projekt-Badge | Versteckt | Sichtbar | Sichtbar |
| Projekt-Filter | - | - | - |
| Zuweisungs-Filter | Verfügbar | Verfügbar | Nicht verfügbar |
| Auto-Assign | Nein | Nein | Ja |

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

### Task-Karten
- Hintergrund: `bg-surface`
- Border: `border border-border rounded-lg`
- Schatten: `shadow-sm` (hover: `shadow-md`)
- Ausgewählt: `bg-primary-bg/50 border-l-[3px] border-l-primary`

### EmptyState
- Icon: `InboxIcon` (Lucide)
- Titel: "Dein Eingang ist leer"
- Beschreibung: "Aufgaben ohne Aufgabenliste landen hier"

## Abhängigkeiten

### Interne Komponenten
- `AppLayout` - Haupt-Layout mit Sidebar
- `Header` - Seitenkopf
- `SortableTaskItem` - Task-Karte
- `TaskDetailView` - Detailansicht mit ProjectSelector
- `QuickAddTask` - Schnelleingabe
- `FilterBar` / `FilterChips` / `ToggleSwitch` - Filter-UI
- `SectionHeader` / `EmptyState` - UI-Elemente

### Externe Bibliotheken
- `lucide-react` - Icons (Inbox, Check, Flag, Calendar)

### Datenbank-Funktionen
- `getInboxTasks()` - Aufgaben ohne Projekt laden
- `getTaskAssignees(taskId)` - Zuweisungen einer Aufgabe
- `getLabels()` - Alle Labels laden
- `getProfiles()` - Alle Benutzerprofile laden

### Filter-Logik
- `filterTasks()` aus `@/components/filters/TaskFilters`

## Dateien

```
src/
├── app/
│   └── inbox/
│       └── page.tsx                # Diese Seite
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx           # Haupt-Layout
│   │   └── Header.tsx              # Seitenkopf
│   ├── tasks/
│   │   ├── SortableTaskItem.tsx    # Task-Karte
│   │   ├── TaskDetailView.tsx      # Detailansicht
│   │   ├── ProjectSelector.tsx     # Projekt-Auswahl (neu)
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
    └── database.ts                 # Datenbank-Funktionen
```

## Navigation

Die Eingang-Seite ist in der Sidebar als zweiter Eintrag positioniert:

```
Dashboard
Dashboard
Heute
Meine Aufgaben
Anstehend
Eingang       ← Diese Seite
Suche
Teams
```

**Tastaturkürzel:** `5` oder `g i` navigiert zum Eingang
