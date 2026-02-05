"use client";

import { useState, useEffect, useCallback } from "react";
import { getTeams, getProjectTeamAccess, grantProjectAccess, updateProjectAccess, revokeProjectAccess } from "@/lib/database";
import type { Team, ProjectTeamAccess as ProjectTeamAccessType, AccessLevel } from "@/types/database";
import { Users, Plus, X, Shield, Edit, Eye, Globe } from "lucide-react";

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
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<AccessLevel>("edit");
  const [isAdding, setIsAdding] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [teamsData, accessData] = await Promise.all([
      getTeams(),
      getProjectTeamAccess(projectId),
    ]);
    setTeams(teamsData);
    setProjectAccess(accessData);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGrantAccess = async () => {
    if (!selectedTeamId || isAdding) return;

    setIsAdding(true);
    const access = await grantProjectAccess(projectId, selectedTeamId, selectedAccessLevel);
    if (access) {
      setProjectAccess((prev) => [...prev, access]);
      setShowAddTeam(false);
      setSelectedTeamId("");
      setSelectedAccessLevel("edit");
    }
    setIsAdding(false);
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
      {/* Header with visibility status */}
      <div className="flex items-center gap-3 mb-6 p-4 bg-divider/50 rounded-lg">
        {projectAccess.length > 0 ? (
          <>
            <Users className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-text-primary">
                {projectAccess.length} {projectAccess.length === 1 ? "Team hat" : "Teams haben"} Zugriff
              </p>
              <p className="text-xs text-text-muted">
                Nur Teammitglieder können diese Aufgabenliste sehen
              </p>
            </div>
          </>
        ) : (
          <>
            <Globe className="w-5 h-5 text-text-muted" />
            <div>
              <p className="text-sm font-medium text-text-primary">Öffentlich</p>
              <p className="text-xs text-text-muted">
                Alle Benutzer können diese Aufgabenliste sehen
              </p>
            </div>
          </>
        )}
      </div>

      {/* Team list */}
      {projectAccess.length > 0 && (
        <div className="space-y-2 mb-4">
          {projectAccess.map((access) => {
            const team = access.team;
            if (!team) return null;

            return (
              <div
                key={access.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-semibold text-xs flex-shrink-0"
                  style={{ backgroundColor: team.color }}
                >
                  {team.name.slice(0, 2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{team.name}</p>
                </div>

                <select
                  value={access.access_level}
                  onChange={(e) => handleUpdateAccess(access.team_id, e.target.value as AccessLevel)}
                  className="px-2 py-1.5 rounded-lg border border-border bg-surface text-sm text-text-primary cursor-pointer hover:border-primary/50 transition-colors"
                >
                  {ACCESS_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => handleRevokeAccess(access.team_id)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error-light transition-colors"
                  title="Zugriff entfernen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Team Section */}
      {availableTeams.length > 0 ? (
        showAddTeam ? (
          <div className="p-4 border border-primary/30 rounded-lg bg-primary-surface/30">
            <div className="flex items-center gap-3 mb-4">
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary"
              >
                <option value="">Team auswählen...</option>
                {availableTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedAccessLevel}
                onChange={(e) => setSelectedAccessLevel(e.target.value as AccessLevel)}
                className="px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary"
              >
                {ACCESS_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-text-muted">
                {ACCESS_LEVELS.find(l => l.value === selectedAccessLevel)?.description}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowAddTeam(false);
                    setSelectedTeamId("");
                    setSelectedAccessLevel("edit");
                  }}
                  className="px-3 py-1.5 text-sm text-text-secondary hover:bg-divider rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleGrantAccess}
                  disabled={!selectedTeamId || isAdding}
                  className="px-3 py-1.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-variant disabled:opacity-50 transition-colors"
                >
                  {isAdding ? "Hinzufügen..." : "Hinzufügen"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddTeam(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-lg text-text-muted hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">Team hinzufügen</span>
          </button>
        )
      ) : teams.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-border rounded-lg">
          <Users className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-muted">
            Keine Teams verfügbar
          </p>
          <p className="text-xs text-text-muted mt-1">
            Erstelle zuerst ein Team unter &quot;Teams&quot;
          </p>
        </div>
      ) : null}
    </div>
  );
}
