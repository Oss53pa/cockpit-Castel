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
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { db } from '@/db';

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
async function getProjectConfig(): Promise<ProjectConfig> {
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

// Fonction pour recalculer les dates des jalons et actions
async function recalculateDates(config: ProjectConfig): Promise<{ jalons: number; actions: number }> {
  const jalons = await db.jalons.toArray();
  const actions = await db.actions.toArray();

  // Parser les dates de configuration
  const phases = {
    construction: new Date(config.dateDebutConstruction + '-01'),
    mobilisation: new Date(config.dateDebutMobilisation + '-01'),
    softOpening: new Date(config.dateSoftOpening + '-01'),
    finMobilisation: new Date(config.dateFinMobilisation + '-01'),
  };

  let jalonsUpdated = 0;
  let actionsUpdated = 0;

  // Mettre a jour les jalons selon leur axe
  for (const jalon of jalons) {
    let newDate: Date | null = null;
    const axe = jalon.axe?.toLowerCase() || '';

    // Determiner la phase appropriee selon l'axe
    if (axe.includes('construction') || axe.includes('technique') || axe.includes('infra')) {
      // Phase construction: entre debut construction et debut mobilisation
      const phaseStart = phases.construction;
      const phaseEnd = phases.mobilisation;
      newDate = interpolateDate(jalon.date_prevue, phaseStart, phaseEnd);
    } else if (axe.includes('mobilisation') || axe.includes('formation') || axe.includes('rh')) {
      // Phase mobilisation: entre debut mobilisation et soft opening
      const phaseStart = phases.mobilisation;
      const phaseEnd = phases.softOpening;
      newDate = interpolateDate(jalon.date_prevue, phaseStart, phaseEnd);
    } else if (axe.includes('ouverture') || axe.includes('commercial') || axe.includes('marketing')) {
      // Phase soft opening: entre soft opening et fin mobilisation
      const phaseStart = phases.softOpening;
      const phaseEnd = phases.finMobilisation;
      newDate = interpolateDate(jalon.date_prevue, phaseStart, phaseEnd);
    } else {
      // Par defaut: utiliser toute la periode du projet
      const phaseStart = phases.construction;
      const phaseEnd = phases.finMobilisation;
      newDate = interpolateDate(jalon.date_prevue, phaseStart, phaseEnd);
    }

    if (newDate && jalon.id) {
      const newDateStr = newDate.toISOString().split('T')[0];
      if (newDateStr !== jalon.date_prevue) {
        await db.jalons.update(jalon.id, { date_prevue: newDateStr });
        jalonsUpdated++;
      }
    }
  }

  // Mettre a jour les actions selon leur axe et date
  for (const action of actions) {
    const axe = action.axe?.toLowerCase() || '';
    let phaseStart: Date;
    let phaseEnd: Date;

    if (axe.includes('construction') || axe.includes('technique') || axe.includes('infra')) {
      phaseStart = phases.construction;
      phaseEnd = phases.mobilisation;
    } else if (axe.includes('mobilisation') || axe.includes('formation') || axe.includes('rh')) {
      phaseStart = phases.mobilisation;
      phaseEnd = phases.softOpening;
    } else if (axe.includes('ouverture') || axe.includes('commercial') || axe.includes('marketing')) {
      phaseStart = phases.softOpening;
      phaseEnd = phases.finMobilisation;
    } else {
      phaseStart = phases.construction;
      phaseEnd = phases.finMobilisation;
    }

    let updated = false;
    const updates: Partial<typeof action> = {};

    if (action.date_debut) {
      const newStart = interpolateDate(action.date_debut, phaseStart, phaseEnd);
      if (newStart) {
        const newStartStr = newStart.toISOString().split('T')[0];
        if (newStartStr !== action.date_debut) {
          updates.date_debut = newStartStr;
          updated = true;
        }
      }
    }

    if (action.date_fin_prevue) {
      const newEnd = interpolateDate(action.date_fin_prevue, phaseStart, phaseEnd);
      if (newEnd) {
        const newEndStr = newEnd.toISOString().split('T')[0];
        if (newEndStr !== action.date_fin_prevue) {
          updates.date_fin_prevue = newEndStr;
          updated = true;
        }
      }
    }

    if (updated && action.id) {
      await db.actions.update(action.id, updates);
      actionsUpdated++;
    }
  }

  return { jalons: jalonsUpdated, actions: actionsUpdated };
}

// Fonction helper pour interpoler une date dans une phase
function interpolateDate(
  currentDateStr: string | null | undefined,
  phaseStart: Date,
  phaseEnd: Date
): Date | null {
  if (!currentDateStr) return null;

  const currentDate = new Date(currentDateStr);
  if (isNaN(currentDate.getTime())) return null;

  // Verifier si la date est deja dans la phase
  if (currentDate >= phaseStart && currentDate <= phaseEnd) {
    return currentDate;
  }

  // Si la date est avant le debut de phase, la placer au debut
  if (currentDate < phaseStart) {
    return phaseStart;
  }

  // Si la date est apres la fin de phase, la placer a la fin
  if (currentDate > phaseEnd) {
    return phaseEnd;
  }

  return currentDate;
}

export function ProjectSettings() {
  const [config, setConfig] = useState<ProjectConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [stats, setStats] = useState<{ jalons: number; actions: number } | null>(null);

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
    if (!confirm(
      'Cette action va recalculer les dates de tous les jalons et actions pour les adapter aux phases du projet.\n\nContinuer ?'
    )) {
      return;
    }

    setRecalculating(true);
    setMessage(null);
    try {
      const result = await recalculateDates(config);
      setMessage({
        type: 'success',
        text: `${result.jalons} jalon(s) et ${result.actions} action(s) mis a jour`,
      });

      // Recharger les stats
      const jalonsCount = await db.jalons.count();
      const actionsCount = await db.actions.count();
      setStats({ jalons: jalonsCount, actions: actionsCount });
    } catch (error) {
      console.error('Error recalculating dates:', error);
      setMessage({ type: 'error', text: 'Erreur lors du recalcul des dates' });
    } finally {
      setRecalculating(false);
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
        <div className="flex gap-3 mt-6">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
          <Button variant="secondary" onClick={handleRecalculate} disabled={recalculating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
            {recalculating ? 'Recalcul...' : 'Recalculer les dates'}
          </Button>
        </div>
      </Card>

      {/* Info Card */}
      <Card padding="md">
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-primary-500 mt-0.5" />
          <div>
            <h4 className="font-medium text-primary-900">Comment fonctionne le recalcul des dates ?</h4>
            <ul className="mt-2 text-sm text-primary-600 space-y-1">
              <li>Les jalons et actions sont repartis selon leur axe strategique</li>
              <li><strong>Axes Technique/Infrastructure:</strong> Phase construction</li>
              <li><strong>Axes Mobilisation/Formation/RH:</strong> Phase mobilisation</li>
              <li><strong>Axes Commercial/Marketing/Ouverture:</strong> Phase soft opening</li>
              <li>Les dates sont ajustees pour rester dans les intervalles definis</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
