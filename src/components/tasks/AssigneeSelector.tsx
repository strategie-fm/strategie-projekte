"use client";

import { useState, useEffect } from "react";
import { User, Plus, Check, X } from "lucide-react";
import { getProfiles, getTaskAssignees, assignTask, unassignTask } from "@/lib/database";
import type { Profile, TaskAssignee } from "@/types/database";
import { cn } from "@/lib/utils";

interface AssigneeSelectorProps {
  taskId: string;
  onChange?: () => void;
}

export function AssigneeSelector({ taskId, onChange }: AssigneeSelectorProps) {
  const [assignees, setAssignees] = useState<TaskAssignee[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [assigneesData, profilesData] = await Promise.all([
        getTaskAssignees(taskId),
        getProfiles(),
      ]);
      setAssignees(assigneesData);
      setProfiles(profilesData);
      setLoading(false);
    };
    loadData();
  }, [taskId]);

  const handleAssign = async (userId: string) => {
    const result = await assignTask(taskId, userId);
    if (result) {
      setAssignees((prev) => [...prev, result]);
      onChange?.();
      window.dispatchEvent(new CustomEvent("assigneesChanged", { detail: taskId }));
    }
  };

  const handleUnassign = async (userId: string) => {
    const success = await unassignTask(taskId, userId);
    if (success) {
      setAssignees((prev) => prev.filter((a) => a.user_id !== userId));
      onChange?.();
      window.dispatchEvent(new CustomEvent("assigneesChanged", { detail: taskId }));
    }
  };

  const assignedUserIds = assignees.map((a) => a.user_id);

  const getDisplayName = (profile: Profile | undefined) => {
    if (!profile) return "Unbekannt";
    return profile.full_name || profile.email.split("@")[0];
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-label-md text-text-muted">
          <User className="w-4 h-4" />
          <span>Zugewiesen</span>
        </div>
        <div className="text-text-muted" style={{ fontSize: "0.875rem", lineHeight: 1.5 }}>Laden...</div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Label */}
      <div className="flex items-center gap-2 text-label-md text-text-muted mb-1.5">
        <User className="w-4 h-4" />
        <span>Zugewiesen</span>
      </div>

      {/* Assigned Users as Buttons */}
      <div className="flex flex-wrap gap-1">
        {assignees.length > 0 ? (
          assignees.map((assignee) => (
            <button
              key={assignee.user_id}
              onClick={() => handleUnassign(assignee.user_id)}
              className="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary text-white font-medium transition-all hover:bg-primary-variant"
              style={{ fontSize: "0.875rem", lineHeight: 1.5 }}
            >
              {getDisplayName(assignee.profile)}
              <X className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
            </button>
          ))
        ) : (
          <span className="px-2.5 py-1 text-text-muted" style={{ fontSize: "0.875rem", lineHeight: 1.5 }}>Nicht zugewiesen</span>
        )}

        {/* Add Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-lg border-2 border-dashed font-medium transition-colors",
            isOpen
              ? "border-primary bg-primary-surface text-primary"
              : "border-border text-text-muted hover:border-primary hover:text-primary"
          )}
          style={{ fontSize: "0.875rem", lineHeight: 1.5 }}
        >
          <Plus className="w-3.5 h-3.5" />
          Hinzufügen
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-64 bg-surface border border-border rounded-lg shadow-lg z-20 overflow-hidden">
            <div className="p-2 border-b border-border">
              <p className="text-label-md font-medium text-text-muted">Person zuweisen</p>
            </div>

            <div className="max-h-64 overflow-y-auto p-1">
              {profiles.length === 0 ? (
                <p className="text-text-muted text-center py-4" style={{ fontSize: "0.875rem", lineHeight: 1.5 }}>
                  Keine Benutzer gefunden
                </p>
              ) : (
                profiles.map((profile) => {
                  const isAssigned = assignedUserIds.includes(profile.id);

                  return (
                    <button
                      key={profile.id}
                      onClick={() => {
                        if (isAssigned) {
                          handleUnassign(profile.id);
                        } else {
                          handleAssign(profile.id);
                        }
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 p-2 rounded-lg transition-colors",
                        isAssigned
                          ? "bg-primary-surface"
                          : "hover:bg-divider"
                      )}
                    >
                      <div className="flex-1 text-left">
                        <p className="font-medium text-text-primary" style={{ fontSize: "0.875rem", lineHeight: 1.5 }}>
                          {getDisplayName(profile)}
                        </p>
                        <p className="text-label-sm text-text-muted">{profile.email}</p>
                      </div>

                      {isAssigned && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
