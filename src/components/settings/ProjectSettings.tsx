import { useState, useEffect } from 'react';
import {
  Calendar,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Building2,
  Truck,
  PartyPopper,
  Flag,
  X,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { db } from '@/db';
import {
  previewRecalculation,
  applyRecalculation,
  migrateToPhaseReferences,
  type RecalculationPreview,
} from '@/lib/dateCalculations';

// Types pour la configuration du projet
export interface ProjectConfig {
  dateDebutConstruction: string; // Format YYYY-MM
  dateDebutMobilisation: string;
  dateSoftOpening: string;
  dateFinMobilisation: string;
}

// Phases du projet avec leurs icones et couleurs
const PROJECT_PHASES = [
  {
    key: 'dateDebutConstruction',
    label: 'Debut de construction',
    description: 'Demarrage des travaux de construction',
    icon: Building2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    key: 'dateDebutMobilisation',
    label: 'Debut de la mobilisation',
    description: 'Lancement de la phase de mobilisation',
    icon: Truck,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  {
    key: 'dateSoftOpening',
    label: 'Soft Opening',
    description: 'Ouverture partielle / test',
    icon: PartyPopper,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    key: 'dateFinMobilisation',
    label: 'Fin du projet de mobilisation',
    description: 'Cloture du projet',
    icon: Flag,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
] as const;

// Valeurs par defaut pour Cosmos Angre
const DEFAULT_CONFIG: ProjectConfig = {
  dateDebutConstruction: '2024-01',
  dateDebutMobilisation: '2026-01',
  dateSoftOpening: '2026-11',
  dateFinMobilisation: '2027-03',
};

// Helpers pour la gestion des configurations
export async function getProjectConfig(): Promise<ProjectConfig> {
  const stored = await db.secureConfigs.where('key').equals('projectConfig').first();
  if (stored) {
    try {
      return JSON.parse(stored.value);
    } catch {
      return DEFAULT_CONFIG;
    }
  }
  return DEFAULT_CONFIG;
}

async function saveProjectConfig(config: ProjectConfig): Promise<void> {
  const now = new Date().toISOString();
  const existing = await db.secureConfigs.where('key').equals('projectConfig').first();

  if (existing) {
    await db.secureConfigs.update(existing.id!, {
      value: JSON.stringify(config),
      updatedAt: now,
    });
  } else {
    await db.secureConfigs.add({
      key: 'projectConfig',
      value: JSON.stringify(config),
      isEncrypted: false,
      createdAt: now,
      updatedAt: now,
    });
  }
}

export function ProjectSettings() {
  const [config, setConfig] = useState<ProjectConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [stats, setStats] = useState<{ jalons: number; actions: number } | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [preview, setPreview] = useState<RecalculationPreview | null>(null);
  const [forcerVerrouilles, setForcerVerrouilles] = useState(false);

  // Charger la configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const savedConfig = await getProjectConfig();
        setConfig(savedConfig);
      } catch (error) {
        console.error('Error loading project config:', error);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  // Charger les stats
  useEffect(() => {
    const loadStats = async () => {
      const jalonsCount = await db.jalons.count();
      const actionsCount = await db.actions.count();
      setStats({ jalons: jalonsCount, actions: actionsCount });
    };
    loadStats();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      // Valider les dates
      const dates = [
        { key: 'dateDebutConstruction', value: config.dateDebutConstruction },
        { key: 'dateDebutMobilisation', value: config.dateDebutMobilisation },
        { key: 'dateSoftOpening', value: config.dateSoftOpening },
        { key: 'dateFinMobilisation', value: config.dateFinMobilisation },
      ];

      for (let i = 0; i < dates.length - 1; i++) {
        if (dates[i].value >= dates[i + 1].value) {
          setMessage({
            type: 'error',
            text: `La date "${PROJECT_PHASES[i].label}" doit etre anterieure a "${PROJECT_PHASES[i + 1].label}"`,
          });
          setSaving(false);
          return;
        }
      }

      await saveProjectConfig(config);
      setMessage({ type: 'success', text: 'Configuration sauvegardee avec succes' });
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    setMessage(null);
    try {
      const result = await previewRecalculation(config, { forcerVerrouilles });
      setPreview(result);
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Error previewing recalculation:', error);
      setMessage({ type: 'error', text: 'Erreur lors de l\'apercu du recalcul' });
    } finally {
      setRecalculating(false);
    }
  };

  const handleApplyRecalculation = async () => {
    setShowPreviewModal(false);
    setRecalculating(true);
    setMessage(null);
    try {
      const result = await applyRecalculation(config, { forcerVerrouilles });
      let msg = `${result.jalons} jalon(s) et ${result.actions} action(s) mis a jour`;
      if (result.verrrouillesModifies > 0) {
        msg += ` (${result.verrrouillesModifies} element(s) deverrouille(s))`;
      }
      setMessage({ type: 'success', text: msg });
      setPreview(null);
      setForcerVerrouilles(false); // Reset l'option après application

      // Recharger les stats
      const jalonsCount = await db.jalons.count();
      const actionsCount = await db.actions.count();
      setStats({ jalons: jalonsCount, actions: actionsCount });
    } catch (error) {
      console.error('Error applying recalculation:', error);
      setMessage({ type: 'error', text: 'Erreur lors du recalcul des dates' });
    } finally {
      setRecalculating(false);
    }
  };

  // Migrer toutes les dates vers le système de références de phase
  const handleMigrate = async () => {
    setMigrating(true);
    setMessage(null);
    try {
      const result = await migrateToPhaseReferences(config);
      setMessage({
        type: 'success',
        text: `Migration réussie: ${result.jalons} jalon(s) et ${result.actions} action(s) convertis en délais relatifs au Soft Opening`,
      });
    } catch (error) {
      console.error('Error migrating:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la migration' });
    } finally {
      setMigrating(false);
    }
  };

  const formatMonthYear = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month] = dateStr.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aout', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  if (loading) {
    return (
      <Card padding="md">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-primary-500" />
          <span className="ml-2 text-primary-500">Chargement...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-primary-900">
              Configuration du Projet
            </h3>
            <p className="text-sm text-primary-500">
              Definissez les dates cles du projet Cosmos Angre
            </p>
          </div>
          <div className="flex items-center gap-2">
            {stats && (
              <div className="text-sm text-primary-500 mr-4">
                <Badge variant="info" className="mr-2">{stats.jalons} jalons</Badge>
                <Badge variant="success">{stats.actions} actions</Badge>
              </div>
            )}
          </div>
        </div>

        {/* Timeline visuelle */}
        <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 via-orange-50 via-green-50 to-purple-50 rounded-xl">
          <div className="relative">
            <div className="absolute top-6 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-orange-400 via-green-400 to-purple-400 rounded"></div>
            <div className="flex justify-between relative">
              {PROJECT_PHASES.map((phase) => {
                const Icon = phase.icon;
                const dateValue = config[phase.key as keyof ProjectConfig];
                return (
                  <div key={phase.key} className="flex flex-col items-center" style={{ width: '24%' }}>
                    <div className={`w-12 h-12 ${phase.bgColor} rounded-full flex items-center justify-center relative z-10 border-4 border-white shadow-md`}>
                      <Icon className={`h-6 w-6 ${phase.color}`} />
                    </div>
                    <div className="mt-3 text-center">
                      <p className="text-xs font-medium text-primary-700">{phase.label}</p>
                      <p className={`text-sm font-bold ${phase.color}`}>{formatMonthYear(dateValue)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Date inputs */}
        <div className="grid grid-cols-2 gap-6">
          {PROJECT_PHASES.map((phase) => {
            const Icon = phase.icon;
            return (
              <div key={phase.key} className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-primary-700">
                  <Icon className={`h-4 w-4 ${phase.color}`} />
                  {phase.label}
                </label>
                <input
                  type="month"
                  value={config[phase.key as keyof ProjectConfig]}
                  onChange={(e) => setConfig({ ...config, [phase.key]: e.target.value })}
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-primary-400">{phase.description}</p>
              </div>
            );
          })}
        </div>

        {/* Message */}
        {message && (
          <div className={`mt-6 p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success' ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-700'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
            {message.text}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 mt-6">
          <div className="flex gap-3 flex-wrap">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
            <Button variant="outline" onClick={handleMigrate} disabled={migrating}>
              <ArrowRight className={`h-4 w-4 mr-2 ${migrating ? 'animate-pulse' : ''}`} />
              {migrating ? 'Migration...' : 'Convertir en délais relatifs'}
            </Button>
            <Button variant="secondary" onClick={handleRecalculate} disabled={recalculating}>
              <RefreshCw className={`h-4 w-4 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
              {recalculating ? 'Recalcul...' : 'Recalculer les dates'}
            </Button>
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer">
            <input
              type="checkbox"
              checked={forcerVerrouilles}
              onChange={(e) => setForcerVerrouilles(e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300 text-orange-600 focus:ring-orange-500"
            />
            <Lock className="h-4 w-4 text-orange-500" />
            <span>Forcer le recalcul des elements verrouilles</span>
            {forcerVerrouilles && (
              <span className="text-xs text-orange-600 font-medium">(les verrous seront supprimes)</span>
            )}
          </label>
        </div>
      </Card>

      {/* Info Card */}
      <Card padding="md">
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-primary-500 mt-0.5" />
          <div>
            <h4 className="font-medium text-primary-900">Comment fonctionne le recalcul des dates ?</h4>
            <ul className="mt-2 text-sm text-primary-600 space-y-1">
              <li>Chaque jalon et action a un <strong>jalon de reference</strong> parmi les 4 phases du projet</li>
              <li>Un <strong>delai de declenchement</strong> (ex: J-90) definit l'ecart en jours par rapport a cette phase</li>
              <li>L'<strong>echeance</strong> est calculee : date debut + duree estimee</li>
              <li>Quand une date de phase change, toutes les echeances se recalculent automatiquement</li>
              <li>Les elements <strong>verrouilles manuellement</strong> sont ignores lors du recalcul (sauf si option forcee)</li>
              <li>Cochez <strong>"Forcer le recalcul des elements verrouilles"</strong> pour inclure les elements proteges (les verrous seront supprimes)</li>
              <li>Utilisez "Recalculer les dates" pour voir un apercu avant d'appliquer</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Preview Modal */}
      {showPreviewModal && preview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Apercu du recalcul</h3>
                <p className="text-sm text-neutral-500 mt-1">
                  Recalcul base sur les dates du projet
                </p>
              </div>
              <button
                onClick={() => { setShowPreviewModal(false); setPreview(null); }}
                className="p-1 hover:bg-neutral-100 rounded"
              >
                <X className="h-5 w-5 text-neutral-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-700">{preview.jalonsAffectes}</div>
                  <div className="text-xs text-blue-600">jalon(s) a mettre a jour</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-700">{preview.actionsAffectees}</div>
                  <div className="text-xs text-green-600">action(s) a mettre a jour</div>
                </div>
              </div>

              {(preview.jalonsVerrouilles > 0 || preview.actionsVerrouillees > 0) && (
                <div className={`p-3 border rounded-lg flex items-center gap-2 ${
                  forcerVerrouilles
                    ? 'bg-red-50 border-red-200'
                    : 'bg-orange-50 border-orange-200'
                }`}>
                  <Lock className={`h-4 w-4 ${forcerVerrouilles ? 'text-red-600' : 'text-orange-600'}`} />
                  <span className={`text-sm ${forcerVerrouilles ? 'text-red-800' : 'text-orange-800'}`}>
                    {forcerVerrouilles
                      ? `${preview.jalonsVerrouilles} jalon(s) et ${preview.actionsVerrouillees} action(s) verrouille(s) seront RECALCULE(S) et DEVERROUILLE(S)`
                      : `${preview.jalonsVerrouilles} jalon(s) et ${preview.actionsVerrouillees} action(s) verrouille(s) seront ignore(s)`
                    }
                  </span>
                </div>
              )}

              {preview.jalonsAffectes === 0 && preview.actionsAffectees === 0 && (
                <div className="p-6 text-center text-neutral-500">
                  <CheckCircle className="h-10 w-10 mx-auto mb-2 text-green-400" />
                  <p>Aucune modification necessaire. Toutes les dates sont deja a jour.</p>
                </div>
              )}

              {/* Jalons Preview */}
              {(() => {
                const jalonsToShow = forcerVerrouilles
                  ? preview.jalons
                  : preview.jalons.filter(j => !j.verrouille);
                return jalonsToShow.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-neutral-700 mb-2">
                      Jalons ({jalonsToShow.length})
                    </h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {jalonsToShow.slice(0, 10).map((j) => (
                        <div key={j.id} className={`flex items-center gap-2 text-sm p-2 rounded ${
                          j.verrouille ? 'bg-orange-50 border border-orange-200' : 'bg-neutral-50'
                        }`}>
                          {j.verrouille && <Lock className="h-3 w-3 text-orange-500 shrink-0" />}
                          <span className="flex-1 truncate text-neutral-900">{j.titre}</span>
                          <span className="text-neutral-400 font-mono text-xs">{j.ancienneDate}</span>
                          <ArrowRight className="h-3 w-3 text-neutral-400" />
                          <span className="text-blue-600 font-mono text-xs font-medium">{j.nouvelleDate}</span>
                        </div>
                      ))}
                      {jalonsToShow.length > 10 && (
                        <p className="text-xs text-neutral-400 text-center py-1">
                          ... et {jalonsToShow.length - 10} autre(s)
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Actions Preview */}
              {(() => {
                const actionsToShow = forcerVerrouilles
                  ? preview.actions
                  : preview.actions.filter(a => !a.verrouille);
                return actionsToShow.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-neutral-700 mb-2">
                      Actions ({actionsToShow.length})
                    </h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {actionsToShow.slice(0, 10).map((a) => (
                        <div key={a.id} className={`flex items-center gap-2 text-sm p-2 rounded ${
                          a.verrouille ? 'bg-orange-50 border border-orange-200' : 'bg-neutral-50'
                        }`}>
                          {a.verrouille && <Lock className="h-3 w-3 text-orange-500 shrink-0" />}
                          <span className="flex-1 truncate text-neutral-900">{a.titre}</span>
                          <span className="text-neutral-400 font-mono text-xs">{a.ancienDebut}</span>
                          <ArrowRight className="h-3 w-3 text-neutral-400" />
                          <span className="text-green-600 font-mono text-xs font-medium">{a.nouveauDebut}</span>
                        </div>
                      ))}
                      {actionsToShow.length > 10 && (
                        <p className="text-xs text-neutral-400 text-center py-1">
                          ... et {actionsToShow.length - 10} autre(s)
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => { setShowPreviewModal(false); setPreview(null); }}
              >
                Ignorer
              </Button>
              <Button
                onClick={handleApplyRecalculation}
                disabled={preview.jalonsAffectes === 0 && preview.actionsAffectees === 0}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Appliquer ({preview.jalonsAffectes + preview.actionsAffectees} modification(s))
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
