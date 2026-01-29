import { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  FileText,
  File,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Badge,
  Progress,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Input,
  Label,
  Textarea,
} from '@/components/ui';
import { formatNumber } from '@/lib/utils';

// Types
export interface Depense {
  id: string;
  date: string;
  description: string;
  fournisseur: string;
  reference: string;
  montant: number;
  statut: 'paye' | 'engage' | 'en_attente';
}

export interface PieceJointe {
  id: string;
  nom: string;
  taille: string;
  dateAjout: string;
  type: 'pdf' | 'excel' | 'word' | 'image';
}

export interface LigneBudgetaireComplete {
  id: string;
  poste: string;
  description: string;
  note?: string;
  prevu: number;
  engage: number;
  consomme: number;
  reste: number;
  avancement: number;
  depenses: Depense[];
  piecesJointes: PieceJointe[];
  derniereModification?: string;
}

interface LigneBudgetaireModalProps {
  ligne: LigneBudgetaireComplete | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (ligne: LigneBudgetaireComplete) => void;
  onDelete?: (id: string) => void;
  mode?: 'view' | 'edit';
}

// Format montant en FCFA
function formatMontant(value: number): string {
  if (value === 0) return '0';
  if (value >= 1_000_000_000) {
    return `${formatNumber(value / 1_000_000_000, 1)} Md`;
  }
  if (value >= 1_000_000) {
    return `${formatNumber(value / 1_000_000, 1)} M`;
  }
  if (value >= 1_000) {
    return `${formatNumber(value / 1_000, 0)} K`;
  }
  return formatNumber(value, 0);
}

// Format date
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Icône de fichier selon le type
function FileIcon({ type }: { type: PieceJointe['type'] }) {
  const iconClass = 'h-8 w-8';
  switch (type) {
    case 'pdf':
      return <FileText className={cn(iconClass, 'text-primary-500')} />;
    case 'excel':
      return <File className={cn(iconClass, 'text-primary-500')} />;
    case 'word':
      return <FileText className={cn(iconClass, 'text-primary-500')} />;
    case 'image':
      return <File className={cn(iconClass, 'text-primary-500')} />;
    default:
      return <File className={cn(iconClass, 'text-gray-500')} />;
  }
}

// Badge de statut de dépense
function StatutDepenseBadge({ statut }: { statut: Depense['statut'] }) {
  const config = {
    paye: { icon: CheckCircle, label: 'Payé', className: 'bg-green-100 text-green-700' },
    engage: { icon: Clock, label: 'Engagé', className: 'bg-blue-100 text-blue-700' },
    en_attente: { icon: AlertCircle, label: 'En attente', className: 'bg-orange-100 text-orange-700' },
  };

  const { icon: Icon, label, className } = config[statut];

  return (
    <Badge className={cn('gap-1', className)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

// Couleurs par poste
const POSTE_COLORS: Record<string, string> = {
  'Recrutement': 'bg-blue-100 text-blue-700',
  'Formation': 'bg-green-100 text-green-700',
  'Marketing': 'bg-purple-100 text-purple-700',
  'Événements': 'bg-orange-100 text-orange-700',
  'IT & Équipements': 'bg-cyan-100 text-cyan-700',
  'Aménagement': 'bg-amber-100 text-amber-700',
  'Frais généraux': 'bg-slate-100 text-slate-700',
  'Provisions': 'bg-gray-100 text-gray-700',
};

export function LigneBudgetaireModal({
  ligne,
  open,
  onOpenChange,
  onSave,
  onDelete,
  mode = 'edit',
}: LigneBudgetaireModalProps) {
  const [editedLigne, setEditedLigne] = useState<LigneBudgetaireComplete | null>(ligne);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddDepense, setShowAddDepense] = useState(false);
  const [newDepense, setNewDepense] = useState<Partial<Depense>>({
    date: new Date().toISOString().split('T')[0],
    statut: 'engage',
  });

  // Mise à jour quand la ligne change
  if (ligne && editedLigne?.id !== ligne.id) {
    setEditedLigne(ligne);
  }

  if (!ligne || !editedLigne) return null;

  const tauxEngagement = editedLigne.prevu > 0
    ? (editedLigne.engage / editedLigne.prevu) * 100
    : 0;
  const tauxConsommation = editedLigne.prevu > 0
    ? (editedLigne.consomme / editedLigne.prevu) * 100
    : 0;
  const disponible = editedLigne.prevu - editedLigne.consomme;

  const totalDepenses = editedLigne.depenses.reduce((sum, d) => sum + d.montant, 0);
  const totalPaye = editedLigne.depenses
    .filter((d) => d.statut === 'paye')
    .reduce((sum, d) => sum + d.montant, 0);
  const totalEngage = editedLigne.depenses
    .filter((d) => d.statut === 'engage')
    .reduce((sum, d) => sum + d.montant, 0);

  const handleFieldChange = (field: keyof LigneBudgetaireComplete, value: LigneBudgetaireComplete[keyof LigneBudgetaireComplete]) => {
    setEditedLigne((prev) => prev ? { ...prev, [field]: value } : null);
  };

  const handleAddDepense = () => {
    if (!newDepense.description || !newDepense.montant) return;

    const depense: Depense = {
      id: `dep-${Date.now()}`,
      date: newDepense.date || new Date().toISOString().split('T')[0],
      description: newDepense.description || '',
      fournisseur: newDepense.fournisseur || '',
      reference: newDepense.reference || '',
      montant: newDepense.montant || 0,
      statut: newDepense.statut || 'engage',
    };

    setEditedLigne((prev) =>
      prev ? { ...prev, depenses: [...prev.depenses, depense] } : null
    );
    setNewDepense({
      date: new Date().toISOString().split('T')[0],
      statut: 'engage',
    });
    setShowAddDepense(false);
  };

  const handleDeleteDepense = (depenseId: string) => {
    if (!confirm('Supprimer cette dépense ?')) return;
    setEditedLigne((prev) =>
      prev
        ? { ...prev, depenses: prev.depenses.filter((d) => d.id !== depenseId) }
        : null
    );
  };

  const handleDeletePieceJointe = (pieceJointeId: string) => {
    if (!confirm('Supprimer cette pièce jointe ?')) return;
    setEditedLigne((prev) =>
      prev
        ? { ...prev, piecesJointes: prev.piecesJointes.filter((pj) => pj.id !== pieceJointeId) }
        : null
    );
  };

  const handleSave = () => {
    if (editedLigne && onSave) {
      onSave(editedLigne);
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (editedLigne && onDelete) {
      onDelete(editedLigne.id);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Modifier la ligne budgétaire' : 'Détail de la ligne budgétaire'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations principales */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-primary-500">Poste budgétaire</Label>
              <Badge className={cn('mt-1', POSTE_COLORS[editedLigne.poste] || 'bg-gray-100 text-gray-700')}>
                {editedLigne.poste}
              </Badge>
            </div>
            <div>
              <Label className="text-xs text-primary-500">Description</Label>
              {mode === 'edit' ? (
                <Input
                  value={editedLigne.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  className="mt-1"
                />
              ) : (
                <p className="font-medium mt-1">{editedLigne.description}</p>
              )}
            </div>
          </div>

          {/* Montants */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-primary-500">Montant prévu (FCFA)</Label>
              {mode === 'edit' ? (
                <Input
                  type="number"
                  value={editedLigne.prevu}
                  onChange={(e) => handleFieldChange('prevu', Number(e.target.value))}
                  className="mt-1"
                />
              ) : (
                <p className="font-medium text-lg mt-1">{formatNumber(editedLigne.prevu, 0)}</p>
              )}
            </div>
            <div>
              <Label className="text-xs text-primary-500">Montant engagé (FCFA)</Label>
              {mode === 'edit' ? (
                <Input
                  type="number"
                  value={editedLigne.engage}
                  onChange={(e) => handleFieldChange('engage', Number(e.target.value))}
                  className="mt-1"
                />
              ) : (
                <p className="font-medium text-lg mt-1 text-blue-600">{formatNumber(editedLigne.engage, 0)}</p>
              )}
            </div>
            <div>
              <Label className="text-xs text-primary-500">Montant consommé (FCFA)</Label>
              {mode === 'edit' ? (
                <Input
                  type="number"
                  value={editedLigne.consomme}
                  onChange={(e) => handleFieldChange('consomme', Number(e.target.value))}
                  className="mt-1"
                />
              ) : (
                <p className="font-medium text-lg mt-1 text-green-600">{formatNumber(editedLigne.consomme, 0)}</p>
              )}
            </div>
          </div>

          {/* Indicateurs calculés */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-primary-50 rounded-lg">
            <div>
              <Label className="text-xs text-primary-500">Taux d'engagement</Label>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={tauxEngagement} variant="default" size="sm" className="flex-1" />
                <span className="font-semibold text-primary-900">{tauxEngagement.toFixed(1)}%</span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-primary-500">Taux de consommation</Label>
              <div className="flex items-center gap-2 mt-1">
                <Progress
                  value={tauxConsommation}
                  variant={tauxConsommation >= 75 ? 'success' : tauxConsommation >= 50 ? 'warning' : 'default'}
                  size="sm"
                  className="flex-1"
                />
                <span className="font-semibold text-primary-900">{tauxConsommation.toFixed(1)}%</span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-primary-500">Disponible</Label>
              <p className="font-bold text-xl text-orange-600 mt-1">{formatMontant(disponible)} FCFA</p>
            </div>
          </div>

          {/* Détail des dépenses */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold">
                Détail des dépenses ({editedLigne.depenses.length})
              </Label>
              {mode === 'edit' && (
                <Button size="sm" variant="secondary" onClick={() => setShowAddDepense(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter une dépense
                </Button>
              )}
            </div>

            {/* Formulaire ajout dépense */}
            {showAddDepense && (
              <div className="p-4 mb-4 border border-primary-200 rounded-lg bg-primary-50 space-y-3">
                <div className="grid grid-cols-5 gap-3">
                  <div>
                    <Label className="text-xs">Date</Label>
                    <Input
                      type="date"
                      value={newDepense.date}
                      onChange={(e) => setNewDepense({ ...newDepense, date: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Description</Label>
                    <Input
                      placeholder="Description de la dépense"
                      value={newDepense.description || ''}
                      onChange={(e) => setNewDepense({ ...newDepense, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Fournisseur</Label>
                    <Input
                      placeholder="Fournisseur"
                      value={newDepense.fournisseur || ''}
                      onChange={(e) => setNewDepense({ ...newDepense, fournisseur: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Référence</Label>
                    <Input
                      placeholder="N° facture"
                      value={newDepense.reference || ''}
                      onChange={(e) => setNewDepense({ ...newDepense, reference: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Montant (FCFA)</Label>
                    <Input
                      type="number"
                      placeholder="Montant"
                      value={newDepense.montant || ''}
                      onChange={(e) => setNewDepense({ ...newDepense, montant: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Statut</Label>
                    <select
                      value={newDepense.statut}
                      onChange={(e) => setNewDepense({ ...newDepense, statut: e.target.value as Depense['statut'] })}
                      className="w-full h-10 px-3 border border-primary-200 rounded-lg text-sm"
                    >
                      <option value="engage">Engagé</option>
                      <option value="paye">Payé</option>
                      <option value="en_attente">En attente</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-2">
                    <Button size="sm" variant="primary" onClick={handleAddDepense}>
                      Ajouter
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowAddDepense(false)}>
                      Annuler
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {editedLigne.depenses.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead>Réf.</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="w-[100px]">Statut</TableHead>
                      {mode === 'edit' && <TableHead className="w-[50px]"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editedLigne.depenses.map((depense) => (
                      <TableRow key={depense.id}>
                        <TableCell className="text-sm">{formatDate(depense.date)}</TableCell>
                        <TableCell className="font-medium">{depense.description}</TableCell>
                        <TableCell className="text-primary-600">{depense.fournisseur}</TableCell>
                        <TableCell className="text-primary-500 text-sm">{depense.reference}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatNumber(depense.montant, 0)}
                        </TableCell>
                        <TableCell>
                          <StatutDepenseBadge statut={depense.statut} />
                        </TableCell>
                        {mode === 'edit' && (
                          <TableCell>
                            <button
                              onClick={() => handleDeleteDepense(depense.id)}
                              className="p-1 hover:bg-error-100 rounded text-error-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex justify-end gap-6 mt-3 p-3 bg-primary-50 rounded-lg">
                  <div className="text-sm">
                    <span className="text-primary-500">Total des dépenses:</span>
                    <span className="ml-2 font-bold">{formatMontant(totalDepenses)}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-green-600">Payé:</span>
                    <span className="ml-2 font-semibold text-green-700">{formatMontant(totalPaye)}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-blue-600">Engagé:</span>
                    <span className="ml-2 font-semibold text-blue-700">{formatMontant(totalEngage)}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-primary-400">
                Aucune dépense enregistrée
              </div>
            )}
          </div>

          {/* Commentaire */}
          <div>
            <Label className="text-sm font-semibold">Commentaire</Label>
            {mode === 'edit' ? (
              <Textarea
                value={editedLigne.note || ''}
                onChange={(e) => handleFieldChange('note', e.target.value)}
                placeholder="Ajouter un commentaire..."
                rows={3}
                className="mt-2"
              />
            ) : (
              <p className="mt-2 p-3 bg-primary-50 rounded-lg text-sm">
                {editedLigne.note || 'Aucun commentaire'}
              </p>
            )}
          </div>

          {/* Pièces jointes */}
          <div>
            <Label className="text-sm font-semibold">
              Pièces jointes ({editedLigne.piecesJointes.length})
            </Label>

            {editedLigne.piecesJointes.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 mt-2">
                {editedLigne.piecesJointes.map((pj) => (
                  <div
                    key={pj.id}
                    className="flex items-center gap-3 p-3 border border-primary-200 rounded-lg hover:bg-primary-50 cursor-pointer group"
                  >
                    <FileIcon type={pj.type} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{pj.nom}</p>
                      <p className="text-xs text-primary-400">
                        {pj.taille} • Ajouté le {formatDate(pj.dateAjout)}
                      </p>
                    </div>
                    {mode === 'edit' && (
                      <button
                        onClick={() => handleDeletePieceJointe(pj.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-error-100 rounded text-error-500"
                        title="Supprimer la pièce jointe"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : null}

            {mode === 'edit' && (
              <div className="mt-3 p-6 border-2 border-dashed border-primary-200 rounded-lg text-center hover:border-primary-400 hover:bg-primary-50 cursor-pointer transition-colors">
                <Upload className="h-8 w-8 mx-auto text-primary-400 mb-2" />
                <p className="text-sm text-primary-600">Cliquez pour ajouter des fichiers</p>
                <p className="text-xs text-primary-400 mt-1">PDF, Excel, Word, Images</p>
              </div>
            )}
          </div>

          {/* Dernière modification */}
          {editedLigne.derniereModification && (
            <p className="text-xs text-primary-400 text-right">
              Dernière modification : {formatDate(editedLigne.derniereModification)}
            </p>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {mode === 'edit' && onDelete && (
              <>
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-error-600">Confirmer la suppression ?</span>
                    <Button size="sm" variant="danger" onClick={handleDelete}>
                      Oui, supprimer
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                      Non
                    </Button>
                  </div>
                ) : (
                  <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Supprimer
                  </Button>
                )}
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {mode === 'edit' ? 'Annuler' : 'Fermer'}
            </Button>
            {mode === 'edit' && (
              <Button variant="primary" onClick={handleSave}>
                Enregistrer
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Modal de confirmation de suppression simple
interface ConfirmDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
}

export function ConfirmDeleteModal({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
}: ConfirmDeleteModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-error-600">{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-primary-600">{description}</p>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
