"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Header } from "@/components/layout/Header";
import { getTeams, getTeam, createTeam, deleteTeam, getProfiles, addTeamMember, removeTeamMember, updateTeamMemberRole } from "@/lib/database";
import type { Team, TeamWithMembers, Profile, TeamRole } from "@/types/database";
import { Users, Plus, X, Trash2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

const TEAM_COLORS = [
  "#183c6c", "#059669", "#dc2626", "#f59e0b", "#8b5cf6", 
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1"
];

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<TeamWithMembers | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  // Create team form
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");
  const [newTeamColor, setNewTeamColor] = useState(TEAM_COLORS[0]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [teamsData, profilesData] = await Promise.all([
      getTeams(),
      getProfiles(),
    ]);
    setTeams(teamsData);
    setProfiles(profilesData);
    setLoading(false);
  };

  const handleSelectTeam = async (team: Team) => {
    const teamWithMembers = await getTeam(team.id);
    setSelectedTeam(teamWithMembers);
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;

    const team = await createTeam(newTeamName, newTeamDescription, newTeamColor);
    if (team) {
      setTeams((prev) => [...prev, team]);
      setShowCreateModal(false);
      setNewTeamName("");
      setNewTeamDescription("");
      setNewTeamColor(TEAM_COLORS[0]);
      // Select the new team
      const teamWithMembers = await getTeam(team.id);
      setSelectedTeam(teamWithMembers);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm("Team wirklich löschen? Alle Zuweisungen werden entfernt.")) return;

    const success = await deleteTeam(teamId);
    if (success) {
      setTeams((prev) => prev.filter((t) => t.id !== teamId));
      if (selectedTeam?.id === teamId) {
        setSelectedTeam(null);
      }
    }
  };

  const handleAddMember = async (userId: string, role: TeamRole = "member") => {
    if (!selectedTeam) return;

    const member = await addTeamMember(selectedTeam.id, userId, role);
    if (member) {
      setSelectedTeam((prev) => prev ? {
        ...prev,
        members: [...prev.members, member],
      } : null);
      setShowAddMemberModal(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedTeam) return;
    if (!confirm("Mitglied wirklich entfernen?")) return;

    const success = await removeTeamMember(selectedTeam.id, userId);
    if (success) {
      setSelectedTeam((prev) => prev ? {
        ...prev,
        members: prev.members.filter((m) => m.user_id !== userId),
      } : null);
    }
  };

  const handleUpdateRole = async (userId: string, role: TeamRole) => {
    if (!selectedTeam) return;

    const success = await updateTeamMemberRole(selectedTeam.id, userId, role);
    if (success) {
      setSelectedTeam((prev) => prev ? {
        ...prev,
        members: prev.members.map((m) =>
          m.user_id === userId ? { ...m, role } : m
        ),
      } : null);
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const availableProfiles = profiles.filter(
    (p) => !selectedTeam?.members.some((m) => m.user_id === p.id)
  );

  return (
    <AppLayout>
      <Header title="Teams" subtitle="Teams verwalten und Berechtigungen steuern" />

      <div className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Teams List */}
              <div className="lg:col-span-1">
                <div className="bg-surface rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-text-primary">Meine Teams</h2>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="p-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
                      title="Neues Team"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {teams.length > 0 ? (
                    <div className="space-y-2">
                      {teams.map((team) => (
                        <button
                          key={team.id}
                          onClick={() => handleSelectTeam(team)}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                            selectedTeam?.id === team.id
                              ? "bg-primary-surface border border-primary"
                              : "hover:bg-divider"
                          )}
                        >
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
                            style={{ backgroundColor: team.color }}
                          >
                            {team.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-text-primary truncate">
                              {team.name}
                            </p>
                            {team.description && (
                              <p className="text-xs text-text-muted truncate">
                                {team.description}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-text-muted mx-auto mb-3" />
                      <p className="text-text-muted mb-2">Keine Teams</p>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="text-sm text-primary hover:underline"
                      >
                        Erstes Team erstellen
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Team Details */}
              <div className="lg:col-span-2">
                {selectedTeam ? (
                  <div className="bg-surface rounded-xl border border-border">
                    {/* Team Header */}
                    <div className="p-6 border-b border-border">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold"
                            style={{ backgroundColor: selectedTeam.color }}
                          >
                            {selectedTeam.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h2 className="text-xl font-semibold text-text-primary">
                              {selectedTeam.name}
                            </h2>
                            {selectedTeam.description && (
                              <p className="text-text-muted mt-1">
                                {selectedTeam.description}
                              </p>
                            )}
                            <p className="text-sm text-text-muted mt-2">
                              {selectedTeam.members.length} Mitglieder
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteTeam(selectedTeam.id)}
                          className="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error-light transition-colors"
                          title="Team löschen"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Members */}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-text-primary">Mitglieder</h3>
                        <button
                          onClick={() => setShowAddMemberModal(true)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-white text-sm hover:bg-primary-dark transition-colors"
                        >
                          <UserPlus className="w-4 h-4" />
                          Hinzufügen
                        </button>
                      </div>

                      <div className="space-y-3">
                        {selectedTeam.members.map((member) => {
                          const profile = member.profile;
                          const displayName = profile?.full_name || profile?.email.split("@")[0] || "Unbekannt";

                          return (
                            <div
                              key={member.id}
                              className="flex items-center gap-4 p-4 rounded-lg border border-border"
                            >
                              {profile?.avatar_url ? (
                                <img
                                  src={profile.avatar_url}
                                  alt={displayName}
                                  className="w-12 h-12 rounded-full"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-medium">
                                  {getInitials(profile?.full_name || null, profile?.email || "")}
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-text-primary">
                                  {displayName}
                                </p>
                                <p className="text-sm text-text-muted">
                                  {profile?.email}
                                </p>
                              </div>

                              <div className="flex items-center gap-3">
                                <select
                                  value={member.role}
                                  onChange={(e) => handleUpdateRole(member.user_id, e.target.value as TeamRole)}
                                  className="px-3 py-1.5 rounded-lg border border-border bg-surface text-sm"
                                  disabled={member.role === "owner"}
                                >
                                  <option value="owner">Owner</option>
                                  <option value="admin">Admin</option>
                                  <option value="member">Mitglied</option>
                                  <option value="viewer">Betrachter</option>
                                </select>

                                {member.role !== "owner" && (
                                  <button
                                    onClick={() => handleRemoveMember(member.user_id)}
                                    className="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error-light transition-colors"
                                    title="Entfernen"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-surface rounded-xl border border-border p-12 text-center">
                    <Users className="w-16 h-16 text-text-muted mx-auto mb-4" />
                    <p className="text-text-muted">
                      Wähle ein Team aus oder erstelle ein neues
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl w-full max-w-md p-6 m-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-text-primary">Neues Team</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-lg hover:bg-divider transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="z.B. Marketing Team"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted focus:border-primary outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Beschreibung
                </label>
                <textarea
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  placeholder="Optional"
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted focus:border-primary outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Farbe
                </label>
                <div className="flex flex-wrap gap-2">
                  {TEAM_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewTeamColor(color)}
                      className={cn(
                        "w-8 h-8 rounded-lg transition-transform",
                        newTeamColor === color && "ring-2 ring-offset-2 ring-primary scale-110"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg border border-border text-text-secondary hover:bg-divider transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreateTeam}
                disabled={!newTeamName.trim()}
                className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                Erstellen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl w-full max-w-md p-6 m-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-text-primary">Mitglied hinzufügen</h2>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="p-2 rounded-lg hover:bg-divider transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {availableProfiles.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableProfiles.map((profile) => {
                  const displayName = profile.full_name || profile.email.split("@")[0];

                  return (
                    <button
                      key={profile.id}
                      onClick={() => handleAddMember(profile.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-divider transition-colors text-left"
                    >
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={displayName}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-medium">
                          {getInitials(profile.full_name, profile.email)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-text-primary">{displayName}</p>
                        <p className="text-sm text-text-muted">{profile.email}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-text-muted py-8">
                Alle Benutzer sind bereits Mitglied
              </p>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}