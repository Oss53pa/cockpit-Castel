import { useState } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  Building2,
  Users,
  Wallet,
  FileCheck,
  Settings,
  BarChart3,
  RefreshCw,
  Database,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  SYNTHESE_RISQUES,
  REGISTRE_RISQUES_COSMOS_ANGRE,
  getRisquesByCategorie,
  getRisquesCritiques,
  type RisqueNiveau,
} from '@/data/risquesCosmosAngre';
import { seedRisquesCosmosAngre, areRisquesSeeded, getRisquesStats, clearRisques } from '@/data/seedRisques';

// Configuration des axes avec icônes
const AXES_CONFIG = [
  { id: 'technique', label: 'Technique / Chantier', icon: Building2, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { id: 'commercial', label: 'Commercial / BEFA', icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-50' },
  { id: 'rh', label: 'RH / Équipe', icon: Users, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  { id: 'financier', label: 'Budget / Finance', icon: Wallet, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  { id: 'reglementaire', label: 'Réglementaire', icon: FileCheck, color: 'text-red-600', bgColor: 'bg-red-50' },
  { id: 'operationnel', label: 'Exploitation / Systèmes', icon: Settings, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
];

const getNiveauConfig = (niveau: RisqueNiveau) => {
  switch (niveau) {
    case 'critique':
      return { color: 'bg-error-500', textColor: 'text-error-700', label: 'Critique' };
    case 'majeur':
      return { color: 'bg-warning-500', textColor: 'text-warning-700', label: 'Majeur' };
    case 'modere':
      return { color: 'bg-info-500', textColor: 'text-info-700', label: 'Modéré' };
    case 'faible':
      return { color: 'bg-success-500', textColor: 'text-success-700', label: 'Faible' };
  }
};

export function RisquesSynthese() {
  const [isLoading, setIsLoading] = useState(false);
  const [seedStatus, setSeedStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [dbStats, setDbStats] = useState<{ total: number; parNiveau: Record<string, number> } | null>(null);

  // Statistiques du registre par catégorie
  const statsByCategorie = AXES_CONFIG.map((axe) => {
    const risques = getRisquesByCategorie(axe.id as any);
    const critiques = risques.filter(r => r.niveau === 'critique').length;
    const majeurs = risques.filter(r => r.niveau === 'majeur').length;
    return {
      ...axe,
      total: risques.length,
      critiques,
      majeurs,
    };
  });

  // Top 10 risques critiques
  const risquesCritiques = getRisquesCritiques();

  // Charger les données dans la base
  const handleSeedData = async () => {
    setIsLoading(true);
    setSeedStatus(null);
    try {
      const result = await seedRisquesCosmosAngre(1, true);
      if (result.success) {
        setSeedStatus({ success: true, message: `${result.count} risques chargés avec succès` });
        // Rafraîchir les stats
        const stats = await getRisquesStats(1);
        setDbStats({ total: stats.total, parNiveau: stats.parNiveau });
      } else {
        setSeedStatus({ success: false, message: `Erreurs: ${result.errors.join(', ')}` });
      }
    } catch (error) {
      setSeedStatus({ success: false, message: `Erreur: ${error instanceof Error ? error.message : 'Inconnue'}` });
    }
    setIsLoading(false);
  };

  // Vérifier le statut de la base
  const handleCheckStatus = async () => {
    setIsLoading(true);
    try {
      const isSeeded = await areRisquesSeeded(1);
      const stats = await getRisquesStats(1);
      setDbStats({ total: stats.total, parNiveau: stats.parNiveau });
      setSeedStatus({
        success: isSeeded,
        message: isSeeded
          ? `Base initialisée avec ${stats.total} risques`
          : `Base partiellement remplie: ${stats.total} risques sur ${REGISTRE_RISQUES_COSMOS_ANGRE.length}`,
      });
    } catch (error) {
      setSeedStatus({ success: false, message: `Erreur: ${error instanceof Error ? error.message : 'Inconnue'}` });
    }
    setIsLoading(false);
  };

  // Vider les risques
  const handleClearData = async () => {
    if (!confirm('Voulez-vous vraiment supprimer tous les risques de la base ?')) return;
    setIsLoading(true);
    try {
      const count = await clearRisques(1);
      setSeedStatus({ success: true, message: `${count} risques supprimés` });
      setDbStats(null);
    } catch (error) {
      setSeedStatus({ success: false, message: `Erreur: ${error instanceof Error ? error.message : 'Inconnue'}` });
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques globales */}
      <Card padding="md">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-primary-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary-600" />
              Synthèse des Risques - Cosmos Angré
            </h3>
            <p className="text-sm text-primary-500 mt-1">
              Registre aligné sur les 19 Jalons du Référentiel de Mobilisation
            </p>
          </div>
          <Badge variant="secondary" className="text-lg">
            {SYNTHESE_RISQUES.total} risques
          </Badge>
        </div>

        {/* Distribution par niveau */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-error-50 rounded-lg p-4 text-center border border-error-200">
            <div className="text-3xl font-bold text-error-700">{SYNTHESE_RISQUES.parNiveau.critique}</div>
            <div className="text-sm text-error-600 font-medium">Critiques</div>
            <div className="text-xs text-error-500 mt-1">Score 12-16</div>
          </div>
          <div className="bg-warning-50 rounded-lg p-4 text-center border border-warning-200">
            <div className="text-3xl font-bold text-warning-700">{SYNTHESE_RISQUES.parNiveau.majeur}</div>
            <div className="text-sm text-warning-600 font-medium">Majeurs</div>
            <div className="text-xs text-warning-500 mt-1">Score 8-11</div>
          </div>
          <div className="bg-info-50 rounded-lg p-4 text-center border border-info-200">
            <div className="text-3xl font-bold text-info-700">{SYNTHESE_RISQUES.parNiveau.modere}</div>
            <div className="text-sm text-info-600 font-medium">Modérés</div>
            <div className="text-xs text-info-500 mt-1">Score 4-7</div>
          </div>
          <div className="bg-success-50 rounded-lg p-4 text-center border border-success-200">
            <div className="text-3xl font-bold text-success-700">{SYNTHESE_RISQUES.parNiveau.faible}</div>
            <div className="text-sm text-success-600 font-medium">Faibles</div>
            <div className="text-xs text-success-500 mt-1">Score 1-3</div>
          </div>
        </div>

        {/* Barres de progression par niveau */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-24 text-sm text-primary-600">Critiques</div>
            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-error-500 rounded-full transition-all"
                style={{ width: `${(SYNTHESE_RISQUES.parNiveau.critique / SYNTHESE_RISQUES.total) * 100}%` }}
              />
            </div>
            <div className="w-12 text-sm text-right text-primary-700 font-medium">
              {Math.round((SYNTHESE_RISQUES.parNiveau.critique / SYNTHESE_RISQUES.total) * 100)}%
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 text-sm text-primary-600">Majeurs</div>
            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-warning-500 rounded-full transition-all"
                style={{ width: `${(SYNTHESE_RISQUES.parNiveau.majeur / SYNTHESE_RISQUES.total) * 100}%` }}
              />
            </div>
            <div className="w-12 text-sm text-right text-primary-700 font-medium">
              {Math.round((SYNTHESE_RISQUES.parNiveau.majeur / SYNTHESE_RISQUES.total) * 100)}%
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 text-sm text-primary-600">Modérés</div>
            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-info-500 rounded-full transition-all"
                style={{ width: `${(SYNTHESE_RISQUES.parNiveau.modere / SYNTHESE_RISQUES.total) * 100}%` }}
              />
            </div>
            <div className="w-12 text-sm text-right text-primary-700 font-medium">
              {Math.round((SYNTHESE_RISQUES.parNiveau.modere / SYNTHESE_RISQUES.total) * 100)}%
            </div>
          </div>
        </div>
      </Card>

      {/* Répartition par axe/domaine */}
      <Card padding="md">
        <h4 className="text-md font-semibold text-primary-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning-500" />
          Répartition par Axe / Domaine
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statsByCategorie.map((axe) => {
            const Icon = axe.icon;
            return (
              <div
                key={axe.id}
                className={cn(
                  'rounded-lg p-4 border transition-all hover:shadow-md',
                  axe.bgColor
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-5 w-5', axe.color)} />
                    <span className="font-medium text-primary-900">{axe.label}</span>
                  </div>
                  <Badge variant="secondary">{axe.total}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {axe.critiques > 0 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-error-100 text-error-700 rounded">
                      <span className="w-2 h-2 rounded-full bg-error-500" />
                      {axe.critiques} critiques
                    </span>
                  )}
                  {axe.majeurs > 0 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-warning-100 text-warning-700 rounded">
                      <span className="w-2 h-2 rounded-full bg-warning-500" />
                      {axe.majeurs} majeurs
                    </span>
                  )}
                  {axe.critiques === 0 && axe.majeurs === 0 && (
                    <span className="text-success-600">Aucun risque critique ou majeur</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Top 10 risques critiques */}
      <Card padding="md">
        <h4 className="text-md font-semibold text-primary-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-error-500" />
          Top 10 Risques Critiques à Surveiller
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary-50">
                <th className="px-3 py-2 text-left font-medium text-primary-700">#</th>
                <th className="px-3 py-2 text-left font-medium text-primary-700">Code</th>
                <th className="px-3 py-2 text-left font-medium text-primary-700">Risque</th>
                <th className="px-3 py-2 text-center font-medium text-primary-700">Score</th>
                <th className="px-3 py-2 text-left font-medium text-primary-700">Jalons clés</th>
              </tr>
            </thead>
            <tbody>
              {risquesCritiques.slice(0, 10).map((risque, index) => (
                <tr key={risque.id} className={index % 2 === 0 ? 'bg-white' : 'bg-primary-50/50'}>
                  <td className="px-3 py-2 font-bold text-primary-600">{index + 1}</td>
                  <td className="px-3 py-2 font-mono text-primary-700">{risque.code}</td>
                  <td className="px-3 py-2 text-primary-800">{risque.titre}</td>
                  <td className="px-3 py-2 text-center">
                    <Badge variant="error" className="font-bold">{risque.score}</Badge>
                  </td>
                  <td className="px-3 py-2 text-primary-600">{risque.jalonsImpactes.slice(0, 2).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Plan de suivi */}
      <Card padding="md" className="bg-primary-50">
        <h4 className="text-md font-semibold text-primary-900 mb-3">Plan de Suivi Recommandé</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="error">Hebdomadaire</Badge>
            </div>
            <p className="text-sm text-primary-700">Risques critiques ({SYNTHESE_RISQUES.parNiveau.critique})</p>
            <p className="text-xs text-primary-500 mt-1">Responsable: DGA</p>
          </div>
          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="warning">Bi-mensuel</Badge>
            </div>
            <p className="text-sm text-primary-700">Risques majeurs ({SYNTHESE_RISQUES.parNiveau.majeur})</p>
            <p className="text-xs text-primary-500 mt-1">Responsable: Managers</p>
          </div>
          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="info">Mensuel</Badge>
            </div>
            <p className="text-sm text-primary-700">Risques modérés ({SYNTHESE_RISQUES.parNiveau.modere})</p>
            <p className="text-xs text-primary-500 mt-1">Responsable: COPIL</p>
          </div>
          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary">Trimestriel</Badge>
            </div>
            <p className="text-sm text-primary-700">Revue globale + faibles</p>
            <p className="text-xs text-primary-500 mt-1">Responsable: DGA + PDG</p>
          </div>
        </div>
      </Card>

      {/* Gestion de la base de données */}
      <Card padding="md">
        <h4 className="text-md font-semibold text-primary-900 mb-4 flex items-center gap-2">
          <Database className="h-4 w-4 text-primary-600" />
          Initialisation Base de Données
        </h4>

        <div className="flex flex-wrap items-center gap-4 mb-4">
          <Button
            onClick={handleSeedData}
            disabled={isLoading}
            variant="primary"
          >
            {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Database className="h-4 w-4 mr-2" />}
            Charger les 46 risques
          </Button>
          <Button
            onClick={handleCheckStatus}
            disabled={isLoading}
            variant="secondary"
          >
            {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <BarChart3 className="h-4 w-4 mr-2" />}
            Vérifier statut
          </Button>
          <Button
            onClick={handleClearData}
            disabled={isLoading}
            variant="ghost"
            className="text-error-600 hover:text-error-700"
          >
            Vider les risques
          </Button>
        </div>

        {seedStatus && (
          <div className={cn(
            'flex items-center gap-2 p-3 rounded-lg',
            seedStatus.success ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-700'
          )}>
            {seedStatus.success ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            <span>{seedStatus.message}</span>
          </div>
        )}

        {dbStats && (
          <div className="mt-4 p-3 bg-primary-50 rounded-lg">
            <p className="text-sm text-primary-700 font-medium">Statistiques base de données:</p>
            <div className="flex flex-wrap gap-4 mt-2 text-sm">
              <span>Total: <strong>{dbStats.total}</strong></span>
              <span>Critiques: <strong className="text-error-600">{dbStats.parNiveau.critique || 0}</strong></span>
              <span>Majeurs: <strong className="text-warning-600">{dbStats.parNiveau.majeur || 0}</strong></span>
              <span>Modérés: <strong className="text-info-600">{dbStats.parNiveau.modere || 0}</strong></span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
