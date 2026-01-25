import { useState } from 'react';
import { Plus, Edit2, Trash2, Users, UserPlus, X } from 'lucide-react';
import {
  Card,
  Button,
  Input,
  Label,
  Select,
  SelectOption,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Textarea,
} from '@/components/ui';
import {
  useTeams,
  useUsers,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  updateTeamMemberRole,
  getUserFullName,
} from '@/hooks';
import type { Team, TeamRole } from '@/types';
import { TEAM_ROLES, TEAM_ROLE_LABELS, USER_ROLE_LABELS } from '@/types';

const TEAM_COLORS = [
  { value: '#3B82F6', label: 'Bleu' },
  { value: '#10B981', label: 'Vert' },
  { value: '#F59E0B', label: 'Orange' },
  { value: '#EF4444', label: 'Rouge' },
  { value: '#8B5CF6', label: 'Violet' },
  { value: '#EC4899', label: 'Rose' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#6B7280', label: 'Gris' },
];

interface TeamFormData {
  nom: string;
  description: string;
  couleur: string;
  responsableId: number | null;
}

export function TeamManagement() {
  const teams = useTeams();
  const users = useUsers();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const [formData, setFormData] = useState<TeamFormData>({
    nom: '',
    description: '',
    couleur: '#3B82F6',
    responsableId: null,
  });

  const [newMemberUserId, setNewMemberUserId] = useState<number | null>(null);
  const [newMemberRole, setNewMemberRole] = useState<TeamRole>('membre');

  const resetForm = () => {
    setFormData({
      nom: '',
      description: '',
      couleur: '#3B82F6',
      responsableId: null,
    });
    setEditingTeam(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      nom: team.nom,
      description: team.description || '',
      couleur: team.couleur,
      responsableId: team.responsableId,
    });
    setIsDialogOpen(true);
  };

  const openMemberDialog = (team: Team) => {
    setSelectedTeam(team);
    setNewMemberUserId(null);
    setNewMemberRole('membre');
    setIsMemberDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom || !formData.responsableId) return;

    if (editingTeam?.id) {
      await updateTeam(editingTeam.id, {
        nom: formData.nom,
        description: formData.description,
        couleur: formData.couleur,
        responsableId: formData.responsableId,
      });
    } else {
      await createTeam({
        nom: formData.nom,
        description: formData.description,
        couleur: formData.couleur,
        responsableId: formData.responsableId,
        membres: [],
        actif: true,
      });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (teamId: number) => {
    if (confirm('Supprimer cette equipe ?')) {
      await deleteTeam(teamId);
    }
  };

  const handleAddMember = async () => {
    if (!selectedTeam?.id || !newMemberUserId) return;
    await addTeamMember(selectedTeam.id, newMemberUserId, newMemberRole);
    setNewMemberUserId(null);
    setNewMemberRole('membre');
    // Refresh the selected team
    const updatedTeams = await teams;
    const updated = (updatedTeams as Team[]).find((t) => t.id === selectedTeam.id);
    if (updated) setSelectedTeam(updated);
  };

  const handleRemoveMember = async (userId: number) => {
    if (!selectedTeam?.id) return;
    await removeTeamMember(selectedTeam.id, userId);
    const updatedTeams = await teams;
    const updated = (updatedTeams as Team[]).find((t) => t.id === selectedTeam.id);
    if (updated) setSelectedTeam(updated);
  };

  const handleUpdateMemberRole = async (userId: number, newRole: TeamRole) => {
    if (!selectedTeam?.id) return;
    await updateTeamMemberRole(selectedTeam.id, userId, newRole);
    const updatedTeams = await teams;
    const updated = (updatedTeams as Team[]).find((t) => t.id === selectedTeam.id);
    if (updated) setSelectedTeam(updated);
  };

  const getUser = (userId: number) => {
    return users.find((u) => u.id === userId);
  };

  const getAvailableMembers = () => {
    if (!selectedTeam) return users;
    const memberIds = selectedTeam.membres.map((m) => m.userId);
    return users.filter((u) => !memberIds.includes(u.id!));
  };

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-primary-900">
            Gestion des equipes
          </h3>
          <p className="text-sm text-primary-500">
            Creer et gerer les equipes et leurs roles
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle equipe
        </Button>
      </div>

      {/* Teams List */}
      <div className="space-y-3">
        {teams.length === 0 ? (
          <div className="text-center py-8 text-primary-500">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Aucune equipe creee</p>
            <p className="text-sm">Cliquez sur "Nouvelle equipe" pour commencer</p>
          </div>
        ) : (
          teams.map((team) => {
            const responsable = getUser(team.responsableId);
            return (
              <div
                key={team.id}
                className="flex items-center justify-between p-4 bg-primary-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: team.couleur }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-primary-900">{team.nom}</h4>
                      {!team.actif && (
                        <Badge variant="secondary" size="sm">
                          Inactif
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-primary-500">
                      {responsable
                        ? `Responsable: ${getUserFullName(responsable)}`
                        : 'Aucun responsable'}
                      {' - '}
                      {team.membres.length} membre{team.membres.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openMemberDialog(team)}
                    title="Gerer les membres"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(team)}
                    title="Modifier"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => team.id && handleDelete(team.id)}
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4 text-error-500" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create/Edit Team Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTeam ? 'Modifier l\'equipe' : 'Nouvelle equipe'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nom">Nom de l'equipe *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) =>
                    setFormData({ ...formData, nom: e.target.value })
                  }
                  placeholder="Ex: Equipe Technique"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Description de l'equipe..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="responsable">Responsable *</Label>
                <Select
                  id="responsable"
                  value={formData.responsableId?.toString() || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      responsableId: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  required
                >
                  <SelectOption value="">Selectionnez un responsable</SelectOption>
                  {users.map((user) => (
                    <SelectOption key={user.id} value={user.id?.toString()}>
                      {getUserFullName(user)} ({USER_ROLE_LABELS[user.role]})
                    </SelectOption>
                  ))}
                </Select>
              </div>

              <div>
                <Label>Couleur</Label>
                <div className="flex gap-2 mt-2">
                  {TEAM_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.couleur === color.value
                          ? 'border-primary-900 scale-110'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() =>
                        setFormData({ ...formData, couleur: color.value })
                      }
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit">
                {editingTeam ? 'Enregistrer' : 'Creer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Members Dialog */}
      <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Membres de l'equipe: {selectedTeam?.nom}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Add Member Form */}
            <div className="p-4 bg-primary-50 rounded-lg">
              <h4 className="font-medium text-primary-900 mb-3">
                Ajouter un membre
              </h4>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Select
                    value={newMemberUserId?.toString() || ''}
                    onChange={(e) =>
                      setNewMemberUserId(
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                  >
                    <SelectOption value="">Selectionnez un utilisateur</SelectOption>
                    {getAvailableMembers().map((user) => (
                      <SelectOption key={user.id} value={user.id?.toString()}>
                        {getUserFullName(user)}
                      </SelectOption>
                    ))}
                  </Select>
                </div>
                <div className="w-48">
                  <Select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as TeamRole)}
                  >
                    {TEAM_ROLES.map((role) => (
                      <SelectOption key={role} value={role}>
                        {TEAM_ROLE_LABELS[role]}
                      </SelectOption>
                    ))}
                  </Select>
                </div>
                <Button
                  onClick={handleAddMember}
                  disabled={!newMemberUserId}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Members List */}
            <div className="space-y-2">
              <h4 className="font-medium text-primary-900">
                Membres actuels ({selectedTeam?.membres.length || 0})
              </h4>
              {selectedTeam?.membres.length === 0 ? (
                <p className="text-sm text-primary-500 py-4 text-center">
                  Aucun membre dans cette equipe
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {selectedTeam?.membres.map((member) => {
                    const user = getUser(member.userId);
                    if (!user) return null;
                    return (
                      <div
                        key={member.userId}
                        className="flex items-center justify-between p-3 bg-white border border-primary-200 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-primary-900">
                            {getUserFullName(user)}
                          </p>
                          <p className="text-xs text-primary-500">
                            Ajoute le{' '}
                            {new Date(member.dateAjout).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            className="w-44"
                            value={member.role}
                            onChange={(e) =>
                              handleUpdateMemberRole(
                                member.userId,
                                e.target.value as TeamRole
                              )
                            }
                          >
                            {TEAM_ROLES.map((role) => (
                              <SelectOption key={role} value={role}>
                                {TEAM_ROLE_LABELS[role]}
                              </SelectOption>
                            ))}
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.userId)}
                          >
                            <X className="h-4 w-4 text-error-500" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setIsMemberDialogOpen(false)}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
