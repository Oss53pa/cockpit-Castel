// ============================================================================
// PAGE MISE À JOUR EXTERNE - Utilise les mêmes formulaires que le Cockpit
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
  User,
} from 'lucide-react';
import { db } from '@/db';
import { getUpdateLink, markLinkAccessed, markLinkUpdated } from '@/services/emailService';
import { saveExternalUpdate, type FirebaseUpdateLink } from '@/services/firebase';
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [link, setLink] = useState<(UpdateLink & { entityData?: FirebaseUpdateLink['entityData'] }) | null>(null);
  const [entity, setEntity] = useState<ExtendedEntity | null>(null);
  const [isFirebaseMode, setIsFirebaseMode] = useState(false);

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
          await db.actions.update(link.entityId, updateData);
        } else if (type === 'jalon') {
          await db.jalons.update(link.entityId, updateData);
        } else if (type === 'risque') {
          await db.risques.update(link.entityId, updateData);
        }

        await db.historique.add({
          timestamp: new Date().toISOString(),
          entiteType: type,
          entiteId: link.entityId,
          champModifie: 'update_externe',
          ancienneValeur: '',
          nouvelleValeur: `Mise à jour externe par ${link.recipientName} (${link.recipientEmail})`,
          auteurId: 0,
        });

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
      setSuccess(true);
    } catch (e) {
      console.error('Error saving:', e);
      setError('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const getEntityIcon = () => {
    if (type === 'action') return <Target className="h-8 w-8" />;
    if (type === 'jalon') return <Calendar className="h-8 w-8" />;
    if (type === 'risque') return <AlertTriangle className="h-8 w-8" />;
    return <Target className="h-8 w-8" />;
  };

  const getEntityGradient = () => {
    if (type === 'action') return 'from-blue-500 to-cyan-600';
    if (type === 'jalon') return 'from-emerald-500 to-teal-600';
    if (type === 'risque') return 'from-red-500 to-rose-600';
    return 'from-gray-500 to-gray-600';
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
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

  // Main form - utilise le même design que le Cockpit interne
  return (
    <div className="min-h-screen bg-gray-50">
      <style>{cockpitFonts}</style>

      {/* Header */}
      <header className={`bg-gradient-to-r ${getEntityGradient()} text-white py-6`}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              {getEntityIcon()}
            </div>
            <div>
              <p className="text-white/80 text-sm uppercase tracking-wider">
                Mise à jour {type === 'action' ? "d'action" : type === 'jalon' ? 'de jalon' : 'de risque'}
              </p>
              <h1 className="text-2xl font-bold">{entity?.titre}</h1>
            </div>
          </div>
          <div className="flex items-center gap-4 text-white/80 text-sm">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {link?.recipientName}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Expire le {new Date(link?.expiresAt || '').toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>
      </header>

      {/* Form - Utilise ActionFormContent identique au Cockpit */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {type === 'action' && entity && (
            <ActionFormContent
              action={entity as Action}
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

        <p className="text-center text-sm text-gray-500 mt-4">
          Les modifications seront automatiquement synchronisées avec le Cockpit
        </p>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-gray-500 border-t bg-white">
        <p className="text-xl text-blue-600 mb-1" style={{ fontFamily: "'Grand Hotel', cursive" }}>
          Cockpit
        </p>
        <p>Application de pilotage de projet</p>
      </footer>
    </div>
  );
}
