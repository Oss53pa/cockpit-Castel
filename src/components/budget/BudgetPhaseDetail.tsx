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

export function BudgetPhaseDetail() {
  return (
    <div className="space-y-6">
      {/* En-tête avec budget total */}
      <Card className="bg-gradient-to-r from-primary-900 to-primary-700 text-white">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Budget Projet COSMOS ANGRÉ</h2>
              <p className="text-primary-200">Référentiel V2.0 — Janvier 2026</p>
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

      {/* Onglets par phase */}
      <Tabs defaultValue="phase2" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="phase1">Phase 1</TabsTrigger>
          <TabsTrigger value="phase2">Phase 2</TabsTrigger>
          <TabsTrigger value="phase3">Phase 3</TabsTrigger>
          <TabsTrigger value="phase4">Phase 4</TabsTrigger>
          <TabsTrigger value="tresorerie">Trésorerie</TabsTrigger>
        </TabsList>

        <TabsContent value="phase1">
          <PhaseCard phase={BUDGET_PHASE1} />
        </TabsContent>
        <TabsContent value="phase2">
          <PhaseCard phase={BUDGET_PHASE2} />
        </TabsContent>
        <TabsContent value="phase3">
          <PhaseCard phase={BUDGET_PHASE3} />
        </TabsContent>
        <TabsContent value="phase4">
          <PhaseCard phase={BUDGET_PHASE4} />
        </TabsContent>
        <TabsContent value="tresorerie">
          <TresorerieChart />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default BudgetPhaseDetail;
