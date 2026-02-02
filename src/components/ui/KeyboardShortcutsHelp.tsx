"use client";

import { useState, useEffect } from "react";
import { Keyboard, X } from "lucide-react";

const shortcuts = [
  { category: "Navigation", items: [
    { keys: ["D"], description: "Dashboard" },
    { keys: ["H"], description: "Heute" },
    { keys: ["I"], description: "Inbox" },
    { keys: ["U"], description: "Anstehend" },
    { keys: ["S"], description: "Suche" },
  ]},
  { category: "Aktionen", items: [
    { keys: ["N"], description: "Neue Aufgabe" },
    { keys: ["Esc"], description: "Schließen / Abbrechen" },
    { keys: ["?"], description: "Tastaturkürzel anzeigen" },
  ]},
];

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  // Listen for ? key to open shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setIsOpen(true);
      }

      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-surface border border-border rounded-full shadow-lg hover:shadow-xl transition-shadow text-text-muted hover:text-text-primary"
        title="Tastaturkürzel (? drücken)"
      >
        <Keyboard className="w-5 h-5" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative w-full max-w-md bg-surface rounded-xl shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <Keyboard className="w-5 h-5" />
                Tastaturkürzel
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-divider text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {shortcuts.map((section) => (
                <div key={section.category} className="mb-6 last:mb-0">
                  <h3 className="text-sm font-medium text-text-muted mb-3">
                    {section.category}
                  </h3>
                  <div className="space-y-2">
                    {section.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-text-secondary">
                          {item.description}
                        </span>
                        <div className="flex items-center gap-1">
                          {item.keys.map((key, keyIdx) => (
                            <kbd 
                              key={keyIdx}
                              className="px-2 py-1 text-xs font-mono bg-divider border border-border rounded text-text-primary min-w-[28px] text-center"
                            >
                              {key}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 border-t border-border bg-divider/30 rounded-b-xl">
              <p className="text-xs text-text-muted text-center">
                Drücke <kbd className="px-1.5 py-0.5 text-xs font-mono bg-surface border border-border rounded">?</kbd> um diese Hilfe zu öffnen
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}