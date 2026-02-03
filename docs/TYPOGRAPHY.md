# Typografie-Übersicht

Dieses Dokument beschreibt alle verwendeten Schriftarten, Schriftgrößen und Schriftstärken in der STRATEGIE Projekte App, aufgeschlüsselt nach Seiten und Bereichen.

## Schriftarten-Definition

### Globale Schriftarten (globals.css)

```css
@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&family=Roboto:wght@400;500;600;700&family=Roboto+Mono:wght@400;500;600&display=swap');
```

### Tailwind-Konfiguration (tailwind.config.ts)

```typescript
fontFamily: {
  heading: ["Open Sans", "system-ui", "sans-serif"],
  body: ["Roboto", "system-ui", "sans-serif"],
  mono: ["Roboto Mono", "ui-monospace", "monospace"],
}
```

### Verwendungsregeln

| Schriftart | CSS-Klasse | Verwendung |
|------------|------------|------------|
| **Open Sans** | `font-heading` | Überschriften (H1-H6), Logos, Modal-Titel |
| **Roboto** | `font-body` (Default) | Fließtext, Buttons, Labels, Beschreibungen |
| **Roboto Mono** | `font-mono` | Tastaturkürzel (`<kbd>`), Code |

---

## Layout-Komponenten

### Sidebar (`src/components/layout/Sidebar.tsx`)

| Element | Klassen | Schrift | Größe | Gewicht |
|---------|---------|---------|-------|---------|
| Logo "STRATEGIE" | `text-xl font-bold tracking-tight` | Roboto | 20px | 700 (bold) |
| Quick-Add-Button | `text-sm font-medium` | Roboto | 14px | 500 (medium) |
| Nav-Links | `text-sm` | Roboto | 14px | 400 (normal) |
| Projekts-Header | `text-xs font-semibold uppercase tracking-wider` | Roboto | 12px | 600 (semibold) |
| Projekt-Namen | `text-sm` + `truncate` | Roboto | 14px | 400 (normal) |
| Fortschritts-Zähler | `text-xs opacity-60` | Roboto | 12px | 400 (normal) |
| "Noch keine Listen" | `text-sm text-white/50` | Roboto | 14px | 400 (normal) |
| Neues Projekt Input | `text-sm` | Roboto | 14px | 400 (normal) |
| Abmelden-Button | `text-sm` | Roboto | 14px | 400 (normal) |

### Header (`src/components/layout/Header.tsx`)

| Element | Klassen | Schrift | Größe | Gewicht |
|---------|---------|---------|-------|---------|
| Seitentitel (H1) | `text-xl font-heading font-semibold` | Open Sans | 20px | 600 (semibold) |
| Untertitel | `text-sm text-text-muted` | Roboto | 14px | 400 (normal) |

---

## Authentifizierungs-Seiten

### Login (`src/app/(auth)/login/page.tsx`)

| Element | Klassen | Schrift | Größe | Gewicht |
|---------|---------|---------|-------|---------|
| Logo "STRATEGIE" | `text-2xl font-heading font-bold text-primary` | Open Sans | 24px | 700 (bold) |
| Willkommens-Überschrift | `text-xl font-heading font-semibold` | Open Sans | 20px | 600 (semibold) |
| Fehler-Meldung | `text-sm` | Roboto | 14px | 400 (normal) |
| Input-Labels | `text-sm font-medium text-text-secondary` | Roboto | 14px | 500 (medium) |
| Input-Felder | (keine spezielle Klasse) | Roboto | 16px | 400 (normal) |
| Submit-Button | `font-medium` | Roboto | 16px | 500 (medium) |
| "Noch kein Konto?" | `text-sm text-text-muted` | Roboto | 14px | 400 (normal) |
| "Registrieren" Link | `font-medium` | Roboto | 14px | 500 (medium) |

---

## Dashboard (`src/app/dashboard/page.tsx`)

### Statistik-Karten

| Element | Klassen | Schrift | Größe | Gewicht |
|---------|---------|---------|-------|---------|
| Karten-Label | `text-sm text-text-muted` | Roboto | 14px | 400 (normal) |
| Statistik-Zahl | `text-2xl font-bold` | Roboto | 24px | 700 (bold) |
| Zusatzinfo ("+X heute") | `text-xs text-text-muted` | Roboto | 12px | 400 (normal) |

### Donut-Charts

| Element | Klassen | Schrift | Größe | Gewicht |
|---------|---------|---------|-------|---------|
| Chart-Titel | `text-sm font-semibold text-text-secondary` | Roboto | 14px | 600 (semibold) |
| Zentrum-Zahl | `text-sm font-semibold text-text-primary` | Roboto | 14px | 600 (semibold) |
| Legende-Labels | `text-xs` + `text-text-secondary` | Roboto | 12px | 400 (normal) |
| Legende-Werte | `text-text-muted` | Roboto | 12px | 400 (normal) |

### Wochenübersicht

| Element | Klassen | Schrift | Größe | Gewicht |
|---------|---------|---------|-------|---------|
| Wochentag (Mo, Di...) | `text-xs font-medium` | Roboto | 12px | 500 (medium) |
| Datum | `text-lg font-semibold` | Roboto | 18px | 600 (semibold) |
| Badge-Zahlen | `text-xs` | Roboto | 12px | 400 (normal) |
| Wochenstatistik-Zahl | `text-2xl font-bold` | Roboto | 24px | 700 (bold) |
| Wochenstatistik-Label | `text-xs text-text-muted` | Roboto | 12px | 400 (normal) |

### Kürzlich erledigt

| Element | Klassen | Schrift | Größe | Gewicht |
|---------|---------|---------|-------|---------|
| Sektion-Titel | `text-sm font-semibold text-text-secondary` | Roboto | 14px | 600 (semibold) |
| Task-Titel | `text-sm text-text-primary` | Roboto | 14px | 400 (normal) |
| Zeitangabe | `text-xs text-text-muted` | Roboto | 12px | 400 (normal) |

### Team-Übersicht

| Element | Klassen | Schrift | Größe | Gewicht |
|---------|---------|---------|-------|---------|
| Benutzer-Name | `font-medium text-text-primary` | Roboto | 16px | 500 (medium) |
| Avatar-Initialen | `text-lg font-medium` | Roboto | 18px | 500 (medium) |
| Mini-Stats | `text-xs text-text-muted` | Roboto | 12px | 400 (normal) |
| Aufgaben-Zahl | `text-2xl font-bold text-primary` | Roboto | 24px | 700 (bold) |
| "X erledigt" | `text-xs text-text-muted` | Roboto | 12px | 400 (normal) |

### Projektübersicht

| Element | Klassen | Schrift | Größe | Gewicht |
|---------|---------|---------|-------|---------|
| Projekt-Name | `font-medium text-text-primary` | Roboto | 16px | 500 (medium) |
| Fortschritts-Text | `text-sm text-text-muted` | Roboto | 14px | 400 (normal) |
| Überfällig-Badge | `text-xs` | Roboto | 12px | 400 (normal) |
| Mini-Stats | `text-xs text-text-muted` | Roboto | 12px | 400 (normal) |

---

## Projekt-Seite (`src/app/projects/[id]/page.tsx`)

### Projekt-Header

| Element | Klassen | Schrift | Größe | Gewicht |
|---------|---------|---------|-------|---------|
| Aufgaben-Zähler | `text-sm font-semibold text-text-secondary` | Roboto | 14px | 600 (semibold) |
| Filter-Button | `text-sm` | Roboto | 14px | 400 (normal) |
| Erledigte-Button | `text-sm` | Roboto | 14px | 400 (normal) |

### Sektionen

| Element | Klassen | Schrift | Größe | Gewicht |
|---------|---------|---------|-------|---------|
| Sektion-Name | `text-sm font-semibold text-text-secondary` | Roboto | 14px | 600 (semibold) |
| Task-Anzahl | `text-text-muted font-normal` | Roboto | 14px | 400 (normal) |
| Sektion-Input | `text-sm font-semibold` | Roboto | 14px | 600 (semibold) |
| Dropdown-Button | `text-sm` | Roboto | 14px | 400 (normal) |
| "Aufgaben hierher ziehen" | `text-sm text-text-muted` | Roboto | 14px | 400 (normal) |
| Abschnitt hinzufügen | `text-sm` | Roboto | 14px | 400 (normal) |

### Erledigte Sektion

| Element | Klassen | Schrift | Größe | Gewicht |
|---------|---------|---------|-------|---------|
| "Erledigt" Header | `text-xs font-medium text-text-muted` | Roboto | 12px | 500 (medium) |

### Empty States

| Element | Klassen | Schrift | Größe | Gewicht |
|---------|---------|---------|-------|---------|
| Haupttext | `text-text-muted` | Roboto | 16px | 400 (normal) |
| Untertext | `text-sm text-text-muted` | Roboto | 14px | 400 (normal) |

---

## Such-Seite (`src/app/search/page.tsx`)

### Suchfeld

| Element | Klassen | Schrift | Größe | Gewicht |
|---------|---------|---------|-------|---------|
| Input | `text-text-primary placeholder:text-text-muted` | Roboto | 16px | 400 (normal) |

### Filter-Bereich

| Element | Klassen | Schrift | Größe | Gewicht |
|---------|---------|---------|-------|---------|
| Filter-Labels | `text-xs font-medium text-text-muted` | Roboto | 12px | 500 (medium) |
| Filter-Buttons | `text-sm font-medium` | Roboto | 14px | 500 (medium) |
| Benutzer-Name | `text-sm font-medium` | Roboto | 14px | 500 (medium) |
| Avatar-Initialen | `text-[10px] font-medium` | Roboto | 10px | 500 (medium) |

### Ergebnisse

| Element | Klassen | Schrift | Größe | Gewicht |
|---------|---------|---------|-------|---------|
| Ergebnis-Zähler | `text-sm text-text-muted` | Roboto | 14px | 400 (normal) |
| Empty State | `text-text-muted` / `text-sm text-text-muted` | Roboto | 16px / 14px | 400 (normal) |

---

## Teams-Seite (`src/app/teams/page.tsx`)

### Team-Liste

| Element | Klassen | Schrift | Größe | Gewicht |
|---------|---------|---------|-------|---------|
| "Meine Teams" Überschrift | `font-semibold text-text-primary` | Roboto | 16px | 600 (semibold) |
| Team-Avatar | `font-semibold` (in Avatar) | Roboto | 16px | 600 (semibold) |
| Team-Name | `font-medium text-text-primary` | Roboto | 16px | 500 (medium) |
| Team-Beschreibung | `text-xs text-text-muted` | Roboto | 12px | 400 (normal) |
| "Erstes Team erstellen" | `text-sm text-primary` | Roboto | 14px | 400 (normal) |

### Team-Details

| Element | Klassen | Schrift | Größe | Gewicht |
|---------|---------|---------|-------|---------|
| Team-Avatar (groß) | `text-2xl font-bold` | Roboto | 24px | 700 (bold) |
| Team-Name | `text-xl font-semibold text-text-primary` | Roboto | 20px | 600 (semibold) |
| Team-Beschreibung | `text-text-muted` | Roboto | 16px | 400 (normal) |
| Mitglieder-Anzahl | `text-sm text-text-muted` | Roboto | 14px | 400 (normal) |
| "Mitglieder" Überschrift | `font-semibold text-text-primary` | Roboto | 16px | 600 (semibold) |
| Mitglied-Name | `font-medium text-text-primary` | Roboto | 16px | 500 (medium) |
| Mitglied-E-Mail | `text-sm text-text-muted` | Roboto | 14px | 400 (normal) |

### Modals

| Element | Klassen | Schrift | Größe | Gewicht |
|---------|---------|---------|-------|---------|
| Modal-Titel | `text-lg font-semibold text-text-primary` | Roboto | 18px | 600 (semibold) |
| Input-Labels | `text-sm font-medium text-text-secondary` | Roboto | 14px | 500 (medium) |
| Buttons | `text-sm font-medium` (primär) / `text-sm` (sekundär) | Roboto | 14px | 500/400 |

---

## Task-Komponenten

### TaskItem (`src/components/tasks/TaskItem.tsx`)

| Element | Klassen | Schrift | Größe | Gewicht |
|---------|---------|---------|-------|---------|
| Task-Titel (offen) | `text-sm font-medium text-text-primary` | Roboto | 14px | 500 (medium) |
| Task-Titel (erledigt) | `text-sm font-medium text-text-muted line-through` | Roboto | 14px | 500 (medium) |
| Meta-Info (Datum, Projekt) | `text-xs text-text-muted` | Roboto | 12px | 400 (normal) |
| Prioritäts-Badge | `text-[10px] font-medium` | Roboto | 10px | 500 (medium) |
| Assignee-Initialen | `text-[10px] font-medium` | Roboto | 10px | 500 (medium) |

### TaskDetailPanel (`src/components/tasks/TaskDetailPanel.tsx`)

| Element | Klassen | Schrift | Größe | Gewicht |
|---------|---------|---------|-------|---------|
| Projekt-Badge | `text-xs font-medium` | Roboto | 12px | 500 (medium) |
| Wiederkehrend-Badge | `text-xs font-medium` | Roboto | 12px | 500 (medium) |
| Task-Titel Input | `text-xl font-semibold` | Roboto | 20px | 600 (semibold) |
| Sektion-Labels | `text-sm font-medium text-text-secondary` | Roboto | 14px | 500 (medium) |
| Prioritäts-Buttons | `text-xs font-medium` | Roboto | 12px | 500 (medium) |
| Select-Felder | `text-sm` | Roboto | 14px | 400 (normal) |
| Beschreibung-Textarea | `text-sm` | Roboto | 14px | 400 (normal) |
| Löschen-Button | `text-sm` | Roboto | 14px | 400 (normal) |
| Lösch-Bestätigung | `text-sm font-medium` / `text-xs` | Roboto | 14px / 12px | 500 / 400 |

### QuickAddTask (`src/components/tasks/QuickAddTask.tsx`)

| Element | Klassen | Schrift | Größe | Gewicht |
|---------|---------|---------|-------|---------|
| Trigger-Button Text | (keine Klasse) | Roboto | 16px | 400 (normal) |
| Titel-Input | `text-sm font-medium` | Roboto | 14px | 500 (medium) |
| Datum-Input | `text-xs` | Roboto | 12px | 400 (normal) |
| Projekt-Dropdown | `text-xs` | Roboto | 12px | 400 (normal) |
| Prioritäts-Buttons | `text-xs font-medium` | Roboto | 12px | 500 (medium) |
| Abbrechen-Button | `text-sm text-text-muted` | Roboto | 14px | 400 (normal) |
| Submit-Button | `text-sm font-medium` | Roboto | 14px | 500 (medium) |

### SubtaskList (`src/components/tasks/SubtaskList.tsx`)

| Element | Klassen | Schrift | Größe | Gewicht |
|---------|---------|---------|-------|---------|
| "Unteraufgaben" Header | `text-sm font-medium text-text-secondary` | Roboto | 14px | 500 (medium) |
| Anzahl-Info | `text-text-muted` | Roboto | 14px | 400 (normal) |
| "Hinzufügen" Link | `text-xs text-primary` | Roboto | 12px | 400 (normal) |
| Subtask-Titel | `text-sm` | Roboto | 14px | 400 (normal) |
| Input-Placeholder | `text-sm` | Roboto | 14px | 400 (normal) |
| "Keine Unteraufgaben" | `text-sm text-text-muted` | Roboto | 14px | 400 (normal) |

### CommentList (`src/components/tasks/CommentList.tsx`)

| Element | Klassen | Schrift | Größe | Gewicht |
|---------|---------|---------|-------|---------|
| "Kommentare" Header | `text-sm font-medium text-text-secondary` | Roboto | 14px | 500 (medium) |
| Anzahl | `text-text-muted` | Roboto | 14px | 400 (normal) |
| Avatar-Initialen | `text-xs font-medium` | Roboto | 12px | 500 (medium) |
| Autor-Name | `text-sm font-medium text-text-primary` | Roboto | 14px | 500 (medium) |
| Zeitstempel | `text-xs text-text-muted` | Roboto | 12px | 400 (normal) |
| Kommentar-Text | `text-sm text-text-secondary` | Roboto | 14px | 400 (normal) |
| "Noch keine Kommentare" | `text-sm text-text-muted` | Roboto | 14px | 400 (normal) |
| Input | `text-sm` | Roboto | 14px | 400 (normal) |

### RecurrenceSelector (`src/components/tasks/RecurrenceSelector.tsx`)

| Element | Klassen | Schrift | Größe | Gewicht |
|---------|---------|---------|-------|---------|
| Trigger-Button | `text-sm` | Roboto | 14px | 400 (normal) |
| Dropdown-Optionen | `text-sm` | Roboto | 14px | 400 (normal) |
| Modal-Titel | `text-lg font-semibold text-text-primary` | Roboto | 18px | 600 (semibold) |
| Form-Labels | `text-sm font-medium text-text-secondary` | Roboto | 14px | 500 (medium) |
| Wochentag-Buttons | `text-sm font-medium` | Roboto | 14px | 500 (medium) |
| Radio-Labels | `text-sm text-text-primary` | Roboto | 14px | 400 (normal) |

---

## UI-Komponenten

### Modal (`src/components/ui/Modal.tsx`)

| Element | Klassen | Schrift | Größe | Gewicht |
|---------|---------|---------|-------|---------|
| Titel | `text-lg font-heading font-semibold text-text-primary` | Open Sans | 18px | 600 (semibold) |

### KeyboardShortcutsHelp (`src/components/ui/KeyboardShortcutsHelp.tsx`)

| Element | Klassen | Schrift | Größe | Gewicht |
|---------|---------|---------|-------|---------|
| Titel | `text-lg font-semibold text-text-primary` | Roboto | 18px | 600 (semibold) |
| Kategorie | `text-sm font-medium text-text-muted` | Roboto | 14px | 500 (medium) |
| Shortcut-Beschreibung | `text-sm text-text-secondary` | Roboto | 14px | 400 (normal) |
| Tastatur-Taste | `text-xs font-mono` | Roboto Mono | 12px | 400 (normal) |
| Footer-Text | `text-xs text-text-muted` | Roboto | 12px | 400 (normal) |

### DonutChart (`src/components/charts/DonutChart.tsx`)

| Element | Klassen | Schrift | Größe | Gewicht |
|---------|---------|---------|-------|---------|
| Zentrum-Zahl | `text-sm font-semibold text-text-primary` | Roboto | 14px | 600 (semibold) |
| Chart-Titel | `text-xs font-medium text-text-secondary` | Roboto | 12px | 500 (medium) |
| Legende-Labels | `text-xs` + `text-text-secondary` | Roboto | 12px | 400 (normal) |
| Legende-Werte | `text-text-muted` | Roboto | 12px | 400 (normal) |

### TaskFilters (`src/components/filters/TaskFilters.tsx`)

| Element | Klassen | Schrift | Größe | Gewicht |
|---------|---------|---------|-------|---------|
| Toggle-Button | `text-sm` | Roboto | 14px | 400 (normal) |
| Filter-Badge | `text-xs` | Roboto | 12px | 400 (normal) |
| Dropdown-Header | `font-medium text-text-primary` | Roboto | 16px | 500 (medium) |
| "Zurücksetzen" | `text-xs text-text-muted` | Roboto | 12px | 400 (normal) |
| Sektion-Header | `text-xs font-medium text-text-secondary` | Roboto | 12px | 500 (medium) |
| Filter-Buttons | `text-xs font-medium` | Roboto | 12px | 500 (medium) |

---

## Projekt-Komponenten

### ProjectSettingsModal (`src/components/projects/ProjectSettingsModal.tsx`)

| Element | Klassen | Schrift | Größe | Gewicht |
|---------|---------|---------|-------|---------|
| Tab-Buttons | `text-sm font-medium` | Roboto | 14px | 500 (medium) |
| Input-Labels | `text-sm font-medium text-text-secondary` | Roboto | 14px | 500 (medium) |
| Lösch-Warnung Titel | `text-sm font-medium text-error` | Roboto | 14px | 500 (medium) |
| Lösch-Warnung Text | `text-sm text-error/80` | Roboto | 14px | 400 (normal) |
| Action-Buttons | `text-sm` / `text-sm font-medium` | Roboto | 14px | 400 / 500 |

---

## Zusammenfassung Schriftgrößen

### Häufig verwendete Klassen nach Größe

| Tailwind-Klasse | Pixel | Verwendung |
|-----------------|-------|------------|
| `text-[10px]` | 10px | Mini-Badges, Initialen in kleinen Avataren |
| `text-xs` | 12px | Meta-Infos, Timestamps, kleine Labels, Badges |
| `text-sm` | 14px | Standard UI-Text, Buttons, Inputs, Listen |
| `text-base` | 16px | Fließtext, Standard-Körper |
| `text-lg` | 18px | Modal-Titel, große Datums-Anzeigen |
| `text-xl` | 20px | Seiten-Überschriften (H1), Haupt-Titel |
| `text-2xl` | 24px | Logo, große Statistik-Zahlen |

### Schriftstärken-Verteilung

| Tailwind-Klasse | Gewicht | Verwendung |
|-----------------|---------|------------|
| `font-normal` | 400 | Fließtext, Beschreibungen, Meta-Infos |
| `font-medium` | 500 | Buttons, Links, wichtige Labels, Benutzernamen |
| `font-semibold` | 600 | Überschriften, Sektion-Titel, Statistik-Zahlen |
| `font-bold` | 700 | Logo, große Zahlen, Hauptstatistiken |

### Konsistenz-Regeln

1. **Überschriften**: Immer `font-heading` (Open Sans) + `font-semibold` oder `font-bold`
2. **UI-Elemente**: Standard Roboto (font-body ist Default)
3. **Meta-Informationen**: `text-xs` oder `text-sm` + `text-text-muted`
4. **Interaktive Elemente**: `text-sm font-medium` für Buttons
5. **Inputs**: `text-sm` ohne explizite Gewichts-Klasse
6. **Statistiken**: `text-2xl font-bold` für Zahlen
7. **Tastaturkürzel**: `font-mono` + `text-xs`
