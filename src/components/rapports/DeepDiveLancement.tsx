import { useState, useMemo } from 'react';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  Users,
  Building2,
  Wrench,
  DollarSign,
  Megaphone,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Download,
  Calendar,
  Shield,
  Target,
  ChevronRight,
  ChevronDown,
  Printer,
  RefreshCw,
} from 'lucide-react';
import {
  Card,
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/utils';

// Hooks pour données réelles
import {
  useDashboardKPIs,
  useActions,
  useJalons,
  useBudgetSynthese,
  useBudgetParAxe,
  useRisques,
} from '@/hooks';

// Données de référence
import {
  PROJET_INFO,
  METEO_PAR_AXE,
  METEO_ICONS,
  ORGANIGRAMME,
  EFFECTIF_CIBLE,
  PLANNING_RECRUTEMENT,
  COUT_MASSE_SALARIALE_2026,
  COMMERCIAL_STATUS,
  COMMERCIAL_KPIS,
  COMMERCIAL_ACTIONS,
  TECHNIQUE_STATUS,
  TECHNIQUE_JALONS,
  TECHNIQUE_POINTS_ATTENTION,
  TECHNIQUE_RISQUE_PRINCIPAL,
  BUDGET_SYNTHESE_2026,
  BUDGET_TOTAL_2026,
  BUDGET_MOBILISATION_DETAILS,
  BUDGET_EXPLOITATION_DETAILS,
  BUDGET_RATIOS,
  MARKETING_STATUS,
  MARKETING_JALONS,
  MARKETING_BUDGET,
  MARKETING_BUDGET_TOTAL,
  MARKETING_PRIORITES,
  EXPLOITATION_STATUS,
  MODELE_EXPLOITATION,
  DOCUMENTS_JURIDIQUES,
  AVANTAGES_MODELE_EXTERNALISE,
  RISQUES_MAJEURS,
  DECISIONS_ATTENDUES,
  PROCHAINES_ETAPES,
  SIGNATAIRES,
  formatMontantFCFA,
  getMeteoIcon,
  getProbabiliteColor,
  getImpactColor,
  getStatutIcon,
  getDocumentStatutLabel,
  type MeteoType,
} from '@/data/deepDiveLancementCosmosAngre';

// Import des données budget exploitation
import {
  BUDGET_EXPLOITATION_2026,
  TOTAL_EFFECTIF_2026,
} from '@/data/budgetExploitationCosmosAngre';

// Types
type AxeType = 'rh' | 'commercial' | 'technique' | 'budget' | 'marketing' | 'exploitation';

// Configuration des axes
const AXES_CONFIG: Record<AxeType, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  rh: { label: 'RH & Organisation', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  commercial: { label: 'Commercial & Leasing', icon: Building2, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  technique: { label: 'Technique & Handover', icon: Wrench, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  budget: { label: 'Budget & Finances', icon: DollarSign, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  marketing: { label: 'Marketing & Communication', icon: Megaphone, color: 'text-pink-600', bgColor: 'bg-pink-100' },
  exploitation: { label: 'Exploitation & Juridique', icon: Settings, color: 'text-green-600', bgColor: 'bg-green-100' },
};

// Mapping axe vers code DB
const axeToDbCode: Record<AxeType, string> = {
  rh: 'axe1_rh',
  commercial: 'axe2_commercial',
  technique: 'axe3_technique',
  budget: 'axe4_budget',
  marketing: 'axe5_marketing',
  exploitation: 'axe6_exploitation',
};

// Configuration météo
const METEO_CONFIG: Record<MeteoType, { icon: React.ElementType; color: string; bgColor: string }> = {
  soleil: { icon: Sun, color: 'text-green-600', bgColor: 'bg-green-100' },
  soleil_nuage: { icon: CloudSun, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  nuage: { icon: Cloud, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  pluie: { icon: CloudRain, color: 'text-red-600', bgColor: 'bg-red-100' },
};

// Composant Section Header
function SectionHeader({ title, icon: Icon, color }: { title: string; icon: React.ElementType; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={cn('p-2 rounded-lg', color.replace('text-', 'bg-').replace('600', '100'))}>
        <Icon className={cn('h-5 w-5', color)} />
      </div>
      <h3 className="text-lg font-bold text-primary-900">{title}</h3>
    </div>
  );
}

// Composant Météo Badge
function MeteoBadge({ meteo, statut }: { meteo: MeteoType; statut: string }) {
  const config = METEO_CONFIG[meteo];
  const Icon = config.icon;
  return (
    <div className="flex items-center gap-2">
      <div className={cn('p-1.5 rounded-full', config.bgColor)}>
        <Icon className={cn('h-4 w-4', config.color)} />
      </div>
      <span className="text-sm text-primary-600">{statut}</span>
    </div>
  );
}

// ============================================================================
// SLIDE 1 - RAPPEL PROJET & MÉTÉO GLOBALE
// ============================================================================
function SlideRappelProjet() {
  // Données réelles
  const kpis = useDashboardKPIs();
  const jalons = useJalons();
  const actions = useActions();

  // Calcul des jalons atteints
  const jalonsAtteints = useMemo(() => {
    if (!jalons.data) return 0;
    return jalons.data.filter(j => j.statut === 'atteint').length;
  }, [jalons.data]);

  const jalonsTotal = jalons.data?.length || 0;

  return (
    <div className="space-y-6">
      {/* Info Projet */}
      <Card padding="md">
        <h3 className="text-lg font-bold text-primary-900 mb-4">Le Projet</h3>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Surface GLA</TableCell>
              <TableCell className="text-right">{PROJET_INFO.surfaceGLA.toLocaleString()} m²</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Bâtiments</TableCell>
              <TableCell className="text-right">8 (CC, Big Box 1-4, Zone Expo, Marché, Parking)</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Soft Opening</TableCell>
              <TableCell className="text-right">15 novembre 2026</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Inauguration</TableCell>
              <TableCell className="text-right">15 décembre 2026</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Occupation cible</TableCell>
              <TableCell className="text-right">≥ {PROJET_INFO.occupationCible}%</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>

      {/* Météo par Axe */}
      <Card padding="md">
        <h3 className="text-lg font-bold text-primary-900 mb-4">Météo par Axe</h3>
        <div className="space-y-3">
          {METEO_PAR_AXE.map((item) => {
            const axeKey = item.axe.replace('axe1_', '').replace('axe2_', '').replace('axe3_', '').replace('axe4_', '').replace('axe5_', '').replace('axe6_', '') as AxeType;
            const config = AXES_CONFIG[axeKey === 'rh' ? 'rh' : axeKey === 'commercial' ? 'commercial' : axeKey === 'technique' ? 'technique' : axeKey === 'budget' ? 'budget' : axeKey === 'marketing' ? 'marketing' : 'exploitation'];

            return (
              <div key={item.axe} className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <config.icon className={cn('h-5 w-5', config.color)} />
                  <span className="font-medium text-primary-900">{item.label}</span>
                </div>
                <MeteoBadge meteo={item.meteo} statut={item.statut} />
              </div>
            );
          })}
        </div>
      </Card>

      {/* KPIs en temps réel */}
      <Card padding="md">
        <h3 className="text-lg font-bold text-primary-900 mb-4">KPIs Temps Réel</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-700">{kpis?.tauxOccupation || 0}%</p>
            <p className="text-xs text-blue-600">Occupation</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-700">{jalonsAtteints}/{jalonsTotal}</p>
            <p className="text-xs text-green-600">Jalons atteints</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-amber-700">{actions.data?.length || 0}</p>
            <p className="text-xs text-amber-600">Actions totales</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-purple-700">{kpis?.equipeTaille || EFFECTIF_CIBLE.total}</p>
            <p className="text-xs text-purple-600">Effectif cible</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// SLIDE 2 - AXE RH & ORGANISATION
// ============================================================================
function SlideAxeRH() {
  const actions = useActions();
  const jalons = useJalons();

  // Données réelles pour l'axe RH
  const actionsRH = useMemo(() => {
    if (!actions.data) return [];
    return actions.data.filter(a => a.axe === 'axe1_rh');
  }, [actions.data]);

  const jalonsRH = useMemo(() => {
    if (!jalons.data) return [];
    return jalons.data.filter(j => j.axe === 'axe1_rh');
  }, [jalons.data]);

  const actionsTerminees = actionsRH.filter(a => a.statut === 'termine').length;
  const avancement = actionsRH.length > 0
    ? Math.round(actionsRH.reduce((sum, a) => sum + (a.avancement || 0), 0) / actionsRH.length)
    : 0;

  return (
    <div className="space-y-6">
      <SectionHeader title="AXE RH & ORGANISATION" icon={Users} color="text-blue-600" />

      {/* Météo */}
      <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
        <CloudSun className="h-5 w-5 text-amber-600" />
        <span className="font-medium text-amber-800">Organigramme à valider</span>
      </div>

      {/* Avancement temps réel */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Avancement Temps Réel</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-primary-50 rounded-lg">
            <p className="text-xl font-bold text-primary-700">{actionsRH.length}</p>
            <p className="text-xs text-primary-500">Actions</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-xl font-bold text-green-700">{actionsTerminees}</p>
            <p className="text-xs text-green-500">Terminées</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-xl font-bold text-blue-700">{avancement}%</p>
            <p className="text-xs text-blue-500">Avancement</p>
          </div>
        </div>
      </Card>

      {/* Organigramme */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Organigramme Cible</h4>
        <div className="flex flex-col items-center">
          <div className="p-3 bg-primary-100 rounded-lg font-bold text-center mb-2">DGA</div>
          <div className="w-px h-4 bg-primary-300"></div>
          <div className="flex gap-8 items-start">
            <div className="flex flex-col items-center">
              <div className="p-2 bg-blue-100 rounded-lg text-sm text-center">Center Mgr</div>
              <div className="w-px h-4 bg-primary-300"></div>
              <div className="flex gap-4">
                <div className="p-1.5 bg-blue-50 rounded text-xs text-center">FSM</div>
                <div className="p-1.5 bg-blue-50 rounded text-xs text-center">AFT</div>
                <div className="p-1.5 bg-blue-50 rounded text-xs text-center">CTL</div>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-2 bg-amber-100 rounded-lg text-sm text-center">
                AFM (25%)
                <div className="text-xs text-amber-600">mutualisé</div>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-2 bg-amber-100 rounded-lg text-sm text-center">
                MCM (25%)
                <div className="text-xs text-amber-600">mutualisé</div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-center gap-4 text-sm">
          <Badge>Effectif cible : {EFFECTIF_CIBLE.total} personnes</Badge>
          <Badge variant="outline">Dédiés : {EFFECTIF_CIBLE.dedies}</Badge>
          <Badge variant="outline">Mutualisés : {EFFECTIF_CIBLE.mutualises}</Badge>
        </div>
      </Card>

      {/* Planning Recrutement */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Planning Recrutement</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vague</TableHead>
              <TableHead>Période</TableHead>
              <TableHead>Postes clés</TableHead>
              <TableHead className="text-center">Effectif</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PLANNING_RECRUTEMENT.map((vague) => (
              <TableRow key={vague.vague}>
                <TableCell className="font-medium">{vague.vague}</TableCell>
                <TableCell>{vague.periode}</TableCell>
                <TableCell>{vague.postes}</TableCell>
                <TableCell className="text-center">{vague.effectif}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Coût */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-center">
          <span className="text-sm text-blue-600">Coût Total 2026 - Masse salariale :</span>
          <span className="ml-2 text-xl font-bold text-blue-800">{formatMontantFCFA(COUT_MASSE_SALARIALE_2026)} FCFA</span>
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// SLIDE 3 - AXE COMMERCIAL & LEASING
// ============================================================================
function SlideAxeCommercial() {
  const actions = useActions();
  const jalons = useJalons();

  const actionsCommerciales = useMemo(() => {
    if (!actions.data) return [];
    return actions.data.filter(a => a.axe === 'axe2_commercial');
  }, [actions.data]);

  const jalonsCommerciaux = useMemo(() => {
    if (!jalons.data) return [];
    return jalons.data.filter(j => j.axe === 'axe2_commercial');
  }, [jalons.data]);

  const actionsTerminees = actionsCommerciales.filter(a => a.statut === 'termine').length;

  return (
    <div className="space-y-6">
      <SectionHeader title="AXE COMMERCIAL & LEASING" icon={Building2} color="text-indigo-600" />

      {/* Météo */}
      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
        <Sun className="h-5 w-5 text-green-600" />
        <span className="font-medium text-green-800">En avance - Commercialisation démarrée en 2024</span>
      </div>

      {/* KPIs */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">KPIs Clés</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Indicateur</TableHead>
              <TableHead className="text-center">Cible</TableHead>
              <TableHead className="text-center">Actuel</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Taux d'occupation cible</TableCell>
              <TableCell className="text-center">85%</TableCell>
              <TableCell className="text-center text-primary-400">À compléter</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Nombre de BEFA signés</TableCell>
              <TableCell className="text-center">-</TableCell>
              <TableCell className="text-center text-primary-400">À compléter</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Pipeline prospects</TableCell>
              <TableCell className="text-center">-</TableCell>
              <TableCell className="text-center text-primary-400">À compléter</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>

      {/* Avancement réel */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Avancement Temps Réel</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-indigo-50 rounded-lg">
            <p className="text-xl font-bold text-indigo-700">{actionsCommerciales.length}</p>
            <p className="text-xs text-indigo-500">Actions</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-xl font-bold text-green-700">{actionsTerminees}</p>
            <p className="text-xs text-green-500">Terminées</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-xl font-bold text-blue-700">{jalonsCommerciaux.length}</p>
            <p className="text-xs text-blue-500">Jalons</p>
          </div>
        </div>
      </Card>

      {/* Actions en cours */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Actions en Cours</h4>
        <ul className="space-y-2">
          {COMMERCIAL_ACTIONS.map((action, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-primary-700">{action}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

// ============================================================================
// SLIDE 4 - AXE TECHNIQUE & HANDOVER
// ============================================================================
function SlideAxeTechnique() {
  const actions = useActions();
  const jalons = useJalons();
  const risques = useRisques();

  const actionsTechniques = useMemo(() => {
    if (!actions.data) return [];
    return actions.data.filter(a => a.axe === 'axe3_technique');
  }, [actions.data]);

  const jalonsTechniques = useMemo(() => {
    if (!jalons.data) return [];
    return jalons.data.filter(j => j.axe === 'axe3_technique');
  }, [jalons.data]);

  const risquesTechniques = useMemo(() => {
    if (!risques.data) return [];
    return risques.data.filter(r => r.axe === 'axe3_technique');
  }, [risques.data]);

  return (
    <div className="space-y-6">
      <SectionHeader title="AXE TECHNIQUE & HANDOVER" icon={Wrench} color="text-purple-600" />

      {/* Météo */}
      <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
        <Cloud className="h-5 w-5 text-orange-600" />
        <span className="font-medium text-orange-800">À surveiller - Bassin de rétention en cours</span>
      </div>

      {/* Jalons Clés */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Jalons Clés</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jalon</TableHead>
              <TableHead>Cible</TableHead>
              <TableHead className="text-center">Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {TECHNIQUE_JALONS.map((jalon, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium">{jalon.jalon}</TableCell>
                <TableCell>{jalon.dateCible || '-'}</TableCell>
                <TableCell className="text-center">{getStatutIcon(jalon.statut)} {jalon.statut.replace('_', ' ')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Données réelles */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Données Temps Réel</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <p className="text-xl font-bold text-purple-700">{actionsTechniques.length}</p>
            <p className="text-xs text-purple-500">Actions</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-xl font-bold text-blue-700">{jalonsTechniques.length}</p>
            <p className="text-xs text-blue-500">Jalons</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-xl font-bold text-red-700">{risquesTechniques.length}</p>
            <p className="text-xs text-red-500">Risques</p>
          </div>
        </div>
      </Card>

      {/* Points d'Attention */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Points d'Attention</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sujet</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {TECHNIQUE_POINTS_ATTENTION.map((point, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium">{point.sujet}</TableCell>
                <TableCell>{point.responsable}</TableCell>
                <TableCell>{point.action}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Risque Principal */}
      <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
          <div>
            <p className="font-semibold text-orange-800">Risque Principal</p>
            <p className="text-sm text-orange-700">{TECHNIQUE_RISQUE_PRINCIPAL.risque} - {TECHNIQUE_RISQUE_PRINCIPAL.mitigation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SLIDE 5 - AXE BUDGET & FINANCES
// ============================================================================
function SlideAxeBudget() {
  const budget = useBudgetSynthese();
  const budgetParAxe = useBudgetParAxe();

  // Calcul du budget total réel
  const budgetTotalPrevu = budget?.prevu || 0;
  const budgetTotalRealise = budget?.realise || 0;
  const tauxConsommation = budgetTotalPrevu > 0 ? Math.round((budgetTotalRealise / budgetTotalPrevu) * 100) : 0;

  return (
    <div className="space-y-6">
      <SectionHeader title="AXE BUDGET & FINANCES" icon={DollarSign} color="text-amber-600" />

      {/* Météo */}
      <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
        <CloudSun className="h-5 w-5 text-amber-600" />
        <span className="font-medium text-amber-800">Budgets à valider (ce Deep Dive)</span>
      </div>

      {/* Vue Synthétique 2026 */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Vue Synthétique 2026</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Budget</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead>Nature</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {BUDGET_SYNTHESE_2026.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium">{item.nature}</TableCell>
                <TableCell className="text-right font-mono">{formatMontantFCFA(item.montant)} FCFA</TableCell>
                <TableCell>
                  <Badge variant={item.type === 'CAPEX' ? 'default' : 'outline'}>{item.type}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-primary-100">
              <TableCell className="font-bold">TOTAL 2026</TableCell>
              <TableCell className="text-right font-bold font-mono">{formatMontantFCFA(BUDGET_TOTAL_2026)} FCFA</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Card>

      {/* Mobilisation - Grandes Masses */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Mobilisation - Grandes Masses</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nature</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead className="text-right">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {BUDGET_MOBILISATION_DETAILS.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium">{item.nature}</TableCell>
                <TableCell className="text-right font-mono">{formatMontantFCFA(item.montant)}</TableCell>
                <TableCell className="text-right">{item.pourcentage}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Exploitation 2026 - Grandes Masses */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Exploitation 2026 - Grandes Masses</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nature</TableHead>
              <TableHead className="text-right">Montant</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {BUDGET_EXPLOITATION_DETAILS.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium">{item.nature}</TableCell>
                <TableCell className="text-right font-mono">{formatMontantFCFA(item.montant)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Benchmark */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Benchmark</h4>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="font-medium text-green-700">Dans les standards marché CI</span>
        </div>
        <ul className="space-y-2 text-sm">
          {BUDGET_RATIOS.map((ratio, idx) => (
            <li key={idx} className="flex justify-between">
              <span className="text-primary-600">{ratio.indicateur}</span>
              <span className="font-mono">{ratio.valeur} <span className="text-primary-400">(norme : {ratio.norme})</span></span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Données temps réel */}
      {budgetTotalPrevu > 0 && (
        <Card padding="md">
          <h4 className="font-semibold text-primary-900 mb-3">Consommation Budget (Temps Réel)</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Budget prévu</span>
              <span className="font-mono">{formatMontantFCFA(budgetTotalPrevu)} FCFA</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Réalisé</span>
              <span className="font-mono">{formatMontantFCFA(budgetTotalRealise)} FCFA</span>
            </div>
            <div className="w-full bg-primary-200 rounded-full h-3 mt-2">
              <div
                className="bg-amber-500 h-3 rounded-full"
                style={{ width: `${Math.min(tauxConsommation, 100)}%` }}
              />
            </div>
            <p className="text-xs text-primary-500 text-right">{tauxConsommation}% consommé</p>
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// SLIDE 6 - AXE MARKETING & COMMUNICATION
// ============================================================================
function SlideAxeMarketing() {
  const actions = useActions();
  const jalons = useJalons();

  const actionsMarketing = useMemo(() => {
    if (!actions.data) return [];
    return actions.data.filter(a => a.axe === 'axe5_marketing');
  }, [actions.data]);

  const jalonsMarketing = useMemo(() => {
    if (!jalons.data) return [];
    return jalons.data.filter(j => j.axe === 'axe5_marketing');
  }, [jalons.data]);

  return (
    <div className="space-y-6">
      <SectionHeader title="AXE MARKETING & COMMUNICATION" icon={Megaphone} color="text-pink-600" />

      {/* Météo */}
      <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
        <CloudSun className="h-5 w-5 text-amber-600" />
        <span className="font-medium text-amber-800">En préparation - Identité de marque à lancer</span>
      </div>

      {/* Jalons Clés */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Jalons Clés</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jalon</TableHead>
              <TableHead>Cible</TableHead>
              <TableHead className="text-center">Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MARKETING_JALONS.map((jalon, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium">{jalon.jalon}</TableCell>
                <TableCell>{jalon.dateCible || 'À planifier'}</TableCell>
                <TableCell className="text-center">{getStatutIcon(jalon.statut)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Budget Marketing */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Budget Marketing (inclus dans Mobilisation)</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Poste</TableHead>
              <TableHead className="text-right">Montant</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MARKETING_BUDGET.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium">{item.nature}</TableCell>
                <TableCell className="text-right font-mono">{formatMontantFCFA(item.montant)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-pink-50">
              <TableCell className="font-bold">Total</TableCell>
              <TableCell className="text-right font-bold font-mono">{formatMontantFCFA(MARKETING_BUDGET_TOTAL)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Card>

      {/* Priorités */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Priorités</h4>
        <ol className="space-y-2">
          {MARKETING_PRIORITES.map((priorite, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center text-sm font-bold">
                {idx + 1}
              </span>
              <span className="text-sm text-primary-700">{priorite}</span>
            </li>
          ))}
        </ol>
      </Card>

      {/* Données temps réel */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Données Temps Réel</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-pink-50 rounded-lg">
            <p className="text-xl font-bold text-pink-700">{actionsMarketing.length}</p>
            <p className="text-xs text-pink-500">Actions</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <p className="text-xl font-bold text-purple-700">{jalonsMarketing.length}</p>
            <p className="text-xs text-purple-500">Jalons</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// SLIDE 7 - AXE EXPLOITATION & JURIDIQUE
// ============================================================================
function SlideAxeExploitation() {
  const actions = useActions();
  const jalons = useJalons();

  const actionsExploitation = useMemo(() => {
    if (!actions.data) return [];
    return actions.data.filter(a => a.axe === 'axe6_exploitation');
  }, [actions.data]);

  return (
    <div className="space-y-6">
      <SectionHeader title="AXE EXPLOITATION & JURIDIQUE" icon={Settings} color="text-green-600" />

      {/* Météo */}
      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
        <Sun className="h-5 w-5 text-green-600" />
        <span className="font-medium text-green-800">OK - BEFA standard prêt</span>
      </div>

      {/* Modèle d'Exploitation */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Modèle d'Exploitation</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prestation</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Effectif prévu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MODELE_EXPLOITATION.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium">{item.prestation}</TableCell>
                <TableCell>
                  <Badge variant={item.mode === 'Externalisée' ? 'default' : 'outline'}>{item.mode}</Badge>
                </TableCell>
                <TableCell>{item.effectif}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Documents Juridiques */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Documents Juridiques</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {DOCUMENTS_JURIDIQUES.map((doc, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium">{doc.document}</TableCell>
                <TableCell>{getDocumentStatutLabel(doc.statut)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Avantages Modèle Externalisé */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Avantages Modèle Externalisé</h4>
        <ul className="space-y-2">
          {AVANTAGES_MODELE_EXTERNALISE.map((avantage, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-primary-700">{avantage}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Données temps réel */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Données Temps Réel</h4>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-xl font-bold text-green-700">{actionsExploitation.length}</p>
          <p className="text-xs text-green-500">Actions Exploitation</p>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// SLIDE 8 - RISQUES MAJEURS
// ============================================================================
function SlideRisquesMajeurs() {
  const risques = useRisques();

  // Risques critiques en temps réel
  const risquesCritiques = useMemo(() => {
    if (!risques.data) return [];
    return risques.data.filter(r => (r.score || 0) >= 12).slice(0, 5);
  }, [risques.data]);

  const totalRisques = risques.data?.length || 0;
  const totalCritiques = risques.data?.filter(r => (r.score || 0) >= 12).length || 0;

  return (
    <div className="space-y-6">
      <SectionHeader title="RISQUES MAJEURS" icon={AlertTriangle} color="text-red-600" />

      {/* Stats risques */}
      <div className="grid grid-cols-2 gap-4">
        <Card padding="md" className="text-center">
          <p className="text-3xl font-bold text-primary-700">{totalRisques}</p>
          <p className="text-sm text-primary-500">Risques identifiés</p>
        </Card>
        <Card padding="md" className="text-center bg-red-50 border-red-200">
          <p className="text-3xl font-bold text-red-700">{totalCritiques}</p>
          <p className="text-sm text-red-500">Risques critiques</p>
        </Card>
      </div>

      {/* Tableau des risques */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Top 5 Risques</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Rang</TableHead>
              <TableHead>Risque</TableHead>
              <TableHead className="text-center">Prob.</TableHead>
              <TableHead className="text-center">Impact</TableHead>
              <TableHead>Mitigation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {RISQUES_MAJEURS.map((risque) => (
              <TableRow key={risque.rang}>
                <TableCell className="font-bold">{risque.rang}</TableCell>
                <TableCell className="font-medium">{risque.risque}</TableCell>
                <TableCell className={cn('text-center', getProbabiliteColor(risque.probabilite))}>
                  {risque.probabilite === 'haute' ? '🔴' : risque.probabilite === 'moyenne' ? '🟡' : '🟢'}
                </TableCell>
                <TableCell className={cn('text-center', getImpactColor(risque.impact))}>
                  {risque.impact === 'critique' ? '🔴' : risque.impact === 'eleve' ? '🟠' : '🟡'}
                </TableCell>
                <TableCell className="text-sm">{risque.mitigation}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Risques temps réel */}
      {risquesCritiques.length > 0 && (
        <Card padding="md">
          <h4 className="font-semibold text-primary-900 mb-3">Risques Critiques (Temps Réel)</h4>
          <div className="space-y-2">
            {risquesCritiques.map((risque, idx) => (
              <div key={risque.id || idx} className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-red-800">{risque.titre}</span>
                  <Badge className="bg-red-100 text-red-700">Score: {risque.score}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// SLIDE 9 - DÉCISIONS ATTENDUES
// ============================================================================
function SlideDecisions() {
  const [decisions, setDecisions] = useState(DECISIONS_ATTENDUES);

  const toggleDecision = (numero: number) => {
    setDecisions(prev => prev.map(d =>
      d.numero === numero
        ? { ...d, statut: d.statut === 'a_valider' ? 'valide' : 'a_valider' }
        : d
    ));
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="DÉCISIONS ATTENDUES" icon={CheckCircle} color="text-indigo-600" />

      {/* Checklist de Validation */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Checklist de Validation</h4>
        <div className="space-y-3">
          {decisions.map((decision) => (
            <div
              key={decision.numero}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors',
                decision.statut === 'valide' ? 'bg-green-50 border-green-200' : 'bg-primary-50 border-primary-200 hover:bg-primary-100'
              )}
              onClick={() => toggleDecision(decision.numero)}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-200 flex items-center justify-center text-sm font-bold">
                  {decision.numero}
                </span>
                <span className="font-medium">{decision.element}</span>
              </div>
              <div className="flex items-center gap-2">
                {decision.statut === 'valide' ? (
                  <Badge className="bg-green-100 text-green-700">Validé</Badge>
                ) : (
                  <>
                    <span className="text-sm text-primary-400">Validé</span>
                    <input type="checkbox" className="h-4 w-4" checked={false} readOnly />
                    <span className="text-sm text-primary-400">À modifier</span>
                    <input type="checkbox" className="h-4 w-4" checked={false} readOnly />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Prochaines Étapes */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Prochaines Étapes</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Échéance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PROCHAINES_ETAPES.map((etape, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium">{etape.action}</TableCell>
                <TableCell>{etape.responsable}</TableCell>
                <TableCell>
                  <Badge variant="outline">{etape.echeance}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Signatures */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-3">Signatures</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rôle</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Signature</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {SIGNATAIRES.map((signataire, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium">{signataire.role}</TableCell>
                <TableCell>{signataire.nom || '-'}</TableCell>
                <TableCell>-</TableCell>
                <TableCell>-</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
export function DeepDiveLancement() {
  const [activeSlide, setActiveSlide] = useState(1);
  const [presentationDate, setPresentationDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const slides = [
    { numero: 1, titre: 'Rappel Projet & Météo Globale', component: SlideRappelProjet },
    { numero: 2, titre: 'AXE RH & Organisation', component: SlideAxeRH },
    { numero: 3, titre: 'AXE Commercial & Leasing', component: SlideAxeCommercial },
    { numero: 4, titre: 'AXE Technique & Handover', component: SlideAxeTechnique },
    { numero: 5, titre: 'AXE Budget & Finances', component: SlideAxeBudget },
    { numero: 6, titre: 'AXE Marketing & Communication', component: SlideAxeMarketing },
    { numero: 7, titre: 'AXE Exploitation & Juridique', component: SlideAxeExploitation },
    { numero: 8, titre: 'Risques Majeurs', component: SlideRisquesMajeurs },
    { numero: 9, titre: 'Décisions Attendues', component: SlideDecisions },
  ];

  const ActiveSlideComponent = slides.find(s => s.numero === activeSlide)?.component || SlideRappelProjet;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">DEEP DIVE LANCEMENT</h1>
          <p className="text-sm text-primary-500">
            Projet Cosmos Angré - Validation Stratégique
          </p>
          <p className="text-xs text-primary-400">
            Présenté par : Pamela Atokouna, DGA | Destinataires : PDG, Actionnaires
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary-400" />
            <input
              type="date"
              value={presentationDate}
              onChange={(e) => setPresentationDate(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            />
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter PPTX
          </Button>
        </div>
      </div>

      {/* Navigation des slides */}
      <Card padding="sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {slides.map((slide) => (
            <button
              key={slide.numero}
              onClick={() => setActiveSlide(slide.numero)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                activeSlide === slide.numero
                  ? 'bg-primary-100 text-primary-900'
                  : 'text-primary-500 hover:bg-primary-50'
              )}
            >
              <span className="w-6 h-6 rounded-full bg-primary-200 flex items-center justify-center text-xs font-bold">
                {slide.numero}
              </span>
              <span className="hidden md:inline">{slide.titre}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Contenu de la slide active */}
      <Card padding="lg">
        <div className="mb-4 pb-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-primary-900">
              SLIDE {activeSlide} - {slides.find(s => s.numero === activeSlide)?.titre.toUpperCase()}
            </h2>
            <Badge variant="outline">
              {activeSlide} / {slides.length}
            </Badge>
          </div>
        </div>

        <ActiveSlideComponent />

        {/* Navigation bas */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setActiveSlide(Math.max(1, activeSlide - 1))}
            disabled={activeSlide === 1}
          >
            <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
            Précédent
          </Button>
          <span className="text-sm text-primary-500">
            Deep Dive Lancement - Cosmos Angré - CRMC / New Heaven SA
          </span>
          <Button
            variant="outline"
            onClick={() => setActiveSlide(Math.min(slides.length, activeSlide + 1))}
            disabled={activeSlide === slides.length}
          >
            Suivant
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default DeepDiveLancement;
