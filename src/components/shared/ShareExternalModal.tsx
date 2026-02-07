/**
 * Share External Modal
 * Permet de générer et partager une page HTML pour mise à jour externe
 */

import { useState, useEffect } from 'react';
import {
  Send,
  Download,
  Eye,
  Copy,
  Check,
  User,
  Calendar,
  X,
  ExternalLink,
  FileText,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Badge } from '@/components/ui';
import { ExternalShareService, type ShareableItemType } from '@/services/externalShareService';
import { useUser } from '@/hooks';
import type { Action, Jalon, Risque } from '@/types';
import type { LigneBudgetExploitation } from '@/types/budgetExploitation.types';
import { PROJET_CONFIG } from '@/data/constants';

interface ShareExternalModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: ShareableItemType;
  entity: Action | Jalon | Risque | LigneBudgetExploitation;
  categoryItems?: LigneBudgetExploitation[];
  categoryLabel?: string;
  onShared?: (token: string) => void;
}

export function ShareExternalModal({
  isOpen,
  onClose,
  entityType,
  entity,
  categoryItems,
  categoryLabel,
  onShared,
}: ShareExternalModalProps) {
  const [step, setStep] = useState<'config' | 'preview' | 'success'>('config');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Récupérer le responsable
  const responsableId = getResponsableId(entity, entityType);
  const responsible = useUser(responsableId);

  // Labels par type
  const typeLabels: Record<ShareableItemType, { label: string; article: string; color: string }> = {
    action: { label: 'Action', article: "l'action", color: 'bg-blue-100 text-blue-700' },
    jalon: { label: 'Jalon', article: 'le jalon', color: 'bg-purple-100 text-purple-700' },
    risque: { label: 'Risque', article: 'le risque', color: 'bg-red-100 text-red-700' },
    budget: { label: 'Budget', article: 'la ligne budgétaire', color: 'bg-amber-100 text-amber-700' },
  };

  const typeConfig = typeLabels[entityType];

  const shareService = new ExternalShareService({
    projectName: PROJET_CONFIG.nom,
    companyName: 'CRMC',
    primaryColor: '#1C3163',
    accentColor: '#D4AF37',
    expiryDays: 30,
  });

  useEffect(() => {
    if (!isOpen) {
      setStep('config');
      setGeneratedHtml(null);
      setGeneratedToken(null);
      setCopied(false);
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Générer le token et sauvegarder
      const token = await shareService.saveToken(
        entityType,
        entity.id!,
        getEntityTitle(entity, entityType),
        responsible?.email || '',
        responsible ? `${responsible.prenom} ${responsible.nom}` : ''
      );

      // Générer le HTML
      let html: string;
      switch (entityType) {
        case 'action':
          html = shareService.generateActionPage(entity as Action, responsible || null, token);
          break;
        case 'jalon':
          html = shareService.generateJalonPage(entity as Jalon, responsible || null, token);
          break;
        case 'risque':
          html = shareService.generateRisquePage(entity as Risque, responsible || null, token);
          break;
        case 'budget':
          if (categoryItems && categoryItems.length > 1) {
            html = shareService.generateBudgetCategoryPage(categoryItems, categoryLabel || 'Budget', token);
          } else {
            html = shareService.generateBudgetPage(entity as LigneBudgetExploitation, token);
          }
          break;
      }

      setGeneratedHtml(html);
      setGeneratedToken(token);
      setStep('preview');
    } catch (error) {
      console.error('Erreur génération:', error);
      alert('Erreur lors de la génération de la page');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedHtml) return;

    const blob = new Blob([generatedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityType}_${sanitizeFilename(getEntityTitle(entity, entityType))}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setStep('success');
    onShared?.(generatedToken!);
  };

  const handleCopyLink = async () => {
    // Dans un vrai scénario, on copierait l'URL de l'API
    await navigator.clipboard.writeText(`Token: ${generatedToken}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenPreview = () => {
    if (!generatedHtml) return;
    const blob = new Blob([generatedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-primary-200 bg-gradient-to-r from-primary-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <ExternalLink className="h-5 w-5 text-primary-700" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-primary-900">
                Partager {typeConfig.article} en externe
              </h2>
              <p className="text-sm text-primary-500">
                Générer une page de mise à jour pour un collaborateur externe
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-primary-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {step === 'config' && (
            <div className="space-y-6">
              {/* Entity Summary */}
              <div className="p-4 bg-primary-50 rounded-xl">
                <div className="flex items-start gap-3">
                  <Badge className={cn('shrink-0', typeConfig.color)}>
                    {typeConfig.label}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-primary-900 truncate">
                      {getEntityTitle(entity, entityType)}
                    </h3>
                    {getEntityDescription(entity, entityType) && (
                      <p className="text-sm text-primary-600 mt-1 line-clamp-2">
                        {getEntityDescription(entity, entityType)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  {responsible && (
                    <div className="flex items-center gap-2 text-sm text-primary-600">
                      <User className="h-4 w-4" />
                      <span>{responsible.prenom} {responsible.nom}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-primary-600">
                    <Calendar className="h-4 w-4" />
                    <span>Échéance: {getEntityDueDate(entity, entityType)}</span>
                  </div>
                </div>
              </div>

              {/* What happens */}
              <div className="space-y-3">
                <h4 className="font-medium text-primary-800">Ce qui va se passer :</h4>
                <ul className="space-y-2 text-sm text-primary-600">
                  <li className="flex items-start gap-2">
                    <FileText className="h-4 w-4 mt-0.5 text-primary-400" />
                    <span>Une page HTML autonome sera générée avec les détails de {typeConfig.article}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Download className="h-4 w-4 mt-0.5 text-primary-400" />
                    <span>Vous téléchargerez cette page pour l'envoyer par email</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Send className="h-4 w-4 mt-0.5 text-primary-400" />
                    <span>Le destinataire pourra mettre à jour le statut et ajouter des commentaires</span>
                  </li>
                </ul>
              </div>

              {/* Expiry note */}
              <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
                <p className="text-sm text-warning-700">
                  La page générée expirera dans <strong>30 jours</strong>.
                  Le destinataire pourra soumettre plusieurs mises à jour.
                </p>
              </div>
            </div>
          )}

          {step === 'preview' && generatedHtml && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-primary-800">Aperçu de la page</h4>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleOpenPreview}>
                    <Eye className="h-4 w-4 mr-1" />
                    Ouvrir
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCopyLink}>
                    {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    {copied ? 'Copié' : 'Token'}
                  </Button>
                </div>
              </div>

              <div className="border border-primary-200 rounded-lg overflow-hidden">
                <iframe
                  srcDoc={generatedHtml}
                  title="Aperçu"
                  className="w-full h-96 bg-white"
                  sandbox="allow-scripts"
                />
              </div>

              <div className="p-3 bg-info-50 border border-info-200 rounded-lg">
                <p className="text-sm text-info-700">
                  <strong>Token généré:</strong> {generatedToken?.substring(0, 16)}...
                  <br />
                  Ce token est utilisé pour identifier la mise à jour lors de la synchronisation.
                </p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-success-600" />
              </div>
              <h3 className="text-xl font-semibold text-primary-900 mb-2">
                Page générée avec succès !
              </h3>
              <p className="text-primary-600 mb-6">
                La page HTML a été téléchargée. Envoyez-la par email au responsable.
              </p>

              <div className="p-4 bg-primary-50 rounded-lg text-left max-w-md mx-auto">
                <h4 className="font-medium text-primary-800 mb-2">Prochaines étapes :</h4>
                <ol className="text-sm text-primary-600 space-y-2 list-decimal list-inside">
                  <li>Joignez le fichier HTML à un email</li>
                  <li>Envoyez-le à {responsible?.email || 'le responsable'}</li>
                  <li>Le destinataire ouvre le fichier dans son navigateur</li>
                  <li>Il remplit le formulaire et soumet sa mise à jour</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center gap-3 p-4 border-t border-primary-200 bg-primary-50">
          {step === 'config' && (
            <>
              <Button variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Générer la page
                  </>
                )}
              </Button>
            </>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('config')}>
                Retour
              </Button>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Télécharger & Envoyer
              </Button>
            </>
          )}

          {step === 'success' && (
            <>
              <div />
              <Button onClick={onClose}>
                Fermer
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getResponsableId(entity: Action | Jalon | Risque | LigneBudgetExploitation, type: ShareableItemType): number | undefined {
  switch (type) {
    case 'action':
      return (entity as Action).responsableId;
    case 'jalon':
      return (entity as Jalon).responsableId;
    case 'risque':
      return (entity as Risque & { responsableId?: number }).responsableId;
    case 'budget':
      return undefined;
    default:
      return undefined;
  }
}

function getEntityTitle(entity: Action | Jalon | Risque | LigneBudgetExploitation, type: ShareableItemType): string {
  if (type === 'budget') return (entity as LigneBudgetExploitation).poste;
  return (entity as Action | Jalon | Risque).titre;
}

function getEntityDescription(entity: Action | Jalon | Risque | LigneBudgetExploitation, type: ShareableItemType): string {
  if (type === 'budget') return (entity as LigneBudgetExploitation).description || '';
  return (entity as Action | Jalon | Risque).description || '';
}

function getEntityDueDate(entity: Action | Jalon | Risque | LigneBudgetExploitation, type: ShareableItemType): string {
  let date: string | undefined;
  switch (type) {
    case 'action':
      date = (entity as Action).date_fin_prevue;
      break;
    case 'jalon':
      date = (entity as Jalon).date_prevue;
      break;
    case 'risque':
      date = (entity as Risque).date_cible;
      break;
    case 'budget':
      return 'N/A';
  }
  if (!date) return 'Non définie';
  return new Date(date).toLocaleDateString('fr-FR');
}

function sanitizeFilename(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 50);
}

export default ShareExternalModal;
