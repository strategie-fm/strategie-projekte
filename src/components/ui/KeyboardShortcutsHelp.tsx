"use client";

import { useState } from "react";
import { Keyboard, X } from "lucide-react";

const shortcuts = [
  { category: "Navigation", items: [
    { keys: ["1"], description: "Startseite" },
    { keys: ["2"], description: "Inbox" },
    { keys: ["3"], description: "Heute" },
    { keys: ["4"], description: "Anstehend" },
    { keys: ["g", "h"], description: "Go to Home" },
    { keys: ["g", "i"], description: "Go to Inbox" },
    { keys: ["g", "t"], description: "Go to Today" },
    { keys: ["g", "u"], description: "Go to Upcoming" },
    { keys: ["g", "s"], description: "Go to Search" },
  ]},
  { category: "Aktionen", items: [
    { keys: ["n"], description: "Neue Aufgabe" },
    { keys: ["/"], description: "Suche öffnen" },
    { keys: ["Esc"], description: "Schließen / Abbrechen" },
  ]},
];

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

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
                            <span key={keyIdx}>
                              <kbd className="px-2 py-1 text-xs font-mono bg-divider border border-border rounded text-text-primary">
                                {key}
                              </kbd>
                              {keyIdx < item.keys.length - 1 && (
                                <span className="mx-1 text-text-muted">dann</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}