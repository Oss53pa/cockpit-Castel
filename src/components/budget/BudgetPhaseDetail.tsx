// ============================================================================
// BUDGET DÉTAILLÉ PAR PHASE - Composant d'affichage
// ============================================================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, TrendingUp, Wallet, Users, Building2, Megaphone, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { BudgetImportExport } from './BudgetImportExport';
import {
  BUDGET_PROJET_TOTAL,
  BUDGET_PHASE1,
  BUDGET_PHASE2,
  BUDGET_PHASE3,
  BUDGET_PHASE4,
  PLAN_TRESORERIE_2026,
  type BudgetPhase,
  type BudgetCategorie,
} from '@/data/cosmosAngreRef4';

// Icônes par catégorie
const CATEGORIE_ICONS: Record<string, React.ReactNode> = {
  'P1-ETUDES': <Building2 className="h-4 w-4" />,
  'P1-CONSEIL': <Users className="h-4 w-4" />,
  'P1-RECRUTEMENT': <Users className="h-4 w-4" />,
  'P1-COMM': <Megaphone className="h-4 w-4" />,
  'P1-IMPREVUS': <Package className="h-4 w-4" />,
  'P2-RH': <Users className="h-4 w-4" />,
  'P2-TRAVAUX': <Building2 className="h-4 w-4" />,
  'P2-EQUIPEMENTS': <Package className="h-4 w-4" />,
  'P2-COMMERCIAL': <TrendingUp className="h-4 w-4" />,
  'P2-COMM': <Megaphone className="h-4 w-4" />,
  'P2-IMPREVUS': <Wallet className="h-4 w-4" />,
  'P3-SOFT': <Building2 className="h-4 w-4" />,
  'P3-INAUG': <Megaphone className="h-4 w-4" />,
  'P3-CAMPAGNE': <Megaphone className="h-4 w-4" />,
  'P3-IMPREVUS': <Wallet className="h-4 w-4" />,
  'P4-OPS': <Building2 className="h-4 w-4" />,
};

// Couleurs par phase
const PHASE_COLORS = {
  phase1_preparation: 'bg-blue-500',
  phase2_mobilisation: 'bg-amber-500',
  phase3_lancement: 'bg-green-500',
  phase4_stabilisation: 'bg-purple-500',
};

interface CategorieRowProps {
  categorie: BudgetCategorie;
  budgetTotal: number;
}

function CategorieRow({ categorie, budgetTotal }: CategorieRowProps) {
  const [expanded, setExpanded] = useState(false);
  const pourcentage = (categorie.montant / budgetTotal) * 100;

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/50"
        onClick={() => setExpanded(!expanded)}
      >
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            {CATEGORIE_ICONS[categorie.code] || <Wallet className="h-4 w-4" />}
            {categorie.label}
          </div>
        </TableCell>
        <TableCell className="text-right font-semibold">
          {formatCurrency(categorie.montant)}
        </TableCell>
        <TableCell className="text-right text-muted-foreground">
          {pourcentage.toFixed(1)}%
        </TableCell>
        <TableCell>
          <Progress value={pourcentage} className="h-2" />
        </TableCell>
      </TableRow>
      {expanded &&
        categorie.postes.map((poste) => (
          <TableRow key={poste.id} className="bg-muted/30">
            <TableCell className="pl-12 text-sm text-muted-foreground">
              <div>
                {poste.label}
                {poste.commentaire && (
                  <span className="ml-2 text-xs text-muted-foreground/70">
                    ({poste.commentaire})
                  </span>
                )}
              </div>
              {poste.effectif && (
                <div className="text-xs text-muted-foreground/70 mt-1">
                  {poste.effectif} pers. × {formatCurrency(poste.salaireMensuel || 0)}/mois × {poste.mois} mois
                </div>
              )}
            </TableCell>
            <TableCell className="text-right text-sm">
              {formatCurrency(poste.montant)}
            </TableCell>
            <TableCell className="text-right text-xs text-muted-foreground">
              {((poste.montant / budgetTotal) * 100).toFixed(2)}%
            </TableCell>
            <TableCell></TableCell>
          </TableRow>
        ))}
    </>
  );
}

interface PhaseCardProps {
  phase: BudgetPhase;
}

function PhaseCard({ phase }: PhaseCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{phase.label}</CardTitle>
            <p className="text-sm text-muted-foreground">{phase.periode}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {formatCurrency(phase.montantTotal)}
            </div>
            <Badge variant="outline" className={`${PHASE_COLORS[phase.phase]} text-white`}>
              {phase.pourcentage}% du budget
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Catégorie</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead className="text-right w-20">%</TableHead>
              <TableHead className="w-32">Répartition</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {phase.categories.map((cat) => (
              <CategorieRow
                key={cat.code}
                categorie={cat}
                budgetTotal={phase.montantTotal}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function TresorerieChart() {
  const maxCumul = PLAN_TRESORERIE_2026[PLAN_TRESORERIE_2026.length - 1].cumul;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan de Trésorerie 2026</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mois</TableHead>
              <TableHead className="text-right">Dépenses</TableHead>
              <TableHead className="text-right">Cumul</TableHead>
              <TableHead className="text-right">%</TableHead>
              <TableHead className="w-40">Progression</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PLAN_TRESORERIE_2026.map((mois) => (
              <TableRow key={mois.mois}>
                <TableCell className="font-medium">{mois.mois}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(mois.depenses)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(mois.cumul)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {mois.pourcentage}%
                </TableCell>
                <TableCell>
                  <Progress
                    value={(mois.cumul / maxCumul) * 100}
                    className="h-2"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Vue Synthèse
function VueSynthese() {
  return (
    <div className="space-y-6">
      {/* En-tête avec budget total */}
      <Card className="bg-gradient-to-r from-primary-900 to-primary-700 text-white">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Budget Projet COSMOS ANGRE</h2>
              <p className="text-primary-200">1,85 Mds FCFA</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">
                {formatCurrency(BUDGET_PROJET_TOTAL.montant)}
              </div>
              <p className="text-primary-200">Budget total projet</p>
            </div>
          </div>
          {/* Barre de répartition */}
          <div className="mt-6 flex h-4 rounded-full overflow-hidden">
            {BUDGET_PROJET_TOTAL.phases.map((phase) => (
              <div
                key={phase.phase}
                className={`${PHASE_COLORS[phase.phase]} transition-all`}
                style={{ width: `${phase.pourcentage}%` }}
                title={`${phase.label}: ${phase.pourcentage}%`}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-primary-200">
            {BUDGET_PROJET_TOTAL.phases.map((phase) => (
              <span key={phase.phase}>
                {phase.label.replace('Phase ', 'P').split(':')[0]}: {phase.pourcentage}%
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tableau récapitulatif des phases */}
      <Card>
        <CardHeader>
          <CardTitle>Synthèse par Phase</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phase</TableHead>
                <TableHead>Période</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead className="w-40">Répartition</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Phase 1: Préparation</TableCell>
                <TableCell>Jan - Mar 2026</TableCell>
                <TableCell className="text-right">{formatCurrency(BUDGET_PHASE1.montantTotal)}</TableCell>
                <TableCell className="text-right">{BUDGET_PHASE1.pourcentage}%</TableCell>
                <TableCell>
                  <Progress value={BUDGET_PHASE1.pourcentage} className={`h-2 ${PHASE_COLORS.phase1_preparation}`} />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Phase 2: Mobilisation</TableCell>
                <TableCell>Avr - Oct 2026</TableCell>
                <TableCell className="text-right">{formatCurrency(BUDGET_PHASE2.montantTotal)}</TableCell>
                <TableCell className="text-right">{BUDGET_PHASE2.pourcentage}%</TableCell>
                <TableCell>
                  <Progress value={BUDGET_PHASE2.pourcentage} className={`h-2 ${PHASE_COLORS.phase2_mobilisation}`} />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Phase 3: Lancement</TableCell>
                <TableCell>Nov - Déc 2026</TableCell>
                <TableCell className="text-right">{formatCurrency(BUDGET_PHASE3.montantTotal)}</TableCell>
                <TableCell className="text-right">{BUDGET_PHASE3.pourcentage}%</TableCell>
                <TableCell>
                  <Progress value={BUDGET_PHASE3.pourcentage} className={`h-2 ${PHASE_COLORS.phase3_lancement}`} />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Phase 4: Stabilisation</TableCell>
                <TableCell>Jan - Déc 2027</TableCell>
                <TableCell className="text-right">{formatCurrency(BUDGET_PHASE4.montantTotal)}</TableCell>
                <TableCell className="text-right">{BUDGET_PHASE4.pourcentage}%</TableCell>
                <TableCell>
                  <Progress value={BUDGET_PHASE4.pourcentage} className={`h-2 ${PHASE_COLORS.phase4_stabilisation}`} />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Vue Détail
function VueDetail() {
  const allPhases = [BUDGET_PHASE1, BUDGET_PHASE2, BUDGET_PHASE3, BUDGET_PHASE4];

  return (
    <div className="space-y-6">
      {allPhases.map((phase) => (
        <PhaseCard key={phase.phase} phase={phase} />
      ))}
    </div>
  );
}

// Vue Graphiques
function VueGraphiques() {
  const phaseData = [
    { name: 'P1: Préparation', montant: BUDGET_PHASE1.montantTotal / 1_000_000, fill: '#3b82f6' },
    { name: 'P2: Mobilisation', montant: BUDGET_PHASE2.montantTotal / 1_000_000, fill: '#f59e0b' },
    { name: 'P3: Lancement', montant: BUDGET_PHASE3.montantTotal / 1_000_000, fill: '#22c55e' },
    { name: 'P4: Stabilisation', montant: BUDGET_PHASE4.montantTotal / 1_000_000, fill: '#8b5cf6' },
  ];

  return (
    <div className="space-y-6">
      {/* Répartition par phase */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition du budget par phase</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <TresorerieChart />
          </div>
        </CardContent>
      </Card>

      {/* Graphique des phases */}
      <Card>
        <CardHeader>
          <CardTitle>Budget par phase (M FCFA)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {phaseData.map((phase) => (
              <div key={phase.name} className="text-center p-4 rounded-lg" style={{ backgroundColor: `${phase.fill}20` }}>
                <p className="text-2xl font-bold" style={{ color: phase.fill }}>{phase.montant.toFixed(0)} M</p>
                <p className="text-sm text-muted-foreground">{phase.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Vue Par Phase
function VueParPhase() {
  const [selectedPhase, setSelectedPhase] = useState('phase2');

  const phases = {
    phase1: BUDGET_PHASE1,
    phase2: BUDGET_PHASE2,
    phase3: BUDGET_PHASE3,
    phase4: BUDGET_PHASE4,
  };

  return (
    <div className="space-y-6">
      {/* Sélecteur de phase */}
      <div className="flex gap-2">
        {Object.entries(phases).map(([key, phase]) => (
          <button
            key={key}
            onClick={() => setSelectedPhase(key)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPhase === key
                ? `${PHASE_COLORS[phase.phase]} text-white`
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {phase.label.split(':')[0]}
          </button>
        ))}
      </div>

      {/* Phase sélectionnée */}
      <PhaseCard phase={phases[selectedPhase as keyof typeof phases]} />
    </div>
  );
}

export function BudgetPhaseDetail() {
  const [activeTab, setActiveTab] = useState('synthese');

  return (
    <div className="space-y-6">
      {/* Toolbar Import/Export */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary-900">Budget Estimatif par Phase</h2>
          <p className="text-sm text-primary-500">Referentiel V2.0 - Janvier 2026</p>
        </div>
        <BudgetImportExport budgetType="estimatif" />
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="synthese">Synthèse</TabsTrigger>
          <TabsTrigger value="detail">Détail</TabsTrigger>
          <TabsTrigger value="graphiques">Graphiques</TabsTrigger>
          <TabsTrigger value="par-phase">Par phase</TabsTrigger>
        </TabsList>

        <TabsContent value="synthese">
          <VueSynthese />
        </TabsContent>
        <TabsContent value="detail">
          <VueDetail />
        </TabsContent>
        <TabsContent value="graphiques">
          <VueGraphiques />
        </TabsContent>
        <TabsContent value="par-phase">
          <VueParPhase />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default BudgetPhaseDetail;
