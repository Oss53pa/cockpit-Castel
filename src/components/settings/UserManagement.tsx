import { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, User, Mail, Download, Upload, FileSpreadsheet } from 'lucide-react';
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
  Tooltip,
  useToast,
} from '@/components/ui';
import {
  useUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserFullName,
} from '@/hooks';
import type { User as UserType, UserRole } from '@/types';
import { USER_ROLES, USER_ROLE_LABELS } from '@/types';
import { excelService } from '@/services/excelService';
import { logger } from '@/lib/logger';

interface UserFormData {
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
}

const initialFormData: UserFormData = {
  nom: '',
  prenom: '',
  email: '',
  role: 'viewer',
};

export function UserManagement() {
  const users = useUsers();
  const toast = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingUser(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: UserType) => {
    setEditingUser(user);
    setFormData({
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom || !formData.prenom || !formData.email) return;

    try {
      if (editingUser?.id) {
        await updateUser(editingUser.id, {
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          role: formData.role,
        });
        toast.success('Utilisateur modifie', `${formData.prenom} ${formData.nom}`);
      } else {
        await createUser({
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          role: formData.role,
        });
        toast.success('Utilisateur cree', `${formData.prenom} ${formData.nom}`);
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Erreur', 'Impossible de sauvegarder l\'utilisateur');
    }
  };

  const handleDelete = async (userId: number) => {
    if (confirm('Supprimer cet utilisateur ?')) {
      try {
        await deleteUser(userId);
        toast.success('Utilisateur supprime');
      } catch (error) {
        toast.error('Erreur', 'Impossible de supprimer l\'utilisateur');
      }
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'manager':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  // === EXCEL IMPORT/EXPORT ===
  const handleExportExcel = () => {
    excelService.exportResponsables(users);
  };

  const handleDownloadTemplate = () => {
    excelService.downloadTemplate('responsables');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const result = await excelService.importResponsables(file);

      if (result.errors.length > 0) {
        toast.warning('Import partiel', `${result.errors.length} erreur(s) rencontree(s)`);
      }

      for (const userData of result.data) {
        // Vérifier si l'utilisateur existe déjà (par email)
        const existingUser = users.find(u => u.email === userData.email);

        if (existingUser && existingUser.id) {
          await updateUser(existingUser.id, userData);
        } else if (userData.nom && userData.prenom && userData.email) {
          await createUser({
            nom: userData.nom,
            prenom: userData.prenom,
            email: userData.email,
            role: userData.role || 'viewer',
          });
        }
      }

      if (result.data.length > 0) {
        toast.success('Import reussi', `${result.data.length} utilisateur(s) importe(s)`);
      }
    } catch (error) {
      logger.error('Erreur import Excel:', error);
      toast.error('Erreur', 'Erreur lors de l\'import du fichier Excel');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-primary-900">
            Gestion des utilisateurs
          </h3>
          <p className="text-sm text-primary-500">
            Creer et gerer les utilisateurs et leurs droits d'acces
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Boutons Excel Import/Export */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportFile}
            className="hidden"
          />
          <Tooltip content="Importer depuis Excel">
            <Button variant="outline" size="sm" onClick={handleImportClick} disabled={importing}>
              <Upload className="h-4 w-4 mr-1" />
              {importing ? 'Import...' : 'Importer'}
            </Button>
          </Tooltip>
          <Tooltip content="Exporter vers Excel">
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <Download className="h-4 w-4 mr-1" />
              Exporter
            </Button>
          </Tooltip>
          <Tooltip content="Télécharger le modèle Excel">
            <Button variant="ghost" size="sm" onClick={handleDownloadTemplate}>
              <FileSpreadsheet className="h-4 w-4" />
            </Button>
          </Tooltip>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel utilisateur
          </Button>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {users.length === 0 ? (
          <div className="text-center py-8 text-primary-500">
            <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Aucun utilisateur</p>
            <p className="text-sm">Cliquez sur "Nouvel utilisateur" pour commencer</p>
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 bg-primary-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-200 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-700">
                    {user.prenom[0]}{user.nom[0]}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-primary-900">
                      {getUserFullName(user)}
                    </h4>
                    <Badge variant={getRoleBadgeVariant(user.role)} size="sm">
                      {USER_ROLE_LABELS[user.role]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-primary-500">
                    <Mail className="h-3 w-3" />
                    {user.email}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(user)}
                  title="Modifier"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => user.id && handleDelete(user.id)}
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4 text-error-500" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prenom">Prenom *</Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) =>
                      setFormData({ ...formData, prenom: e.target.value })
                    }
                    placeholder="Jean"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) =>
                      setFormData({ ...formData, nom: e.target.value })
                    }
                    placeholder="Dupont"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Adresse email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="jean.dupont@example.com"
                  required
                />
                <p className="text-xs text-primary-500 mt-1">
                  L'email sera utilise pour les notifications de Cockpit
                </p>
              </div>

              <div>
                <Label htmlFor="role">Role *</Label>
                <Select
                  id="role"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as UserRole })
                  }
                  required
                >
                  {USER_ROLES.map((role) => (
                    <SelectOption key={role} value={role}>
                      {USER_ROLE_LABELS[role]}
                    </SelectOption>
                  ))}
                </Select>
                <div className="mt-2 text-xs text-primary-500 space-y-1">
                  <p><strong>Administrateur:</strong> Acces complet a toutes les fonctionnalites</p>
                  <p><strong>Manager:</strong> Gestion des actions, jalons et risques</p>
                  <p><strong>Lecteur:</strong> Consultation uniquement</p>
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
                {editingUser ? 'Enregistrer' : 'Creer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
