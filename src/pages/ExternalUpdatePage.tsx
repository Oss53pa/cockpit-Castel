// ============================================================================
// PAGE MISE À JOUR EXTERNE - Utilise les mêmes formulaires que le Cockpit
// Affiche le formulaire dans un modal identique à l'interface interne
// ============================================================================

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  Calendar,
  Target,
  AlertTriangle,
  Shield,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Badge,
} from '@/components/ui';
import { db } from '@/db';
import { getUpdateLink, markLinkAccessed, markLinkUpdated } from '@/services/emailService';
import { saveExternalUpdate, type FirebaseUpdateLink } from '@/services/firebase';
import { useUsers, updateAction, updateJalon } from '@/hooks';
import type { UpdateLink } from '@/db';
import type { Action, Jalon, Risque } from '@/types';
import { ActionFormContent, type ActionFormSaveData } from '@/components/shared/ActionFormContent';
import { JalonFormContent, type JalonFormSaveData } from '@/components/shared/JalonFormContent';
import { RisqueFormContent, type RisqueFormSaveData } from '@/components/shared/RisqueFormContent';

// Fonts
const cockpitFonts = `
  @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;500;600;700&family=Grand+Hotel&display=swap');
`;

type EntityType = 'action' | 'jalon' | 'risque';

// Extended entity type for external updates
interface ExternalUpdateFields {
  liens_documents?: string;
  commentaires_externes?: string;
  notes_mise_a_jour?: string;
  derniere_mise_a_jour_externe?: string;
}

type ExtendedEntity = (Action | Jalon | Risque) & ExternalUpdateFields;

export function ExternalUpdatePage() {
  const { type, token } = useParams<{ type: EntityType; token: string }>();
  const users = useUsers();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [link, setLink] = useState<(UpdateLink & { entityData?: FirebaseUpdateLink['entityData'] }) | null>(null);
  const [entity, setEntity] = useState<ExtendedEntity | null>(null);
  const [isFirebaseMode, setIsFirebaseMode] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(true);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, type]);

  const loadData = async () => {
    if (!token || !type) {
      setError('Lien invalide');
      setLoading(false);
      return;
    }

    try {
      console.log('[ExternalUpdate] Chargement du lien:', token, 'type:', type);
      const updateLink = await getUpdateLink(token);
      console.log('[ExternalUpdate] Résultat getUpdateLink:', updateLink ? 'trouvé' : 'non trouvé', updateLink);

      if (!updateLink) {
        console.error('[ExternalUpdate] Lien non trouvé dans IndexedDB et Firebase');
        setError('Ce lien n\'existe pas ou a été supprimé.');
        setLoading(false);
        return;
      }

      if (updateLink.isExpired) {
        setError('Ce lien a expiré. Veuillez demander un nouveau lien.');
        setLoading(false);
        return;
      }

      if (updateLink.entityType !== type) {
        setError('Type d\'entité incorrect.');
        setLoading(false);
        return;
      }

      setLink(updateLink);
      await markLinkAccessed(token);

      // Load entity
      let entityData: ExtendedEntity | undefined = undefined;

      if (type === 'action') {
        entityData = await db.actions.get(updateLink.entityId);
      } else if (type === 'jalon') {
        entityData = await db.jalons.get(updateLink.entityId);
      } else if (type === 'risque') {
        entityData = await db.risques.get(updateLink.entityId);
      }

      // Si entité non trouvée localement, utiliser les données Firebase
      if (!entityData && updateLink.entityData) {
        setIsFirebaseMode(true);
        entityData = {
          id: updateLink.entityId,
          titre: updateLink.entityData.titre || 'Sans titre',
          statut: updateLink.entityData.statut || '',
          date_prevue: updateLink.entityData.date_prevue,
          date_fin_prevue: updateLink.entityData.date_fin_prevue,
          avancement: updateLink.entityData.avancement,
          categorie: updateLink.entityData.categorie,
          score: updateLink.entityData.score,
          probabilite: updateLink.entityData.probabilite,
          impact: updateLink.entityData.impact,
          // Inclure les sous-tâches si présentes
          sous_taches: updateLink.entityData.sous_taches || [],
        } as ExtendedEntity;
      }

      if (!entityData) {
        setError('Entité non trouvée. Les données n\'ont pas pu être chargées.');
        setLoading(false);
        return;
      }

      setEntity(entityData);
      setLoading(false);
    } catch (e) {
      console.error('Error loading data:', e);
      setError('Erreur lors du chargement des données.');
      setLoading(false);
    }
  };

  const handleSave = async (data: ActionFormSaveData | JalonFormSaveData | RisqueFormSaveData) => {
    if (!link || !type || !token) return;

    setSaving(true);

    try {
      const updateData = {
        ...data,
        updated_at: new Date().toISOString(),
        derniere_mise_a_jour_externe: new Date().toISOString(),
      };

      // Sauvegarder dans Firebase
      await saveExternalUpdate({
        token: token,
        entityType: type,
        entityId: link.entityId,
        recipientEmail: link.recipientEmail,
        recipientName: link.recipientName,
        createdAt: new Date().toISOString(),
        updates: data as any,
        isSynced: false,
      });

      // Mise à jour locale si possible
      if (!isFirebaseMode) {
        if (type === 'action') {
          const actionData = data as ActionFormSaveData;
          // Convertir les champs pour le format DB
          const actionUpdate: Record<string, any> = {
            statut: actionData.statut,
            avancement: actionData.avancement,
            notes_mise_a_jour: actionData.notes_mise_a_jour,
            commentaires_externes: actionData.commentaires_externes,
            liens_documents: actionData.liens_documents,
            sous_taches: actionData.sousTaches,
            points_attention: actionData.pointsAttention,
            decisions_attendues: actionData.decisionsAttendues,
            derniere_mise_a_jour_externe: new Date().toISOString(),
          };
          // Convertir preuves en documents si présents
          if (actionData.preuves) {
            actionUpdate.documents = actionData.preuves.map(p => ({
              id: p.id,
              nom: p.nom,
              type: p.type,
              url: p.url || '',
              dateAjout: p.dateAjout,
            }));
          }
          // Utiliser updateAction avec flag externe pour le tracking
          await updateAction(link.entityId, actionUpdate, { isExternal: true });
        } else if (type === 'jalon') {
          const jalonData = data as JalonFormSaveData;
          const jalonUpdate: Record<string, any> = {
            statut: jalonData.statut,
            preuve_url: jalonData.preuve_url,
            notes_mise_a_jour: jalonData.notes_mise_a_jour,
            commentaires_externes: jalonData.commentaires_externes,
            date_validation: jalonData.date_validation,
            derniere_mise_a_jour_externe: new Date().toISOString(),
          };
          // Utiliser updateJalon avec flag externe pour le tracking
          await updateJalon(link.entityId, jalonUpdate, { isExternal: true });
        } else if (type === 'risque') {
          const risqueData = data as RisqueFormSaveData;
          const risqueUpdate: Record<string, any> = {
            statut: risqueData.statut,
            probabilite: risqueData.probabilite,
            impact: risqueData.impact,
            score: risqueData.score,
            plan_mitigation: risqueData.plan_mitigation,
            notes_mise_a_jour: risqueData.notes_mise_a_jour,
            commentaires_externes: risqueData.commentaires_externes,
            updated_at: new Date().toISOString(),
            derniere_mise_a_jour_externe: new Date().toISOString(),
          };
          await db.risques.update(link.entityId, risqueUpdate);
        }

        // Note: Le tracking granulaire est maintenant fait par updateAction/updateJalon
        // On ajoute juste une entrée générale pour les risques (pas encore migrés)
        if (type === 'risque') {
          await db.historique.add({
            timestamp: new Date().toISOString(),
            entiteType: type,
            entiteId: link.entityId,
            champModifie: 'update_externe',
            ancienneValeur: '',
            nouvelleValeur: `Mise à jour externe par ${link.recipientName} (${link.recipientEmail})`,
            auteurId: 0,
          });
        }

        const entityTypeLabel = type === 'action' ? 'Action' : type === 'jalon' ? 'Jalon' : 'Risque';
        const actionData = data as ActionFormSaveData;
        await db.alertes.add({
          type: 'info' as const,
          titre: `Mise à jour reçue de ${link.recipientName}`,
          message: `${entityTypeLabel} "${entity?.titre}" a été mis(e) à jour. Statut: ${data.statut || 'N/A'}${type === 'action' && actionData.avancement !== undefined ? `, Avancement: ${actionData.avancement}%` : ''}`,
          criticite: 'medium',
          entiteType: type,
          entiteId: link.entityId,
          lu: false,
          traitee: false,
          createdAt: new Date().toISOString(),
        });
      }

      await markLinkUpdated(token);
      setDialogOpen(false);
      setSuccess(true);
    } catch (e) {
      console.error('Error saving:', e);
      setError('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const getDialogIcon = () => {
    if (type === 'action') return <Target className="w-5 h-5 text-white" />;
    if (type === 'jalon') return <Calendar className="w-5 h-5 text-white" />;
    if (type === 'risque') return <Shield className="w-5 h-5 text-white" />;
    return <Target className="w-5 h-5 text-white" />;
  };

  const getDialogGradient = () => {
    if (type === 'action') return 'from-blue-500 to-cyan-600';
    if (type === 'jalon') return 'from-emerald-500 to-teal-600';
    if (type === 'risque') return 'from-red-500 to-orange-600';
    return 'from-gray-500 to-gray-600';
  };

  const getDialogTitle = () => {
    if (type === 'action') return "Modifier l'action";
    if (type === 'jalon') return 'Modifier le jalon';
    if (type === 'risque') return 'Modifier le risque';
    return 'Modifier';
  };

  const getEntityId = () => {
    if (type === 'action') return (entity as Action)?.id_action;
    if (type === 'jalon') return (entity as Jalon)?.id_jalon;
    if (type === 'risque') return (entity as Risque)?.id_risque;
    return null;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <style>{cockpitFonts}</style>
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <style>{cockpitFonts}</style>
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <style>{cockpitFonts}</style>
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Mise à jour enregistrée !</h1>
          <p className="text-gray-600 mb-4">
            Vos modifications ont été sauvegardées avec succès. L'équipe projet a été notifiée.
          </p>
          <p className="text-sm text-gray-500">Vous pouvez fermer cette page.</p>
        </div>
      </div>
    );
  }

  // Main form in Dialog - identique au Cockpit interne
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <style>{cockpitFonts}</style>

      {/* Background branding */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-5">
        <p className="text-9xl font-bold text-gray-900" style={{ fontFamily: "'Grand Hotel', cursive" }}>
          Cockpit
        </p>
      </div>

      {/* Info bar */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b px-4 py-2 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-sm text-gray-600">
          <span className="flex items-center gap-2">
            <span className="text-xl text-blue-600" style={{ fontFamily: "'Grand Hotel', cursive" }}>Cockpit</span>
            <span className="text-gray-300">|</span>
            <span>Mise à jour externe</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Expire le {new Date(link?.expiresAt || '').toLocaleDateString('fr-FR')}
          </span>
        </div>
      </div>

      {/* Dialog Modal - identique aux formulaires internes */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className={`p-2 bg-gradient-to-br ${getDialogGradient()} rounded-lg`}>
                {getDialogIcon()}
              </div>
              <div className="flex-1">
                <span>{getDialogTitle()}</span>
                {getEntityId() && (
                  <Badge variant="outline" className="ml-2 font-mono text-xs">
                    {getEntityId()}
                  </Badge>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            {type === 'action' && entity && (
              <ActionFormContent
                action={entity as Action}
                users={users}
                isEditing={true}
                isExternal={true}
                onSave={handleSave}
                isSaving={saving}
              />
            )}

            {type === 'jalon' && entity && (
              <JalonFormContent
                jalon={entity as Jalon}
                isEditing={true}
                isExternal={true}
                onSave={handleSave}
                isSaving={saving}
              />
            )}

            {type === 'risque' && entity && (
              <RisqueFormContent
                risque={entity as Risque}
                isEditing={true}
                isExternal={true}
                onSave={handleSave}
                isSaving={saving}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t px-4 py-2 text-center text-xs text-gray-500">
        Les modifications seront automatiquement synchronisées avec le Cockpit
      </div>
    </div>
  );
}
