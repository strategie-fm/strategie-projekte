"use client";

import { useState, useEffect } from "react";
import { getTeams, getProjectTeamAccess, grantProjectAccess, updateProjectAccess, revokeProjectAccess } from "@/lib/database";
import type { Team, ProjectTeamAccess as ProjectTeamAccessType, AccessLevel } from "@/types/database";
import { Users, Plus, X, Shield, Edit, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectTeamAccessProps {
  projectId: string;
}

const ACCESS_LEVELS: { value: AccessLevel; label: string; icon: typeof Shield; description: string }[] = [
  { value: "admin", label: "Admin", icon: Shield, description: "Vollzugriff inkl. Team-Verwaltung" },
  { value: "edit", label: "Bearbeiten", icon: Edit, description: "Aufgaben erstellen und bearbeiten" },
  { value: "view", label: "Ansehen", icon: Eye, description: "Nur lesen" },
];

export function ProjectTeamAccess({ projectId }: ProjectTeamAccessProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [projectAccess, setProjectAccess] = useState<ProjectTeamAccessType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<AccessLevel>("view");

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);
    const [teamsData, accessData] = await Promise.all([
      getTeams(),
      getProjectTeamAccess(projectId),
    ]);
    setTeams(teamsData);
    setProjectAccess(accessData);
    setLoading(false);
  };

  const handleGrantAccess = async () => {
    if (!selectedTeamId) return;

    const access = await grantProjectAccess(projectId, selectedTeamId, selectedAccessLevel);
    if (access) {
      setProjectAccess((prev) => [...prev, access]);
      setShowAddModal(false);
      setSelectedTeamId("");
      setSelectedAccessLevel("view");
    }
  };

  const handleUpdateAccess = async (teamId: string, accessLevel: AccessLevel) => {
    const success = await updateProjectAccess(projectId, teamId, accessLevel);
    if (success) {
      setProjectAccess((prev) =>
        prev.map((a) => (a.team_id === teamId ? { ...a, access_level: accessLevel } : a))
      );
    }
  };

  const handleRevokeAccess = async (teamId: string) => {
    if (!confirm("Zugriff für dieses Team wirklich entfernen?")) return;

    const success = await revokeProjectAccess(projectId, teamId);
    if (success) {
      setProjectAccess((prev) => prev.filter((a) => a.team_id !== teamId));
    }
  };

  const availableTeams = teams.filter(
    (t) => !projectAccess.some((a) => a.team_id === t.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-text-primary">Team-Zugriff</h3>
          <p className="text-sm text-text-muted mt-1">
            Bestimme welche Teams diese Aufgabenliste sehen und bearbeiten dürfen
          </p>
        </div>
        {availableTeams.length > 0 && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-white text-sm hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Team hinzufügen
          </button>
        )}
      </div>

      {projectAccess.length > 0 ? (
        <div className="space-y-3">
          {projectAccess.map((access) => {
            const team = access.team;
            if (!team) return null;

            return (
              <div
                key={access.id}
                className="flex items-center gap-4 p-4 rounded-lg border border-border"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
                  style={{ backgroundColor: team.color }}
                >
                  {team.name.slice(0, 2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary">{team.name}</p>
                  {team.description && (
                    <p className="text-sm text-text-muted truncate">{team.description}</p>
                  )}
                </div>

                <select
                  value={access.access_level}
                  onChange={(e) => handleUpdateAccess(access.team_id, e.target.value as AccessLevel)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-surface text-sm"
                >
                  {ACCESS_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => handleRevokeAccess(access.team_id)}
                  className="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error-light transition-colors"
                  title="Zugriff entfernen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 border border-dashed border-border rounded-lg">
          <Users className="w-10 h-10 text-text-muted mx-auto mb-2" />
          <p className="text-text-muted mb-1">Kein Team hat Zugriff</p>
          <p className="text-sm text-text-muted mb-3">
            Nur du kannst diese Aufgabenliste aktuell sehen
          </p>
          {availableTeams.length > 0 ? (
            <button
              onClick={() => setShowAddModal(true)}
              className="text-sm text-primary hover:underline"
            >
              Team hinzufügen
            </button>
          ) : (
            <p className="text-sm text-text-muted">
              Erstelle zuerst ein Team unter "Teams"
            </p>
          )}
        </div>
      )}

      {/* Add Team Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-surface rounded-xl w-full max-w-md p-6 m-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-text-primary">Team Zugriff gewähren</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg hover:bg-divider transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Team auswählen
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableTeams.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => setSelectedTeamId(team.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                        selectedTeamId === team.id
                          ? "bg-primary-surface border border-primary"
                          : "border border-border hover:border-primary"
                      )}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-xs"
                        style={{ backgroundColor: team.color }}
                      >
                        {team.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{team.name}</p>
                        {team.description && (
                          <p className="text-xs text-text-muted">{team.description}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Zugriffsstufe
                </label>
                <div className="space-y-2">
                  {ACCESS_LEVELS.map((level) => {
                    const Icon = level.icon;
                    return (
                      <button
                        key={level.value}
                        onClick={() => setSelectedAccessLevel(level.value)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                          selectedAccessLevel === level.value
                            ? "bg-primary-surface border border-primary"
                            : "border border-border hover:border-primary"
                        )}
                      >
                        <Icon className={cn(
                          "w-5 h-5",
                          selectedAccessLevel === level.value ? "text-primary" : "text-text-muted"
                        )} />
                        <div>
                          <p className="font-medium text-text-primary">{level.label}</p>
                          <p className="text-xs text-text-muted">{level.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg border border-border text-text-secondary hover:bg-divider transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleGrantAccess}
                disabled={!selectedTeamId}
                className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                Zugriff gewähren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
