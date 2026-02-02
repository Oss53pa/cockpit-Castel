/**
 * AxisDeepDive - Deep Dive complet par axe stratégique
 *
 * Connecté aux données réelles via les hooks:
 * - useActions, useJalons, useRisques, useBudget
 * - useDashboardKPIs, useAlertes, useUsers
 * - useSync (pour l'Axe 3 - Synchronisation Construction/Mobilisation)
 *
 * Affiche pour chaque axe:
 * - Score santé et météo
 * - Avancement détaillé (prévu vs réalisé)
 * - Liste complète des jalons avec statut réel
 * - Liste complète des actions avec vélocité
 * - Risques spécifiques à l'axe
 * - Recommandations automatiques basées sur les données
 * - [Axe 3 uniquement] Synchronisation Construction/Mobilisation
 */

import { useState, useMemo } from 'react';
import {
  Users,
  Building2,
  Wrench,
  DollarSign,
  Megaphone,
  Briefcase,
  ChevronDown,
  RefreshCw,
  Download,
  Printer,
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import {
  useActions,
  useJalons,
  useRisques,
  useUsers,
  useAvancementParAxe,
  useAlertes,
} from '@/hooks';
import { PROJET_CONFIG } from '@/data/constants';
import { cn } from '@/lib/utils';

import { ReportHeader } from '../shared/ReportHeader';
import { AxisHeader } from './AxisHeader';
import { AxisMilestones } from './AxisMilestones';
import { AxisActions } from './AxisActions';
import { AxisRisks } from './AxisRisks';
import { AxisRecommendations } from './AxisRecommendations';
import { AxisSync } from './AxisSync';

// Configuration des 6 axes stratégiques
const AXES_CONFIG = {
  axe1_rh: {
    code: 'axe1_rh',
    label: 'RH & Organisation',
    shortLabel: 'RH',
    icon: Users,
    color: '#EF4444', // red-500
    description: 'Recrutement, formation, organisation des équipes',
  },
  axe2_commercial: {
    code: 'axe2_commercial',
    label: 'Commercial & Leasing',
    shortLabel: 'Commercial',
    icon: Building2,
    color: '#3B82F6', // blue-500
    description: 'Commercialisation, baux, occupation',
  },
  axe3_technique: {
    code: 'axe3_technique',
    label: 'Technique & Handover',
    shortLabel: 'Technique',
    icon: Wrench,
    color: '#8B5CF6', // violet-500
    description: 'Réception, systèmes, maintenance',
  },
  axe4_budget: {
    code: 'axe4_budget',
    label: 'Budget & Pilotage',
    shortLabel: 'Budget',
    icon: DollarSign,
    color: '#F59E0B', // amber-500
    description: 'Budget, suivi financier, reporting',
  },
  axe5_marketing: {
    code: 'axe5_marketing',
    label: 'Marketing & Communication',
    shortLabel: 'Marketing',
    icon: Megaphone,
    color: '#EC4899', // pink-500
    description: 'Communication, événements, branding',
  },
  axe6_exploitation: {
    code: 'axe6_exploitation',
    label: 'Exploitation & Systèmes',
    shortLabel: 'Exploitation',
    icon: Briefcase,
    color: '#10B981', // emerald-500
    description: 'Exploitation, procédures, systèmes',
  },
};

type AxeCode = keyof typeof AXES_CONFIG;

// Mapping des codes d'axe vers les valeurs DB
const AXE_DB_MAPPING: Record<string, string[]> = {
  axe1_rh: ['axe1_rh', 'rh', 'RH'],
  axe2_commercial: ['axe2_commercial', 'commercial', 'commercialisation', 'Commercial'],
  axe3_technique: ['axe3_technique', 'technique', 'Technique'],
  axe4_budget: ['axe4_budget', 'budget', 'Budget'],
  axe5_marketing: ['axe5_marketing', 'marketing', 'Marketing'],
  axe6_exploitation: ['axe6_exploitation', 'exploitation', 'Exploitation'],
};

export function AxisDeepDive() {
  const [selectedAxe, setSelectedAxe] = useState<AxeCode>('axe1_rh');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Hooks de données réelles
  const allActions = useActions();
  const allJalons = useJalons();
  const allRisques = useRisques();
  const users = useUsers();
  const avancementParAxe = useAvancementParAxe();
  const alertes = useAlertes();

  // Configuration de l'axe sélectionné
  const axeConfig = AXES_CONFIG[selectedAxe];

  // Filtrage des données par axe
  const filteredData = useMemo(() => {
    const axeVariants = AXE_DB_MAPPING[selectedAxe] || [selectedAxe];

    const matchAxe = (axe: string | undefined): boolean => {
      if (!axe) return false;
      return axeVariants.some(v => v.toLowerCase() === axe.toLowerCase());
    };

    // Actions de l'axe
    const actions = allActions.filter(a => matchAxe(a.axe));

    // Jalons de l'axe
    const jalons = allJalons.filter(j => matchAxe(j.axe));

    // Risques de l'axe (via axe_impacte ou categorie mappée)
    const risques = allRisques.filter(r => {
      if (matchAxe(r.axe_impacte)) return true;
      // Mapping catégorie -> axe
      const catToAxe: Record<string, string> = {
        'rh': 'axe1_rh',
        'commercial': 'axe2_commercial',
        'technique': 'axe3_technique',
        'financier': 'axe4_budget',
        'strategique': 'axe5_marketing',
        'operationnel': 'axe6_exploitation',
      };
      const mappedAxe = catToAxe[r.categorie || ''];
      return mappedAxe === selectedAxe;
    });

    // Alertes de l'axe (via entités liées)
    const actionIds = new Set(actions.map(a => a.id));
    const jalonIds = new Set(jalons.map(j => j.id));
    const risqueIds = new Set(risques.map(r => r.id));

    const axeAlertes = alertes.filter(al => {
      if (al.entiteType === 'action' && actionIds.has(al.entiteId)) return true;
      if (al.entiteType === 'jalon' && jalonIds.has(al.entiteId)) return true;
      if (al.entiteType === 'risque' && risqueIds.has(al.entiteId)) return true;
      return false;
    });

    return { actions, jalons, risques, alertes: axeAlertes };
  }, [selectedAxe, allActions, allJalons, allRisques, alertes]);

  // Avancement de l'axe
  const axeAvancement = useMemo(() => {
    const found = avancementParAxe.find(a => {
      const axeVariants = AXE_DB_MAPPING[selectedAxe] || [selectedAxe];
      return axeVariants.some(v => v.toLowerCase() === (a.axe || '').toLowerCase());
    });

    if (found) {
      return {
        prevu: found.prevu || 72, // Valeur par défaut si non trouvée
        realise: found.realise || 0,
      };
    }

    // Calcul manuel si non trouvé dans avancementParAxe
    const actions = filteredData.actions;
    if (actions.length === 0) return { prevu: 72, realise: 0 };

    const totalAvancement = actions.reduce((sum, a) => sum + (a.avancement || 0), 0);
    const realise = Math.round(totalAvancement / actions.length);

    // Calcul du prévu basé sur les dates
    const today = new Date();
    const dateOuverture = new Date(PROJET_CONFIG.dateOuverture);
    const dateLancement = new Date('2026-04-01'); // Début mobilisation
    const dureeTotal = (dateOuverture.getTime() - dateLancement.getTime()) / (1000 * 60 * 60 * 24);
    const joursEcoules = (today.getTime() - dateLancement.getTime()) / (1000 * 60 * 60 * 24);
    const prevu = Math.min(100, Math.max(0, Math.round((joursEcoules / dureeTotal) * 100)));

    return { prevu, realise };
  }, [selectedAxe, avancementParAxe, filteredData.actions]);

  // Statistiques globales pour tous les axes
  const globalStats = useMemo(() => {
    return Object.keys(AXES_CONFIG).map(axeCode => {
      const axeVariants = AXE_DB_MAPPING[axeCode] || [axeCode];
      const matchAxe = (axe: string | undefined): boolean => {
        if (!axe) return false;
        return axeVariants.some(v => v.toLowerCase() === axe.toLowerCase());
      };

      const actions = allActions.filter(a => matchAxe(a.axe));
      const jalons = allJalons.filter(j => matchAxe(j.axe));
      const today = new Date().toISOString().split('T')[0];

      const actionsEnRetard = actions.filter(a =>
        a.statut !== 'termine' && a.date_fin_prevue && a.date_fin_prevue < today
      ).length;

      const jalonsAtteints = jalons.filter(j => j.statut === 'atteint').length;
      const avancement = actions.length > 0
        ? Math.round(actions.reduce((sum, a) => sum + (a.avancement || 0), 0) / actions.length)
        : 0;

      return {
        axe: axeCode,
        actions: actions.length,
        jalons: jalons.length,
        jalonsAtteints,
        actionsEnRetard,
        avancement,
      };
    });
  }, [allActions, allJalons]);

  // Rafraîchissement des données
  const handleRefresh = () => {
    setIsRefreshing(true);
    // Les hooks Dexie se rafraîchissent automatiquement
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Export PDF (placeholder)
  const handleExportPDF = () => {
    alert('Export PDF en cours de développement');
  };

  // Impression
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header du rapport */}
      <ReportHeader
        title={`Deep Dive: ${axeConfig.label}`}
        subtitle={`Analyse détaillée de l'axe ${axeConfig.shortLabel} - Projet ${PROJET_CONFIG.nom}`}
        period={new Date().toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
        onExportPDF={handleExportPDF}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="border-white/30 text-white hover:bg-white/10"
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
          Rafraîchir
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="border-white/30 text-white hover:bg-white/10 print:hidden"
        >
          <Printer className="h-4 w-4 mr-2" />
          Imprimer
        </Button>
      </ReportHeader>

      {/* Sélecteur d'axe */}
      <Card padding="md" className="print:hidden">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-medium text-gray-700">Sélectionner un axe:</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {(Object.keys(AXES_CONFIG) as AxeCode[]).map((axeCode) => {
            const config = AXES_CONFIG[axeCode];
            const stats = globalStats.find(s => s.axe === axeCode);
            const Icon = config.icon;
            const isSelected = selectedAxe === axeCode;

            return (
              <button
                key={axeCode}
                onClick={() => setSelectedAxe(axeCode)}
                className={cn(
                  'p-4 rounded-lg border-2 transition-all text-left',
                  isSelected
                    ? 'border-primary-500 bg-primary-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon
                    className="h-5 w-5"
                    style={{ color: config.color }}
                  />
                  <span className={cn(
                    'font-semibold text-sm',
                    isSelected ? 'text-primary-900' : 'text-gray-700'
                  )}>
                    {config.shortLabel}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {stats?.actions || 0} actions • {stats?.jalonsAtteints || 0}/{stats?.jalons || 0} jalons
                </div>
                {(stats?.actionsEnRetard || 0) > 0 && (
                  <Badge variant="error" className="mt-2 text-xs">
                    {stats?.actionsEnRetard} en retard
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Contenu du Deep Dive */}
      <div className="space-y-6">
        {/* Header de l'axe */}
        <AxisHeader
          axe={selectedAxe}
          label={axeConfig.label}
          icon={axeConfig.icon}
          color={axeConfig.color}
          actions={filteredData.actions}
          jalons={filteredData.jalons}
          risques={filteredData.risques}
          avancementPrevu={axeAvancement.prevu}
          avancementRealise={axeAvancement.realise}
        />

        {/* Grille 2 colonnes pour Jalons et Risques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Jalons */}
          <AxisMilestones
            jalons={filteredData.jalons}
            axeColor={axeConfig.color}
          />

          {/* Risques */}
          <AxisRisks
            risques={filteredData.risques}
            axeColor={axeConfig.color}
          />
        </div>

        {/* Actions (pleine largeur) */}
        <AxisActions
          actions={filteredData.actions}
          users={users}
          axeColor={axeConfig.color}
        />

        {/* Synchronisation Construction/Mobilisation - Uniquement pour Axe 3 (Technique) */}
        {selectedAxe === 'axe3_technique' && (
          <AxisSync axeColor={axeConfig.color} />
        )}

        {/* Recommandations */}
        <AxisRecommendations
          axe={selectedAxe}
          axeLabel={axeConfig.label}
          actions={filteredData.actions}
          jalons={filteredData.jalons}
          risques={filteredData.risques}
          avancementPrevu={axeAvancement.prevu}
          avancementRealise={axeAvancement.realise}
          axeColor={axeConfig.color}
        />
      </div>

      {/* Footer pour impression */}
      <div className="hidden print:block text-center text-xs text-gray-500 mt-8 pt-4 border-t">
        <p>Deep Dive {axeConfig.label} - {PROJET_CONFIG.nom}</p>
        <p>Généré le {new Date().toLocaleDateString('fr-FR')} via COCKPIT</p>
      </div>
    </div>
  );
}

export default AxisDeepDive;
