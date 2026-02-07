/**
 * External Update Page - Firebase Version
 *
 * Cette page est utilisée par les utilisateurs externes pour soumettre leurs mises à jour.
 * Elle utilise les MÊMES composants de formulaire que l'interface interne du Cockpit.
 * Elle lit et écrit directement dans Firebase, permettant la synchronisation temps réel.
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar,
  Target,
  Shield,
  Cloud,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Badge,
} from '@/components/ui';
import {
  initRealtimeSync,
  getUpdateLinkFromFirebase,
  markLinkAccessedInFirebase,
  submitExternalResponse,
  type ExternalUpdateData,
} from '@/services/firebaseRealtimeSync';
import { ActionFormContent, type ActionFormSaveData } from '@/components/shared/ActionFormContent';
import { JalonFormContent, type JalonFormSaveData } from '@/components/shared/JalonFormContent';
import { RisqueFormContent, type RisqueFormSaveData } from '@/components/shared/RisqueFormContent';
import { BudgetFormContent, type BudgetFormSaveData } from '@/components/shared/BudgetFormContent';
import type { Action, Jalon, Risque, User } from '@/types';
import type { LigneBudgetExploitation } from '@/types/budgetExploitation.types';
import { Wallet } from 'lucide-react';

// COCKPIT Fonts
const cockpitFonts = `
  @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;500;600;700&family=Grand+Hotel&display=swap');
`;

type EntityType = 'action' | 'jalon' | 'risque' | 'budget';

export function ExternalUpdateFirebasePage() {
  const { type, token } = useParams<{ type: EntityType; token: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [linkData, setLinkData] = useState<ExternalUpdateData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(true);

  // Entity data reconstructed from Firebase snapshot
  const [entity, setEntity] = useState<Action | Jalon | Risque | LigneBudgetExploitation | null>(null);

  // Users list from Firebase (for external selection)
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    loadData();
  }, [token, type]);

  const loadData = async () => {
    if (!token || !type) {
      setError('Lien invalide');
      setLoading(false);
      return;
    }

    try {
      // Initialize Firebase
      const initialized = await initRealtimeSync();
      setFirebaseConnected(initialized);

      if (!initialized) {
        setError('Impossible de se connecter au serveur. Veuillez réessayer plus tard.');
        setLoading(false);
        return;
      }

      // Get link data from Firebase
      const data = await getUpdateLinkFromFirebase(token);

      if (!data) {
        setError("Ce lien n'existe pas ou a été supprimé.");
        setLoading(false);
        return;
      }

      if (data.isExpired) {
        setError('Ce lien a expiré. Veuillez demander un nouveau lien.');
        setLoading(false);
        return;
      }

      if (data.entityType !== type) {
        setError("Type d'entité incorrect.");
        setLoading(false);
        return;
      }

      if (data.isUsed) {
        setError('Ce lien a déjà été utilisé. Une seule mise à jour est autorisée par lien.');
        setLoading(false);
        return;
      }

      setLinkData(data);

      // Set users from Firebase data (for external responsible selection)
      console.log('[ExternalUpdate] data.users from Firebase:', data.users);
      if (data.users && data.users.length > 0) {
        const usersFromFirebase: User[] = data.users.map(u => ({
          id: u.id,
          nom: u.nom,
          prenom: u.prenom,
          email: '',
          role: 'membre' as const,
          actif: true,
        }));
        setUsers(usersFromFirebase);
        console.log('[ExternalUpdate] Users chargés depuis Firebase:', usersFromFirebase.length, usersFromFirebase);
      } else {
        console.warn('[ExternalUpdate] Aucun utilisateur dans Firebase - le lien a été créé avant la mise à jour. Créez un nouveau lien.');
      }

      // Mark as accessed
      await markLinkAccessedInFirebase(token);

      // Reconstruct entity data from Firebase snapshot for the form components
      const snapshot = data.entitySnapshot;
      const baseEntity = {
        id: data.entityId,
        titre: snapshot.titre || 'Sans titre',
        statut: snapshot.statut || '',
        description: snapshot.description || '',
        responsable: data.recipientName,
      };

      if (type === 'action') {
        setEntity({
          ...baseEntity,
          avancement: snapshot.avancement || 0,
          date_debut_prevue: snapshot.date_debut_prevue || '',
          date_fin_prevue: snapshot.date_fin_prevue || '',
          sous_taches: snapshot.sous_taches || [],
          documents: snapshot.documents || [],
          commentaires: snapshot.commentaires || [],
          points_attention: snapshot.points_attention || [],
          decisions_attendues: snapshot.decisions_attendues || [],
          livrables: snapshot.livrables?.map(l => ({
            id: l.id,
            nom: l.nom,
            description: null,
            statut: l.statut || 'en_attente',
            obligatoire: false,
            date_prevue: null,
            date_livraison: l.statut === 'valide' ? new Date().toISOString().split('T')[0] : null,
            validateur: null,
          })) || [],
        } as Action);
      } else if (type === 'jalon') {
        setEntity({
          ...baseEntity,
          date_prevue: snapshot.date_prevue || '',
          preuve_url: snapshot.preuve_url || '',
          date_validation: snapshot.date_validation || null,
          commentaires: snapshot.commentaires || [],
        } as Jalon);
      } else if (type === 'risque') {
        setEntity({
          ...baseEntity,
          probabilite: snapshot.probabilite || 1,
          impact: snapshot.impact || 1,
          score: snapshot.score || 1,
          plan_mitigation: snapshot.plan_mitigation || '',
          proprietaire: data.recipientName,
          commentaires: snapshot.commentaires || [],
        } as Risque);
      } else if (type === 'budget') {
        setEntity({
          id: data.entityId,
          poste: snapshot.poste || snapshot.titre || 'Sans titre',
          categorie: snapshot.categorie || '',
          description: snapshot.description || '',
          montantPrevu: snapshot.montantPrevu || 0,
          montantEngage: snapshot.montantEngage || 0,
          montantConsomme: snapshot.montantConsomme || 0,
          note: snapshot.note || '',
          budgetType: 'mobilisation',
          annee: 2026,
          ordre: 0,
        } as LigneBudgetExploitation);
      }

      setLoading(false);
    } catch (e) {
      console.error('Error loading data:', e);
      setError('Erreur lors du chargement des données.');
      setLoading(false);
    }
  };

  const handleSave = async (formData: ActionFormSaveData | JalonFormSaveData | RisqueFormSaveData | BudgetFormSaveData) => {
    if (!linkData || !token) return;

    setSaving(true);

    // DEBUG: Log des données du formulaire
    console.log('[ExternalUpdate] FormData reçu:', JSON.stringify(formData, null, 2));

    try {
      const response: ExternalUpdateData['response'] = {
        submittedAt: new Date().toISOString(),
        submittedBy: {
          name: linkData.recipientName,
          email: linkData.recipientEmail,
        },
        changes: {
          statut: formData.statut,
          notes: (formData as any).notes_mise_a_jour,
          commentaires: (formData as any).commentaires_externes,
        },
      };

      // Champs spécifiques aux actions - TOUJOURS inclure tous les champs
      if (type === 'action') {
        const actionData = formData as ActionFormSaveData;
        response.changes.avancement = actionData.avancement;
        if (actionData.date_debut_prevue) response.changes.date_debut_prevue = actionData.date_debut_prevue;
        if (actionData.date_fin_prevue) response.changes.date_fin_prevue = actionData.date_fin_prevue;
        response.changes.liens_documents = actionData.liens_documents;
        // Toujours inclure sousTaches même si vide (pour permettre suppression)
        response.changes.sousTaches = actionData.sousTaches || [];
        response.changes.preuves = actionData.preuves || [];
        response.changes.pointsAttention = actionData.pointsAttention || [];
        response.changes.decisionsAttendues = actionData.decisionsAttendues || [];
        // Mapper les livrables vers le format Firebase (id, nom, statut)
        response.changes.livrables = (actionData.livrables || []).map(l => ({
          id: l.id,
          nom: l.nom,
          statut: l.fait ? 'valide' : 'en_attente',
        }));

        console.log('[ExternalUpdate] Action - sousTaches:', actionData.sousTaches);
        console.log('[ExternalUpdate] Action - pointsAttention:', actionData.pointsAttention);
        console.log('[ExternalUpdate] Action - decisionsAttendues:', actionData.decisionsAttendues);
        console.log('[ExternalUpdate] Action - avancement:', actionData.avancement);
      }

      // Champs spécifiques aux jalons
      if (type === 'jalon') {
        const jalonData = formData as JalonFormSaveData;
        response.changes.preuve_url = jalonData.preuve_url;
        response.changes.date_validation = jalonData.date_validation;

        console.log('[ExternalUpdate] Jalon - preuve_url:', jalonData.preuve_url);
      }

      // Champs spécifiques aux risques
      if (type === 'risque') {
        const risqueData = formData as RisqueFormSaveData;
        response.changes.probabilite = risqueData.probabilite;
        response.changes.impact = risqueData.impact;
        response.changes.score = risqueData.score;
        response.changes.plan_mitigation = risqueData.plan_mitigation;

        console.log('[ExternalUpdate] Risque - probabilite/impact/score:',
          risqueData.probabilite, risqueData.impact, risqueData.score);
      }

      // Champs spécifiques au budget
      if (type === 'budget') {
        const budgetData = formData as BudgetFormSaveData;
        response.changes.montantEngage = budgetData.montantEngage;
        response.changes.montantConsomme = budgetData.montantConsomme;
        response.changes.note = budgetData.note;
        if (budgetData.commentaires_externes) {
          response.changes.commentaires = budgetData.commentaires_externes;
        }

        console.log('[ExternalUpdate] Budget - engage/consomme:',
          budgetData.montantEngage, budgetData.montantConsomme);
      }

      // DEBUG: Log de la réponse complète
      console.log('[ExternalUpdate] Response à envoyer:', JSON.stringify(response, null, 2));

      // Submit to Firebase
      const submitSuccess = await submitExternalResponse(token, response);

      if (!submitSuccess) {
        throw new Error('Erreur lors de la soumission');
      }

      setDialogOpen(false);
      setSuccess(true);
    } catch (e) {
      console.error('Error saving:', e);
      setError('Erreur lors de la sauvegarde. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  };

  const getDialogIcon = () => {
    if (type === 'action') return <Target className="w-5 h-5 text-white" />;
    if (type === 'jalon') return <Calendar className="w-5 h-5 text-white" />;
    if (type === 'risque') return <Shield className="w-5 h-5 text-white" />;
    if (type === 'budget') return <Wallet className="w-5 h-5 text-white" />;
    return <Target className="w-5 h-5 text-white" />;
  };

  const getDialogGradient = () => {
    if (type === 'action') return 'from-blue-500 to-cyan-600';
    if (type === 'jalon') return 'from-emerald-500 to-teal-600';
    if (type === 'risque') return 'from-red-500 to-orange-600';
    if (type === 'budget') return 'from-amber-500 to-yellow-600';
    return 'from-gray-500 to-gray-600';
  };

  const getDialogTitle = () => {
    if (type === 'action') return "Modifier l'action";
    if (type === 'jalon') return 'Modifier le jalon';
    if (type === 'risque') return 'Modifier le risque';
    if (type === 'budget') return 'Modifier le budget';
    return 'Modifier';
  };

  const getEntityId = () => {
    if (!linkData) return null;
    if (type === 'action') return (entity as any)?.id_action || `A-${linkData.entityId}`;
    if (type === 'jalon') return (entity as any)?.id_jalon || `J-${linkData.entityId}`;
    if (type === 'risque') return (entity as any)?.id_risque || `R-${linkData.entityId}`;
    if (type === 'budget') return `B-${linkData.entityId}`;
    return null;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center" style={{ fontFamily: "'Exo 2', sans-serif" }}>
        <style>{cockpitFonts}</style>
        <div className="text-center">
          <div className="relative mb-4">
            <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <h2 className="text-2xl font-semibold text-indigo-600" style={{ fontFamily: "'Grand Hotel', cursive" }}>
            Cockpit
          </h2>
          <p className="text-gray-500 mt-2">Connexion au serveur...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4" style={{ fontFamily: "'Exo 2', sans-serif" }}>
        <style>{cockpitFonts}</style>
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-400">
            Contactez l'équipe projet si vous pensez qu'il s'agit d'une erreur.
          </p>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4" style={{ fontFamily: "'Exo 2', sans-serif" }}>
        <style>{cockpitFonts}</style>
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Mise à jour enregistrée !</h1>
          <p className="text-gray-600 mb-4">
            Vos modifications ont été sauvegardées avec succès. L'équipe projet a été notifiée.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 p-3 rounded-lg mb-4">
            <Cloud className="h-4 w-4" />
            <span>Synchronisation temps réel activée</span>
          </div>
          <p className="text-sm text-gray-500">Vous pouvez fermer cette page.</p>
        </div>
      </div>
    );
  }

  // Main form in Dialog - IDENTIQUE aux formulaires internes du Cockpit
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4" style={{ fontFamily: "'Exo 2', sans-serif" }}>
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
            {firebaseConnected && (
              <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-xs">
                <Cloud className="h-3 w-3" />
                Temps réel
              </span>
            )}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Expire le {new Date(linkData?.expiresAt || '').toLocaleDateString('fr-FR')}
          </span>
        </div>
      </div>

      {/* Dialog Modal - IDENTIQUE aux formulaires internes */}
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

            {type === 'budget' && entity && (
              <BudgetFormContent
                ligne={entity as LigneBudgetExploitation}
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
