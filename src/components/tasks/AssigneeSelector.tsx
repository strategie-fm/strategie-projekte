"use client";

import { useState, useEffect } from "react";
import { User, X, Plus, Check } from "lucide-react";
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
  const unassignedProfiles = profiles.filter((p) => !assignedUserIds.includes(p.id));

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const getDisplayName = (profile: Profile) => {
    return profile.full_name || profile.email.split("@")[0];
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-text-muted">
        <User className="w-4 h-4" />
        <span className="text-sm">Laden...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <User className="w-4 h-4 text-text-muted" />
        
        {/* Assigned Avatars */}
        <div className="flex items-center gap-1">
          {assignees.length > 0 ? (
            <>
              {assignees.map((assignee) => (
                <div
                  key={assignee.user_id}
                  className="group relative flex items-center"
                >
                  {assignee.profile?.avatar_url ? (
                    <img
                      src={assignee.profile.avatar_url}
                      alt={getDisplayName(assignee.profile)}
                      className="w-7 h-7 rounded-full border-2 border-surface"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-medium flex items-center justify-center border-2 border-surface">
                      {getInitials(assignee.profile?.full_name || null, assignee.profile?.email || "")}
                    </div>
                  )}
                  
                  {/* Remove button on hover */}
                  <button
                    onClick={() => handleUnassign(assignee.user_id)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-error text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    title="Zuweisung entfernen"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </>
          ) : (
            <span className="text-sm text-text-muted">Nicht zugewiesen</span>
          )}
          
          {/* Add Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "w-7 h-7 rounded-full border-2 border-dashed flex items-center justify-center transition-colors",
              isOpen
                ? "border-primary bg-primary-surface text-primary"
                : "border-border text-text-muted hover:border-primary hover:text-primary"
            )}
            title="Person zuweisen"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
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
              <p className="text-xs font-medium text-text-muted">Person zuweisen</p>
            </div>
            
            <div className="max-h-64 overflow-y-auto p-1">
              {profiles.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">
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
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={getDisplayName(profile)}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary text-white text-xs font-medium flex items-center justify-center">
                          {getInitials(profile.full_name, profile.email)}
                        </div>
                      )}
                      
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-text-primary">
                          {getDisplayName(profile)}
                        </p>
                        <p className="text-xs text-text-muted">{profile.email}</p>
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