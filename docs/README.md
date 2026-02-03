# STRATEGIE Projekte

Eine moderne Task-Management-Anwendung für Teams, entwickelt mit Next.js 15 und Supabase.

## Projektübersicht

**STRATEGIE Projekte** ist eine webbasierte Aufgabenverwaltung ähnlich Todoist/Asana, die speziell für die Zusammenarbeit in Teams entwickelt wurde. Die Anwendung bietet umfassende Features wie Projektmanagement, wiederkehrende Aufgaben, Team-Kollaboration und E-Mail-Benachrichtigungen.

**Live-Demo:** [https://strategie-projekte.vercel.app](https://strategie-projekte.vercel.app)

## Tech-Stack

| Bereich | Technologie |
|---------|-------------|
| **Frontend** | Next.js 15, React 19, TypeScript |
| **Styling** | Tailwind CSS 3.4, Custom Design System |
| **State Management** | Zustand |
| **Backend** | Supabase (PostgreSQL, Auth, Realtime) |
| **Deployment** | Vercel |
| **E-Mail-Integration** | Make.com Webhooks |
| **Icons** | Lucide React |
| **Drag & Drop** | dnd-kit |
| **Datumsverarbeitung** | date-fns |
| **Benachrichtigungen** | Sonner |

## Quick Start

### Voraussetzungen

- Node.js 18+
- npm oder yarn
- Supabase-Account

### Installation

1. **Repository klonen:**
   ```bash
   git clone <repository-url>
   cd strategie-projekte
   ```

2. **Abhängigkeiten installieren:**
   ```bash
   npm install
   ```

3. **Umgebungsvariablen konfigurieren:**

   Erstelle eine `.env.local` Datei:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Entwicklungsserver starten:**
   ```bash
   npm run dev
   ```

5. **Anwendung öffnen:**

   [http://localhost:3000](http://localhost:3000)

### Build für Produktion

```bash
npm run build
npm start
```

## Projektstruktur

```
strategie-projekte/
├── docs/                    # Dokumentation
├── public/                  # Statische Assets
├── src/
│   ├── app/                 # Next.js App Router (Seiten)
│   │   ├── (auth)/          # Auth-Seiten (Login, Register)
│   │   ├── dashboard/       # Dashboard
│   │   ├── inbox/           # Inbox-Ansicht
│   │   ├── my-tasks/        # Meine Aufgaben
│   │   ├── projects/[id]/   # Projektdetails
│   │   ├── search/          # Suche
│   │   ├── teams/           # Team-Verwaltung
│   │   ├── today/           # Heute-Ansicht
│   │   └── upcoming/        # Anstehende Aufgaben
│   ├── components/          # React-Komponenten
│   │   ├── charts/          # Diagramme
│   │   ├── filters/         # Filter-Komponenten
│   │   ├── layout/          # Layout (Sidebar, Header)
│   │   ├── projects/        # Projekt-Komponenten
│   │   ├── providers/       # Context Provider
│   │   ├── sections/        # Sektionen
│   │   ├── tasks/           # Aufgaben-Komponenten
│   │   └── ui/              # UI-Komponenten
│   ├── lib/                 # Bibliotheken & Utilities
│   │   ├── database.ts      # Supabase-Datenbankfunktionen
│   │   ├── supabase.ts      # Supabase-Client
│   │   └── utils.ts         # Hilfsfunktionen
│   └── types/               # TypeScript-Typen
│       └── database.ts      # Datenbank-Typen
├── tailwind.config.ts       # Tailwind-Konfiguration
├── next.config.ts           # Next.js-Konfiguration
└── package.json             # Abhängigkeiten
```

## Dokumentation

| Dokument | Beschreibung |
|----------|--------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Systemarchitektur und Datenfluss |
| [DATABASE.md](./DATABASE.md) | Datenbankschema und RLS-Policies |
| [FEATURES.md](./FEATURES.md) | Alle implementierten Features |
| [API.md](./API.md) | Datenbankfunktionen-Referenz |
| [COMPONENTS.md](./COMPONENTS.md) | React-Komponenten |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Deployment-Anleitung |
| [INTEGRATIONS.md](./INTEGRATIONS.md) | Make.com Webhook-Integration |
| [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) | Design-System & Styling |

## Hauptfeatures

- **Aufgabenverwaltung** - CRUD, Prioritäten (P1-P4), Status, Fälligkeitsdaten
- **Projekte** - Mit Sektionen und Fortschrittsanzeige
- **Teams** - Rollen-basierte Zugriffskontrolle (Owner, Admin, Member, Viewer)
- **Wiederkehrende Aufgaben** - Täglich, wöchentlich, monatlich, jährlich, benutzerdefiniert
- **Subtasks** - Hierarchische Aufgabenstruktur
- **Labels** - Farbige Tags zur Kategorisierung
- **Kommentare** - Diskussionen an Aufgaben
- **Aufgabenzuweisung** - Multi-Assignee-Support
- **Suche** - Volltextsuche über alle Aufgaben
- **Dashboard** - Statistiken und Übersichten
- **E-Mail-Benachrichtigungen** - Via Make.com Webhooks
- **Keyboard Shortcuts** - Schnelle Navigation

## Keyboard Shortcuts

| Taste | Aktion |
|-------|--------|
| `N` | Neue Aufgabe erstellen |
| `D` | Zum Dashboard |
| `H` | Zur Startseite (Heute) |
| `I` | Zur Inbox |
| `U` | Zu Anstehend |
| `S` | Zur Suche |
| `?` | Shortcuts-Hilfe anzeigen |
| `Escape` | Modal schließen |

## Lizenz

Proprietär - Alle Rechte vorbehalten.
