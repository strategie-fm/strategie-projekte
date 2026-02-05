"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { getTeams, getTeam, createTeam, deleteTeam, getProfiles, addTeamMember, removeTeamMember, updateTeamMemberRole } from "@/lib/database";
import type { Team, TeamWithMembers, Profile, TeamRole } from "@/types/database";
import { Users, Plus, X, Trash2, UserPlus, Crown, Shield, User, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const TEAM_COLORS = [
  "#183c6c", "#059669", "#dc2626", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1"
];

// Role configuration with colors and icons
const ROLE_CONFIG: Record<TeamRole, { label: string; color: string; bgColor: string; icon: typeof Crown }> = {
  owner: { label: "Owner", color: "text-amber-600", bgColor: "bg-amber-100", icon: Crown },
  admin: { label: "Admin", color: "text-blue-600", bgColor: "bg-blue-100", icon: Shield },
  member: { label: "Mitglied", color: "text-green-600", bgColor: "bg-green-100", icon: User },
  viewer: { label: "Betrachter", color: "text-gray-600", bgColor: "bg-gray-100", icon: Eye },
};

// Role sort order
const ROLE_ORDER: Record<TeamRole, number> = {
  owner: 0,
  admin: 1,
  member: 2,
  viewer: 3,
};

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<TeamWithMembers | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  // Inline form state
  const [isCreating, setIsCreating] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");
  const [newTeamColor, setNewTeamColor] = useState(TEAM_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (selectedTeam?.id === team.id) {
      setSelectedTeam(null);
    } else {
      const teamWithMembers = await getTeam(team.id);
      setSelectedTeam(teamWithMembers);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const team = await createTeam(newTeamName, newTeamDescription, newTeamColor);
    if (team) {
      setTeams((prev) => [...prev, team]);
      setNewTeamName("");
      setNewTeamDescription("");
      setNewTeamColor(TEAM_COLORS[0]);
      setIsCreating(false);
      // Select the new team
      const teamWithMembers = await getTeam(team.id);
      setSelectedTeam(teamWithMembers);
    }
    setIsSubmitting(false);
  };

  const handleCancelCreate = () => {
    setNewTeamName("");
    setNewTeamDescription("");
    setNewTeamColor(TEAM_COLORS[0]);
    setIsCreating(false);
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm("Team wirklich löschen? Alle Zuweisungen werden entfernt.")) return;

    console.log("Deleting team:", teamId);
    const success = await deleteTeam(teamId);
    console.log("Delete result:", success);

    if (success) {
      setTeams((prev) => prev.filter((t) => t.id !== teamId));
      if (selectedTeam?.id === teamId) {
        setSelectedTeam(null);
      }
    } else {
      alert("Fehler beim Löschen des Teams. Bitte prüfe die Browser-Konsole für Details.");
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

  // Sort members by role
  const sortedMembers = selectedTeam?.members
    ? [...selectedTeam.members].sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role])
    : [];

  return (
    <AppLayout>
      <Header title="Teams" subtitle="Teams verwalten und Berechtigungen steuern" />

      <div className="pt-6 flex gap-6">
        {/* Left Column: Teams List */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <SectionHeader title="Meine Teams" count={teams.length} icon={Users}>
                {!isCreating && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsCreating(true)}
                  >
                    <Plus className="w-4 h-4" />
                    Neues Team
                  </Button>
                )}
              </SectionHeader>

              {/* Inline Create Form */}
              {isCreating && (
                <Card className="p-4 mb-4">
                  <form onSubmit={handleCreateTeam}>
                    <Input
                      type="text"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder="Team-Name..."
                      variant="ghost"
                      className="w-full mb-3 font-medium"
                      style={{ fontSize: "1rem" }}
                      autoFocus
                    />

                    <div className="flex gap-4 mb-4">
                      <FormField label="Beschreibung" className="flex-1">
                        <Input
                          type="text"
                          value={newTeamDescription}
                          onChange={(e) => setNewTeamDescription(e.target.value)}
                          placeholder="Optional"
                          className="w-full"
                        />
                      </FormField>
                    </div>

                    <FormField label="Farbe" className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {TEAM_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setNewTeamColor(color)}
                            className={cn(
                              "w-8 h-8 rounded-lg transition-transform",
                              newTeamColor === color && "ring-2 ring-offset-2 ring-primary scale-110"
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </FormField>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <Button type="button" variant="ghost" onClick={handleCancelCreate}>
                        Abbrechen
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={!newTeamName.trim() || isSubmitting}
                      >
                        {isSubmitting ? "Erstellen..." : "Team erstellen"}
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              {/* Teams List */}
              {teams.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {teams.map((team) => (
                    <Card
                      key={team.id}
                      className={cn(
                        "p-3 cursor-pointer transition-all hover:border-primary",
                        selectedTeam?.id === team.id && "border-primary bg-primary-surface"
                      )}
                      onClick={() => handleSelectTeam(team)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold shrink-0"
                          style={{ backgroundColor: team.color }}
                        >
                          {team.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-primary truncate">
                            {team.name}
                          </p>
                          {team.description && (
                            <p className="text-sm text-text-muted truncate">
                              {team.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : !isCreating ? (
                <EmptyState
                  icon={Users}
                  title="Keine Teams"
                  description="Erstelle dein erstes Team"
                >
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsCreating(true)}
                    className="mt-4"
                  >
                    <Plus className="w-4 h-4" />
                    Team erstellen
                  </Button>
                </EmptyState>
              ) : null}
            </>
          )}
        </div>

        {/* Right Column: Team Details - sticky */}
        {selectedTeam && (
          <div className="w-[500px] shrink min-w-[320px] sticky top-6 self-start max-h-[calc(100vh-120px)] overflow-y-auto">
            <Card>
              {/* Team Header */}
              <div className="p-6 border-b border-border">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold shrink-0"
                      style={{ backgroundColor: selectedTeam.color }}
                    >
                      {selectedTeam.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-text-primary">
                        {selectedTeam.name}
                      </h2>
                      {selectedTeam.description && (
                        <p className="text-sm text-text-muted mt-0.5">
                          {selectedTeam.description}
                        </p>
                      )}
                      <p className="text-sm text-text-muted mt-1">
                        {selectedTeam.members.length} Mitglieder
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTeam(null)}
                      title="Schließen"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTeam(selectedTeam.id)}
                      className="text-text-muted hover:text-error hover:bg-error/10"
                      title="Team löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Members */}
              <div className="p-6">
                <SectionHeader title="Mitglieder" count={sortedMembers.length}>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowAddMemberModal(true)}
                  >
                    <UserPlus className="w-4 h-4" />
                    Hinzufügen
                  </Button>
                </SectionHeader>

                <div className="space-y-2">
                  {sortedMembers.map((member) => {
                    const profile = member.profile;
                    const displayName = profile?.full_name || profile?.email.split("@")[0] || "Unbekannt";
                    const roleConfig = ROLE_CONFIG[member.role];
                    const RoleIcon = roleConfig.icon;

                    return (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-background"
                      >
                        {profile?.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={displayName}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-medium text-sm">
                            {getInitials(profile?.full_name || null, profile?.email || "")}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-primary text-sm">
                            {displayName}
                          </p>
                          <p className="text-xs text-text-muted truncate">
                            {profile?.email}
                          </p>
                        </div>

                        {/* Role Badge */}
                        <div
                          className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
                            roleConfig.bgColor,
                            roleConfig.color
                          )}
                        >
                          <RoleIcon className="w-3 h-3" />
                          {roleConfig.label}
                        </div>

                        {/* Role Change Dropdown (only for non-owners) */}
                        {member.role !== "owner" && (
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateRole(member.user_id, e.target.value as TeamRole)}
                            className="px-2 py-1 text-xs rounded-lg border border-border bg-surface cursor-pointer"
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Mitglied</option>
                            <option value="viewer">Betrachter</option>
                          </select>
                        )}

                        {/* Remove Button (only for non-owners) */}
                        {member.role !== "owner" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.user_id)}
                            className="text-text-muted hover:text-error hover:bg-error/10"
                            title="Entfernen"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      <Modal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        title="Mitglied hinzufügen"
        size="sm"
      >
        <div className="p-6">
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
            <EmptyState
              icon={Users}
              title="Alle hinzugefügt"
              description="Alle Benutzer sind bereits Mitglied"
              className="mb-0"
            />
          )}
        </div>
      </Modal>
    </AppLayout>
  );
}
