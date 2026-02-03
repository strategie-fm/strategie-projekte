# Design-System

Dieses Dokument beschreibt das visuelle Design-System der STRATEGIE Projekte Anwendung.

## Farbpalette

### Primärfarben

Die Hauptfarbe ist Navy Blue (#183c6c), die für wichtige UI-Elemente, die Sidebar und Akzente verwendet wird.

| Name | Hex | Verwendung |
|------|-----|------------|
| `primary` | `#183c6c` | Hauptfarbe, CTAs, Sidebar |
| `primary-dark` | `#0f2847` | Hover-States, Kontrast |
| `primary-variant` | `#122d52` | Alternative |
| `primary-light` | `#2a5490` | Hellere Variante |
| `primary-surface` | `#e8f0f8` | Hintergründe, Badges |
| `primary-bg` | `#f4f7fb` | Sehr heller Hintergrund |

### Hintergrundfarben

| Name | Hex | Verwendung |
|------|-----|------------|
| `background` | `#f0f0f0` | App-Hintergrund |
| `surface` | `#ffffff` | Karten, Panels |
| `surface-variant` | `#fafafa` | Alternative Surface |
| `divider` | `#f3f4f6` | Trennlinien |

### Statusfarben

| Name | Hex | Light | Verwendung |
|------|-----|-------|------------|
| `success` | `#059669` | `#d1fae5` | Erfolg, Erledigt |
| `error` | `#dc2626` | `#fee2e2` | Fehler, P1 |
| `warning` | `#f59e0b` | `#fef3c7` | Warnung, P2 |
| `info` | `#3b82f6` | `#dbeafe` | Info, P3 |

### Textfarben

| Name | Hex | Verwendung |
|------|-----|------------|
| `text-primary` | `#111827` | Haupttext |
| `text-secondary` | `#374151` | Sekundärtext |
| `text-muted` | `#6b7280` | Gedämpfter Text |
| `text-disabled` | `#9ca3af` | Deaktiviert |

### Rahmenfarben

| Name | Hex | Verwendung |
|------|-----|------------|
| `border` | `#e5e7eb` | Standard-Rahmen |
| `border-focus` | `#183c6c` | Fokus-Zustand |

### Sidebar-Farben

| Name | Wert | Verwendung |
|------|------|------------|
| `sidebar-bg` | `#183c6c` | Sidebar-Hintergrund |
| `sidebar-text` | `rgba(255, 255, 255, 0.85)` | Text |
| `sidebar-text-active` | `#ffffff` | Aktiver Link |
| `sidebar-hover` | `rgba(255, 255, 255, 0.1)` | Hover-State |
| `sidebar-active` | `rgba(255, 255, 255, 0.15)` | Aktiver State |

## Typografie

### Schriftarten

Die Anwendung verwendet drei Google Fonts:

```css
@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&family=Roboto:wght@400;500;600;700&family=Roboto+Mono:wght@400;500;600&display=swap');
```

| Schriftart | Verwendung | CSS-Klasse |
|------------|------------|------------|
| **Open Sans** | Überschriften | `font-heading` |
| **Roboto** | Fließtext | `font-body` |
| **Roboto Mono** | Code | `font-mono` |

### Schriftgrößen (Tailwind)

| Klasse | Größe | Verwendung |
|--------|-------|------------|
| `text-xs` | 12px | Meta-Info, Badges |
| `text-sm` | 14px | UI-Elemente, Buttons |
| `text-base` | 16px | Standard-Text |
| `text-lg` | 18px | Betonte Absätze |
| `text-xl` | 20px | Kleine Überschriften |
| `text-2xl` | 24px | Statistik-Zahlen |

### Schriftgewichte

| Klasse | Gewicht | Verwendung |
|--------|---------|------------|
| `font-normal` | 400 | Fließtext |
| `font-medium` | 500 | Betont |
| `font-semibold` | 600 | Überschriften, Labels |
| `font-bold` | 700 | Wichtige Titel |

## Spacing-System

Das Spacing basiert auf Tailwind's Standard-Skala (4px Basis):

| Klasse | Wert | Verwendung |
|--------|------|------------|
| `p-1` / `m-1` | 4px | Minimaler Abstand |
| `p-2` / `m-2` | 8px | Eng |
| `p-3` / `m-3` | 12px | Kompakt |
| `p-4` / `m-4` | 16px | Standard |
| `p-6` / `m-6` | 24px | Großzügig |
| `p-8` / `m-8` | 32px | Sections |

### Spezielle Abstände

| Name | Wert | Verwendung |
|------|------|------------|
| `sidebar-width` | `256px` (variabel: 200-400px) | Sidebar-Breite |
| `header-height` | `64px` | Header-Höhe |

## Schatten

```javascript
boxShadow: {
  sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
  DEFAULT: "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
  md: "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)",
  primary: "0 4px 14px rgba(24, 60, 108, 0.25)", // Primärfarbiger Schatten
}
```

| Klasse | Verwendung |
|--------|------------|
| `shadow-sm` | Subtile Erhebung |
| `shadow` | Karten, Panels |
| `shadow-md` | Dropdowns |
| `shadow-lg` | Modals |
| `shadow-xl` | Große Modals |
| `shadow-primary` | Primäre CTAs |

## Border Radius

| Klasse | Wert | Verwendung |
|--------|------|------------|
| `rounded` | 4px | Kleine Elemente |
| `rounded-md` | 6px | Buttons |
| `rounded-lg` | 8px | Karten, Inputs |
| `rounded-xl` | 12px | Große Karten |
| `rounded-full` | 9999px | Avatare, Badges |

## Komponenten-Styling

### Buttons

**Primär-Button:**
```tsx
<button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium">
  Speichern
</button>
```

**Sekundär-Button:**
```tsx
<button className="px-4 py-2 border border-border text-text-secondary rounded-lg hover:bg-divider transition-colors">
  Abbrechen
</button>
```

**Danger-Button:**
```tsx
<button className="px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90">
  Löschen
</button>
```

### Inputs

**Text-Input:**
```tsx
<input
  className="w-full px-3 py-2 border border-border rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
  placeholder="Placeholder..."
/>
```

**Select:**
```tsx
<select className="px-3 py-2 border border-border rounded-lg outline-none focus:border-primary bg-surface text-sm">
  <option>Option 1</option>
</select>
```

### Karten

```tsx
<div className="bg-surface rounded-xl border border-border p-6 shadow">
  {/* Inhalt */}
</div>
```

### Badges / Tags

**Status-Badge:**
```tsx
<span className="px-2 py-1 text-xs font-medium rounded-full bg-success-light text-success">
  Erledigt
</span>
```

**Prioritäts-Badge:**
```tsx
<span className="px-2 py-0.5 text-xs font-medium rounded bg-error text-white">
  P1
</span>
```

### Listen

**Aufgaben-Item:**
```tsx
<div className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary-surface/30 transition-colors">
  {/* Inhalt */}
</div>
```

## Animationen

### Definierte Animationen

```css
/* Modal Animations */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fade-in 0.15s ease-out;
}

.animate-scale-in {
  animation: scale-in 0.15s ease-out;
}
```

### Transition-Klassen

| Klasse | Verwendung |
|--------|------------|
| `transition-colors` | Farbänderungen |
| `transition-all` | Alle Eigenschaften |
| `duration-150` | 150ms |
| `duration-300` | 300ms (Panels) |
| `ease-in-out` | Standard-Easing |

## Icons

Die Anwendung verwendet [Lucide React](https://lucide.dev/) Icons.

### Import

```tsx
import { Check, X, Plus, ChevronDown } from "lucide-react";
```

### Standard-Größen

| Größe | Klasse | Verwendung |
|-------|--------|------------|
| 16px | `w-4 h-4` | Inline, Buttons |
| 20px | `w-5 h-5` | Standalone |
| 24px | `w-6 h-6` | Hervorgehoben |

### Verwendung

```tsx
<button className="flex items-center gap-2">
  <Plus className="w-4 h-4" />
  <span>Hinzufügen</span>
</button>
```

## Responsive Design

Die Anwendung ist primär für Desktop optimiert:

- **Mindestbreite:** 1024px empfohlen
- **Sidebar:** Fest auf der linken Seite
- **Content:** Flexibel, mit Padding

### Breakpoints (Tailwind Standard)

| Prefix | Min-Width |
|--------|-----------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

### Grid-Layouts

```tsx
// Dashboard Stats
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">

// Zwei-Spalten-Layout
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
```

## Utility-Funktionen

### cn() - Klassen-Merge

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Verwendung:**
```tsx
<div className={cn(
  "base-classes",
  isActive && "active-classes",
  disabled && "opacity-50"
)}>
```

## Tailwind-Konfiguration

Die vollständige Konfiguration befindet sich in `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { /* ... */ },
        background: "#f0f0f0",
        surface: { /* ... */ },
        success: { /* ... */ },
        error: { /* ... */ },
        warning: { /* ... */ },
        info: { /* ... */ },
        text: { /* ... */ },
        border: { /* ... */ },
        divider: "#f3f4f6",
        sidebar: { /* ... */ },
      },
      fontFamily: {
        heading: ["Open Sans", "system-ui", "sans-serif"],
        body: ["Roboto", "system-ui", "sans-serif"],
        mono: ["Roboto Mono", "ui-monospace", "monospace"],
      },
      boxShadow: { /* ... */ },
      spacing: {
        "sidebar-width": "260px",
        "header-height": "64px",
      },
    },
  },
  plugins: [],
};

export default config;
```

## Best Practices

### Konsistenz

- Immer die definierten Farben verwenden
- Keine Inline-Styles für Farben
- Tailwind-Klassen bevorzugen

### Accessibility

- Ausreichender Farbkontrast (WCAG AA)
- Focus-States sichtbar
- Interaktive Elemente erkennbar

### Performance

- Nur verwendete Tailwind-Klassen im Build
- SVG-Icons statt Icon-Fonts
- Keine unnötigen Animationen

## Design-Ressourcen

- [Lucide Icons](https://lucide.dev/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Google Fonts](https://fonts.google.com/)
