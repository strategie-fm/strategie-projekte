"use client";

import { useState, useEffect, useCallback } from "react";
import { RotateCcw, X, Calendar, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskRecurrence, RecurrenceType } from "@/types/database";
import { getTaskRecurrence, createTaskRecurrence, updateTaskRecurrence, deleteTaskRecurrence } from "@/lib/database";

interface RecurrenceSelectorProps {
  taskId: string;
  dueDate: string | null;
  onRecurrenceChange?: (recurrence: TaskRecurrence | null) => void;
}

const RECURRENCE_OPTIONS: { value: RecurrenceType | "none"; label: string }[] = [
  { value: "none", label: "Keine Wiederholung" },
  { value: "daily", label: "Täglich" },
  { value: "weekly", label: "Wöchentlich" },
  { value: "monthly", label: "Monatlich" },
  { value: "yearly", label: "Jährlich" },
  { value: "custom", label: "Benutzerdefiniert..." },
];

const WEEKDAYS = [
  { value: 1, label: "Mo" },
  { value: 2, label: "Di" },
  { value: 3, label: "Mi" },
  { value: 4, label: "Do" },
  { value: 5, label: "Fr" },
  { value: 6, label: "Sa" },
  { value: 0, label: "So" },
];

export function RecurrenceSelector({ taskId, dueDate, onRecurrenceChange }: RecurrenceSelectorProps) {
  const [recurrence, setRecurrence] = useState<TaskRecurrence | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [loading, setLoading] = useState(true);

  // Custom settings
  const [customType, setCustomType] = useState<RecurrenceType>("daily");
  const [customInterval, setCustomInterval] = useState(1);
  const [customWeekdays, setCustomWeekdays] = useState<number[]>([1]); // Monday default
  const [customMonthDay, setCustomMonthDay] = useState(1);
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [customEndAfter, setCustomEndAfter] = useState<number | null>(null);

  const loadRecurrence = useCallback(async () => {
    setLoading(true);
    const data = await getTaskRecurrence(taskId);
    setRecurrence(data);
    if (data) {
      setCustomType(data.recurrence_type);
      setCustomInterval(data.interval_value);
      if (data.weekdays) setCustomWeekdays(data.weekdays);
      if (data.month_day) setCustomMonthDay(data.month_day);
      if (data.end_date) setCustomEndDate(data.end_date);
      if (data.end_after_count) setCustomEndAfter(data.end_after_count);
    }
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    loadRecurrence();
  }, [loadRecurrence]);

  const handleSelectType = async (type: RecurrenceType | "none") => {
    if (type === "none") {
      // Löschen
      if (recurrence) {
        await deleteTaskRecurrence(taskId);
        setRecurrence(null);
        onRecurrenceChange?.(null);
      }
      setIsOpen(false);
      return;
    }

    if (type === "custom") {
      setShowCustom(true);
      setIsOpen(false);
      return;
    }

    // Einfache Wiederholung erstellen
    const nextDue = dueDate || new Date().toISOString().split("T")[0];
    
    if (recurrence) {
      const updated = await updateTaskRecurrence(taskId, {
        recurrence_type: type,
        interval_value: 1,
        weekdays: type === "weekly" ? [new Date(nextDue).getDay()] : null,
        month_day: type === "monthly" ? new Date(nextDue).getDate() : null,
        next_due_date: nextDue,
      });
      if (updated) {
        setRecurrence(updated);
        onRecurrenceChange?.(updated);
      }
    } else {
      const created = await createTaskRecurrence({
        task_id: taskId,
        recurrence_type: type,
        interval_value: 1,
        weekdays: type === "weekly" ? [new Date(nextDue).getDay()] : null,
        month_day: type === "monthly" ? new Date(nextDue).getDate() : null,
        next_due_date: nextDue,
      });
      if (created) {
        setRecurrence(created);
        onRecurrenceChange?.(created);
      }
    }
    
    setIsOpen(false);
  };

  const handleSaveCustom = async () => {
    const nextDue = dueDate || new Date().toISOString().split("T")[0];
    
    const data = {
      task_id: taskId,
      recurrence_type: customType,
      interval_value: customInterval,
      weekdays: customType === "weekly" ? customWeekdays : null,
      month_day: customType === "monthly" ? customMonthDay : null,
      end_date: customEndDate || null,
      end_after_count: customEndAfter,
      next_due_date: nextDue,
    };

    if (recurrence) {
      const updated = await updateTaskRecurrence(taskId, data);
      if (updated) {
        setRecurrence(updated);
        onRecurrenceChange?.(updated);
      }
    } else {
      const created = await createTaskRecurrence(data);
      if (created) {
        setRecurrence(created);
        onRecurrenceChange?.(created);
      }
    }
    
    setShowCustom(false);
  };

  const toggleWeekday = (day: number) => {
    setCustomWeekdays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const getRecurrenceLabel = () => {
    if (!recurrence) return null;
    
    const { recurrence_type, interval_value, weekdays } = recurrence;
    
    if (interval_value === 1) {
      switch (recurrence_type) {
        case "daily": return "Täglich";
        case "weekly": 
          if (weekdays && weekdays.length > 0 && weekdays.length < 7) {
            const dayNames = weekdays.map(d => WEEKDAYS.find(w => w.value === d)?.label).join(", ");
            return `Wöchentlich (${dayNames})`;
          }
          return "Wöchentlich";
        case "monthly": return "Monatlich";
        case "yearly": return "Jährlich";
        default: return "Wiederkehrend";
      }
    } else {
      switch (recurrence_type) {
        case "daily": return `Alle ${interval_value} Tage`;
        case "weekly": return `Alle ${interval_value} Wochen`;
        case "monthly": return `Alle ${interval_value} Monate`;
        case "yearly": return `Alle ${interval_value} Jahre`;
        default: return "Wiederkehrend";
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-text-muted text-sm">
        <RotateCcw className="w-4 h-4 animate-spin" />
        <span>Laden...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
          recurrence 
            ? "bg-primary-surface text-primary" 
            : "bg-divider text-text-secondary hover:bg-border"
        )}
      >
        <RotateCcw className="w-4 h-4" />
        <span>{recurrence ? getRecurrenceLabel() : "Wiederholung"}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-56 bg-surface border border-border rounded-lg shadow-lg z-50 py-1">
            {RECURRENCE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelectType(option.value)}
                className={cn(
                  "w-full px-4 py-2 text-left text-sm hover:bg-divider transition-colors flex items-center justify-between",
                  recurrence?.recurrence_type === option.value && option.value !== "none" && option.value !== "custom"
                    ? "bg-primary-surface text-primary"
                    : "text-text-primary"
                )}
              >
                {option.label}
                {recurrence?.recurrence_type === option.value && option.value !== "none" && option.value !== "custom" && (
                  <span className="text-primary">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Custom Modal */}
      {showCustom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-surface rounded-xl w-full max-w-md p-6 m-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-text-primary">Benutzerdefinierte Wiederholung</h2>
              <button
                onClick={() => setShowCustom(false)}
                className="p-2 rounded-lg hover:bg-divider transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Interval */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Wiederholen alle
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={customInterval}
                    onChange={(e) => setCustomInterval(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 px-3 py-2 rounded-lg border border-border bg-surface text-sm"
                  />
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value as RecurrenceType)}
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-sm"
                  >
                    <option value="daily">Tag(e)</option>
                    <option value="weekly">Woche(n)</option>
                    <option value="monthly">Monat(e)</option>
                    <option value="yearly">Jahr(e)</option>
                  </select>
                </div>
              </div>

              {/* Weekdays (for weekly) */}
              {customType === "weekly" && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    An diesen Tagen
                  </label>
                  <div className="flex gap-1">
                    {WEEKDAYS.map((day) => (
                      <button
                        key={day.value}
                        onClick={() => toggleWeekday(day.value)}
                        className={cn(
                          "w-9 h-9 rounded-lg text-sm font-medium transition-colors",
                          customWeekdays.includes(day.value)
                            ? "bg-primary text-white"
                            : "bg-divider text-text-secondary hover:bg-border"
                        )}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Month day (for monthly) */}
              {customType === "monthly" && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Am Tag des Monats
                  </label>
                  <select
                    value={customMonthDay}
                    onChange={(e) => setCustomMonthDay(parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>
                        {day}. des Monats
                      </option>
                    ))}
                    <option value={-1}>Letzter Tag des Monats</option>
                  </select>
                </div>
              )}

              {/* End condition */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Endet
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="endType"
                      checked={!customEndDate && !customEndAfter}
                      onChange={() => { setCustomEndDate(""); setCustomEndAfter(null); }}
                      className="text-primary"
                    />
                    <span className="text-sm text-text-primary">Nie</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="endType"
                      checked={!!customEndDate}
                      onChange={() => { setCustomEndAfter(null); setCustomEndDate(new Date().toISOString().split("T")[0]); }}
                      className="text-primary"
                    />
                    <span className="text-sm text-text-primary">Am</span>
                    {customEndDate && (
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="px-2 py-1 rounded border border-border bg-surface text-sm"
                      />
                    )}
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="endType"
                      checked={!!customEndAfter}
                      onChange={() => { setCustomEndDate(""); setCustomEndAfter(10); }}
                      className="text-primary"
                    />
                    <span className="text-sm text-text-primary">Nach</span>
                    {customEndAfter && (
                      <>
                        <input
                          type="number"
                          min="1"
                          max="999"
                          value={customEndAfter}
                          onChange={(e) => setCustomEndAfter(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-16 px-2 py-1 rounded border border-border bg-surface text-sm"
                        />
                        <span className="text-sm text-text-primary">Wiederholungen</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCustom(false)}
                className="px-4 py-2 rounded-lg border border-border text-text-secondary hover:bg-divider transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSaveCustom}
                disabled={customType === "weekly" && customWeekdays.length === 0}
                className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
