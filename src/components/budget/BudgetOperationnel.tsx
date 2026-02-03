import { useState, useEffect } from 'react';
import {
  Wallet,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  PiggyBank,
  AlertTriangle,
  ArrowDownLeft,
  Building2,
  Clock,
  Users,
  Shield,
  Droplets,
  Zap,
  FileText,
  Megaphone,
  ChevronDown,
  ChevronRight,
  Calendar,
  Percent,
  Info,
  Pencil,
  RotateCcw,
  Loader2,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';
import {
  Card,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  Badge,
  Button,
  Progress,
  Input,
  MoneyInput,
} from '@/components/ui';
import { formatNumber } from '@/lib/utils';
import { BudgetImportExport } from './BudgetImportExport';
import { BudgetEditModal } from './BudgetEditModal';
import { useBudgetExploitation } from '@/hooks/useBudgetExploitation';
import { resetBudgetEngagements } from '@/hooks';
import type { LigneBudgetExploitation } from '@/types/budgetExploitation.types';

// Import des vraies données Cosmos Angré
import {
  BUDGET_EXPLOITATION_2026,
  BUDGET_EXPLOITATION_2027,
  SYNTHESE_COMPARATIVE,
  RATIOS_BENCHMARKS,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  PREVISIONS_MENSUELLES_2027,
  GLA_COSMOS_ANGRE,
  // Détails 2026
  GRILLE_SALARIALE,
  VAGUES_RECRUTEMENT_2026,
  PRESTATIONS_SECURITE_2026,
  PRESTATIONS_NETTOYAGE_2026,
  PRESTATIONS_MAINTENANCE_2026,
  FLUIDES_2026,
  ASSURANCES_2026,
  FONCTIONNEMENT_2026,
  MARKETING_2026,
  TOTAL_EFFECTIF_2026,
  // Totaux 2026
  TOTAL_SECURITE_2026,
  TOTAL_NETTOYAGE_2026,
  TOTAL_MAINTENANCE_2026,
  TOTAL_FLUIDES_2026,
  TOTAL_ASSURANCES_2026,
  TOTAL_FONCTIONNEMENT_2026,
  TOTAL_MARKETING_2026,
  // Détails 2027
  PRESTATIONS_SECURITE_2027,
  PRESTATIONS_NETTOYAGE_2027,
  PRESTATIONS_MAINTENANCE_2027,
  FLUIDES_2027,
  ASSURANCES_2027,
  FONCTIONNEMENT_2027,
  MARKETING_2027,
  PROVISIONS_2027,
  MASSE_SALARIALE_2027,
  TOTAL_EFFECTIF_2027,
  // Totaux 2027
  TOTAL_SECURITE_2027,
  TOTAL_NETTOYAGE_2027,
  TOTAL_MAINTENANCE_2027,
  TOTAL_FLUIDES_2027,
  TOTAL_ASSURANCES_2027,
  TOTAL_FONCTIONNEMENT_2027,
  TOTAL_MARKETING_2027,
  TOTAL_PROVISIONS_2027,
  TOTAL_MASSE_SALARIALE_2027,
  // Types
  type BudgetExploitationAnnee,
  type CategorieExploitation,
} from '@/data/budgetExploitationCosmosAngre';

// Format montant en FCFA
function formatMontant(value: number): string {
  if (value === 0) return '0';
  if (value >= 1_000_000_000) {
    return `${formatNumber(value / 1_000_000_000, 1)} Md`;
  }
  if (value >= 1_000_000) {
    return `${formatNumber(value / 1_000_000, 1)} M`;
  }
  if (value >= 1_000) {
    return `${formatNumber(value / 1_000, 1)} K`;
  }
  return formatNumber(value, 0);
}

// Icône par catégorie
const CATEGORY_ICONS: Record<CategorieExploitation, React.ElementType> = {
  masse_salariale: Users,
  prestations: Shield,
  fluides: Zap,
  assurances: FileText,
  fonctionnement: Building2,
  marketing: Megaphone,
  provisions: PiggyBank,
  contingence: AlertTriangle,
};

// Composant KPI Card
function KPICard({
  label,
  value,
  subValue,
  icon: Icon,
  color,
  bgColor,
}: {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-primary-200 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-primary-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-primary-900">{value}</p>
          {subValue && (
            <p className="text-xs text-primary-400 mt-1">{subValue}</p>
          )}
        </div>
        <div className={cn('rounded-lg p-2', bgColor)}>
          <Icon className={cn('h-5 w-5', color)} />
        </div>
      </div>
    </div>
  );
}

// Sélecteur d'année
function AnneeSelector({
  annee,
  onChange,
}: {
  annee: 2026 | 2027;
  onChange: (annee: 2026 | 2027) => void;
}) {
  return (
    <div className="flex items-center gap-2 bg-primary-100 rounded-lg p-1">
      <button
        onClick={() => onChange(2026)}
        className={cn(
          'px-4 py-2 rounded-md text-sm font-medium transition-colors',
          annee === 2026
            ? 'bg-white text-primary-900 shadow-sm'
            : 'text-primary-600 hover:bg-primary-50'
        )}
      >
        2026 (10 mois)
      </button>
      <button
        onClick={() => onChange(2027)}
        className={cn(
          'px-4 py-2 rounded-md text-sm font-medium transition-colors',
          annee === 2027
            ? 'bg-white text-primary-900 shadow-sm'
            : 'text-primary-600 hover:bg-primary-50'
        )}
      >
        2027 (12 mois)
      </button>
    </div>
  );
}

// Vue Synthèse
function VueSynthese({ budget }: { budget: BudgetExploitationAnnee }) {
  const parCategorie = budget.postes.reduce((acc, poste) => {
    acc[poste.categorie] = (acc[poste.categorie] || 0) + poste.budgetAnnuel;
    return acc;
  }, {} as Record<CategorieExploitation, number>);

  const pieData = Object.entries(parCategorie).map(([cat, montant]) => ({
    name: CATEGORY_LABELS[cat as CategorieExploitation],
    value: montant,
    fill: CATEGORY_COLORS[cat as CategorieExploitation].fill,
  }));

  return (
    <div className="space-y-6">
      {/* Info périmètre */}
      <Card padding="md">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-blue-100">
            <Info className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-primary-900">
              Périmètre {budget.annee}
            </h3>
            <p className="text-sm text-primary-500">{budget.periode}</p>
          </div>
        </div>
        <ul className="list-disc list-inside space-y-1 text-sm text-primary-600">
          {budget.perimetre.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </Card>

      {/* Répartition par catégorie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="md">
          <h3 className="text-lg font-semibold text-primary-900 mb-4">
            Répartition par catégorie
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${formatMontant(value)} FCFA`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card padding="md">
          <h3 className="text-lg font-semibold text-primary-900 mb-4">
            Montants par catégorie
          </h3>
          <div className="space-y-3">
            {Object.entries(parCategorie).map(([cat, montant]) => {
              const colors = CATEGORY_COLORS[cat as CategorieExploitation];
              const Icon = CATEGORY_ICONS[cat as CategorieExploitation];
              const pct = (montant / budget.montantTotal) * 100;
              return (
                <div
                  key={cat}
                  className={cn('p-3 rounded-lg border', colors.bg, colors.border)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={cn('h-4 w-4', colors.text)} />
                      <span className={cn('text-sm font-medium', colors.text)}>
                        {CATEGORY_LABELS[cat as CategorieExploitation]}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary-900">{formatMontant(montant)}</p>
                      <p className="text-xs text-primary-500">{pct.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Tableau des postes */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-primary-900 mb-4">
          Postes budgétaires {budget.annee}
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">#</TableHead>
              <TableHead>Poste</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead className="text-right">Montant (FCFA)</TableHead>
              <TableHead className="text-right">Part</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {budget.postes.map((poste, idx) => {
              const colors = CATEGORY_COLORS[poste.categorie];
              return (
                <TableRow key={poste.id}>
                  <TableCell className="text-primary-400">{idx + 1}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{poste.poste}</p>
                      {poste.details && (
                        <p className="text-xs text-primary-400">{poste.details}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(colors.bg, colors.text)}>
                      {CATEGORY_LABELS[poste.categorie]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatMontant(poste.budgetAnnuel)}
                  </TableCell>
                  <TableCell className="text-right">
                    {((poste.budgetAnnuel / budget.montantTotal) * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-primary-100">
              <TableCell colSpan={3} className="font-bold">
                TOTAL EXPLOITATION {budget.annee}
              </TableCell>
              <TableCell className="text-right font-bold font-mono">
                {formatMontant(budget.montantTotal)}
              </TableCell>
              <TableCell className="text-right font-bold">100%</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Card>
    </div>
  );
}

// Vue Détails
function VueDetails({ annee }: { annee: 2026 | 2027 }) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    salaires: true,
    securite: false,
    nettoyage: false,
    maintenance: false,
    fluides: false,
    assurances: false,
    fonctionnement: false,
    marketing: false,
    provisions: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const SectionHeader = ({
    id,
    title,
    total,
    icon: Icon,
  }: {
    id: string;
    title: string;
    total: number;
    icon: React.ElementType;
  }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-primary-600" />
        <span className="font-semibold text-primary-900">{title}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-bold text-primary-900">{formatMontant(total)} FCFA</span>
        {expandedSections[id] ? (
          <ChevronDown className="h-5 w-5 text-primary-400" />
        ) : (
          <ChevronRight className="h-5 w-5 text-primary-400" />
        )}
      </div>
    </button>
  );

  if (annee === 2026) {
    return (
      <div className="space-y-4">
        {/* Masse Salariale 2026 */}
        <Card padding="none">
          <SectionHeader id="salaires" title="1. Masse Salariale 2026" total={BUDGET_EXPLOITATION_2026.postes.find(p => p.categorie === 'masse_salariale')?.budgetAnnuel || 0} icon={Users} />
          {expandedSections.salaires && (
            <div className="p-4 border-t space-y-4">
              {/* Grille salariale */}
              <div>
                <h4 className="font-medium text-primary-700 mb-2">Grille salariale (brut mensuel + charges 25%)</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Poste</TableHead>
                      <TableHead className="text-right">Brut mensuel</TableHead>
                      <TableHead className="text-right">Chargé mensuel</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {GRILLE_SALARIALE.map((item) => (
                      <TableRow key={item.poste}>
                        <TableCell className="font-medium">{item.poste}</TableCell>
                        <TableCell className="text-right">{formatMontant(item.brutMensuel)}</TableCell>
                        <TableCell className="text-right">{formatMontant(item.chargeMensuel)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="text-xs text-primary-400 mt-2">*Mutualisé avec Yopougon (25% affecté Angré)</p>
              </div>

              {/* Échelonnement par vague */}
              <div>
                <h4 className="font-medium text-primary-700 mb-2">Échelonnement par vague</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vague</TableHead>
                      <TableHead>Postes</TableHead>
                      <TableHead className="text-center">Effectif</TableHead>
                      <TableHead>Début</TableHead>
                      <TableHead className="text-center">Mois 2026</TableHead>
                      <TableHead className="text-right">Coût total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {VAGUES_RECRUTEMENT_2026.map((vague) => (
                      <TableRow key={vague.vague}>
                        <TableCell className="font-medium">{vague.vague}</TableCell>
                        <TableCell className="text-sm">{vague.postes}</TableCell>
                        <TableCell className="text-center">{vague.effectif}</TableCell>
                        <TableCell>{vague.debutMois}</TableCell>
                        <TableCell className="text-center">{vague.mois2026}</TableCell>
                        <TableCell className="text-right font-mono">{formatMontant(vague.coutTotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2} className="font-bold">TOTAL</TableCell>
                      <TableCell className="text-center font-bold">{TOTAL_EFFECTIF_2026}</TableCell>
                      <TableCell colSpan={2}></TableCell>
                      <TableCell className="text-right font-bold">90 525 000</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={5}>Charges sociales complémentaires (CNPS, etc.)</TableCell>
                      <TableCell className="text-right font-mono">7 975 000</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </div>
          )}
        </Card>

        {/* Prestations Sécurité */}
        <Card padding="none">
          <SectionHeader id="securite" title="2.1 Sécurité (Nov-Déc)" total={TOTAL_SECURITE_2026} icon={Shield} />
          {expandedSections.securite && (
            <div className="p-4 border-t">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prestation</TableHead>
                    <TableHead className="text-center">Effectif</TableHead>
                    <TableHead className="text-right">Coût/agent/mois</TableHead>
                    <TableHead className="text-center">Mois</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PRESTATIONS_SECURITE_2026.map((item) => (
                    <TableRow key={item.prestation}>
                      <TableCell className="font-medium">{item.prestation}</TableCell>
                      <TableCell className="text-center">{item.effectif}</TableCell>
                      <TableCell className="text-right">{formatMontant(item.coutUnitaireMensuel)}</TableCell>
                      <TableCell className="text-center">{item.mois}</TableCell>
                      <TableCell className="text-right font-mono">{formatMontant(item.montant)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold">Total Sécurité</TableCell>
                    <TableCell className="text-center font-bold">32</TableCell>
                    <TableCell colSpan={2}></TableCell>
                    <TableCell className="text-right font-bold">24 000 000</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </Card>

        {/* Prestations Nettoyage */}
        <Card padding="none">
          <SectionHeader id="nettoyage" title="2.2 Nettoyage (Nov-Déc)" total={TOTAL_NETTOYAGE_2026} icon={Droplets} />
          {expandedSections.nettoyage && (
            <div className="p-4 border-t">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prestation</TableHead>
                    <TableHead className="text-center">Effectif</TableHead>
                    <TableHead className="text-right">Coût/mois</TableHead>
                    <TableHead className="text-center">Mois</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PRESTATIONS_NETTOYAGE_2026.map((item) => (
                    <TableRow key={item.prestation}>
                      <TableCell className="font-medium">{item.prestation}</TableCell>
                      <TableCell className="text-center">{item.effectif || '-'}</TableCell>
                      <TableCell className="text-right">{formatMontant(item.coutUnitaireMensuel)}</TableCell>
                      <TableCell className="text-center">{item.mois}</TableCell>
                      <TableCell className="text-right font-mono">{formatMontant(item.montant)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold">Total Nettoyage</TableCell>
                    <TableCell className="text-center font-bold">27</TableCell>
                    <TableCell colSpan={2}></TableCell>
                    <TableCell className="text-right font-bold">22 500 000</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </Card>

        {/* Prestations Maintenance */}
        <Card padding="none">
          <SectionHeader id="maintenance" title="2.3 Maintenance (Nov-Déc)" total={TOTAL_MAINTENANCE_2026} icon={Building2} />
          {expandedSections.maintenance && (
            <div className="p-4 border-t">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prestation</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Mensuel</TableHead>
                    <TableHead className="text-center">Mois</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PRESTATIONS_MAINTENANCE_2026.map((item) => (
                    <TableRow key={item.prestation}>
                      <TableCell className="font-medium">{item.prestation}</TableCell>
                      <TableCell>
                        <Badge variant={item.statut === 'Sous garantie' ? 'outline' : 'default'}>
                          {item.statut}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatMontant(item.coutUnitaireMensuel)}</TableCell>
                      <TableCell className="text-center">{item.mois}</TableCell>
                      <TableCell className="text-right font-mono">{formatMontant(item.montant)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4} className="font-bold">Total Maintenance</TableCell>
                    <TableCell className="text-right font-bold">2 500 000</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </Card>

        {/* Fluides */}
        <Card padding="none">
          <SectionHeader id="fluides" title="3. Fluides & Énergies (Nov-Déc)" total={TOTAL_FLUIDES_2026} icon={Zap} />
          {expandedSections.fluides && (
            <div className="p-4 border-t">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Poste</TableHead>
                    <TableHead className="text-right">Mensuel estimé</TableHead>
                    <TableHead className="text-center">Mois</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {FLUIDES_2026.map((item) => (
                    <TableRow key={item.poste}>
                      <TableCell className="font-medium">{item.poste}</TableCell>
                      <TableCell className="text-right">{formatMontant(item.mensuelEstime || 0)}</TableCell>
                      <TableCell className="text-center">{item.mois}</TableCell>
                      <TableCell className="text-right font-mono">{formatMontant(item.montant)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="font-bold">Total Fluides (arrondi)</TableCell>
                    <TableCell className="text-right font-bold">28 000 000</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </Card>

        {/* Assurances */}
        <Card padding="none">
          <SectionHeader id="assurances" title="4. Assurances (prorata Nov-Déc)" total={TOTAL_ASSURANCES_2026} icon={FileText} />
          {expandedSections.assurances && (
            <div className="p-4 border-t">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Annuel</TableHead>
                    <TableHead className="text-right">Prorata 2 mois</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ASSURANCES_2026.map((item) => (
                    <TableRow key={item.type}>
                      <TableCell className="font-medium">{item.type}</TableCell>
                      <TableCell className="text-right">{formatMontant(item.primeAnnuelle)}</TableCell>
                      <TableCell className="text-right font-mono">{formatMontant(item.prorata2Mois || 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold">Total Assurances</TableCell>
                    <TableCell className="text-right">25 500 000</TableCell>
                    <TableCell className="text-right font-bold">5 000 000</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </Card>

        {/* Fonctionnement */}
        <Card padding="none">
          <SectionHeader id="fonctionnement" title="5. Fonctionnement (Nov-Déc)" total={TOTAL_FONCTIONNEMENT_2026} icon={Building2} />
          {expandedSections.fonctionnement && (
            <div className="p-4 border-t">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Poste</TableHead>
                    <TableHead className="text-right">Mensuel</TableHead>
                    <TableHead className="text-center">Mois</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {FONCTIONNEMENT_2026.map((item) => (
                    <TableRow key={item.poste}>
                      <TableCell className="font-medium">{item.poste}</TableCell>
                      <TableCell className="text-right">{formatMontant(item.mensuel)}</TableCell>
                      <TableCell className="text-center">{item.mois}</TableCell>
                      <TableCell className="text-right font-mono">{formatMontant(item.montant)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="font-bold">Total Fonctionnement (arrondi)</TableCell>
                    <TableCell className="text-right font-bold">4 000 000</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </Card>

        {/* Marketing */}
        <Card padding="none">
          <SectionHeader id="marketing" title="6. Marketing Exploitation (Nov-Déc)" total={TOTAL_MARKETING_2026} icon={Megaphone} />
          {expandedSections.marketing && (
            <div className="p-4 border-t">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Poste</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MARKETING_2026.map((item) => (
                    <TableRow key={item.poste}>
                      <TableCell className="font-medium">{item.poste}</TableCell>
                      <TableCell className="text-right font-mono">{formatMontant(item.montant)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold">Total Marketing</TableCell>
                    <TableCell className="text-right font-bold">6 000 000</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Vue détails 2027
  return (
    <div className="space-y-4">
      {/* Masse Salariale 2027 */}
      <Card padding="none">
        <SectionHeader id="salaires" title="1. Masse Salariale 2027" total={TOTAL_MASSE_SALARIALE_2027} icon={Users} />
        {expandedSections.salaires && (
          <div className="p-4 border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-center">Effectif</TableHead>
                  <TableHead className="text-right">Coût mensuel chargé</TableHead>
                  <TableHead className="text-right">Coût annuel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MASSE_SALARIALE_2027.map((item) => (
                  <TableRow key={item.categorie}>
                    <TableCell className="font-medium">{item.categorie}</TableCell>
                    <TableCell className="text-center">{item.effectif}</TableCell>
                    <TableCell className="text-right">{formatMontant(item.coutMensuelCharge)}</TableCell>
                    <TableCell className="text-right font-mono">{formatMontant(item.coutAnnuel)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-bold">TOTAL</TableCell>
                  <TableCell className="text-center font-bold">{TOTAL_EFFECTIF_2027}</TableCell>
                  <TableCell className="text-right">10 850 000</TableCell>
                  <TableCell className="text-right">161 100 000</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}>Charges complémentaires, primes, 13ème mois</TableCell>
                  <TableCell className="text-right font-mono">3 900 000</TableCell>
                </TableRow>
                <TableRow className="bg-primary-100">
                  <TableCell colSpan={3} className="font-bold">TOTAL MASSE SALARIALE 2027</TableCell>
                  <TableCell className="text-right font-bold">165 000 000</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </Card>

      {/* Prestations 2027 */}
      <Card padding="none">
        <SectionHeader id="securite" title="2.1 Sécurité" total={TOTAL_SECURITE_2027} icon={Shield} />
        {expandedSections.securite && (
          <div className="p-4 border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prestation</TableHead>
                  <TableHead className="text-center">Effectif</TableHead>
                  <TableHead className="text-right">Coût/agent/mois</TableHead>
                  <TableHead className="text-center">Mois</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PRESTATIONS_SECURITE_2027.map((item) => (
                  <TableRow key={item.prestation}>
                    <TableCell className="font-medium">{item.prestation}</TableCell>
                    <TableCell className="text-center">{item.effectif}</TableCell>
                    <TableCell className="text-right">{formatMontant(item.coutUnitaireMensuel)}</TableCell>
                    <TableCell className="text-center">{item.mois}</TableCell>
                    <TableCell className="text-right font-mono">{formatMontant(item.montant)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="font-bold">Total Sécurité</TableCell>
                  <TableCell className="text-right font-bold">145 000 000</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </Card>

      <Card padding="none">
        <SectionHeader id="nettoyage" title="2.2 Nettoyage" total={TOTAL_NETTOYAGE_2027} icon={Droplets} />
        {expandedSections.nettoyage && (
          <div className="p-4 border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prestation</TableHead>
                  <TableHead className="text-center">Effectif</TableHead>
                  <TableHead className="text-right">Coût/mois</TableHead>
                  <TableHead className="text-center">Mois</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PRESTATIONS_NETTOYAGE_2027.map((item) => (
                  <TableRow key={item.prestation}>
                    <TableCell className="font-medium">{item.prestation}</TableCell>
                    <TableCell className="text-center">{item.effectif || '-'}</TableCell>
                    <TableCell className="text-right">{formatMontant(item.coutUnitaireMensuel)}</TableCell>
                    <TableCell className="text-center">{item.mois}</TableCell>
                    <TableCell className="text-right font-mono">{formatMontant(item.montant)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="font-bold">Total Nettoyage</TableCell>
                  <TableCell className="text-right font-bold">100 000 000</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </Card>

      <Card padding="none">
        <SectionHeader id="maintenance" title="2.3 Maintenance" total={TOTAL_MAINTENANCE_2027} icon={Building2} />
        {expandedSections.maintenance && (
          <div className="p-4 border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prestation</TableHead>
                  <TableHead>Statut 2027</TableHead>
                  <TableHead className="text-right">Mensuel</TableHead>
                  <TableHead className="text-right">Annuel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PRESTATIONS_MAINTENANCE_2027.map((item) => (
                  <TableRow key={item.prestation}>
                    <TableCell className="font-medium">{item.prestation}</TableCell>
                    <TableCell>
                      <Badge variant={item.statut === 'Sous garantie' ? 'outline' : 'default'}>
                        {item.statut}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatMontant(item.coutUnitaireMensuel)}</TableCell>
                    <TableCell className="text-right font-mono">{formatMontant(item.montant)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="font-bold">Total Maintenance (arrondi avec marge)</TableCell>
                  <TableCell className="text-right font-bold">50 000 000</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </Card>

      {/* Fluides 2027 */}
      <Card padding="none">
        <SectionHeader id="fluides" title="3. Fluides & Énergies" total={TOTAL_FLUIDES_2027} icon={Zap} />
        {expandedSections.fluides && (
          <div className="p-4 border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Poste</TableHead>
                  <TableHead>Conso. annuelle</TableHead>
                  <TableHead>Tarif</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {FLUIDES_2027.map((item) => (
                  <TableRow key={item.poste}>
                    <TableCell className="font-medium">{item.poste}</TableCell>
                    <TableCell>{item.consoAnnuelle || '-'}</TableCell>
                    <TableCell>{item.tarif || '-'}</TableCell>
                    <TableCell className="text-right font-mono">{formatMontant(item.montant)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="font-bold">Total Fluides (arrondi)</TableCell>
                  <TableCell className="text-right font-bold">160 000 000</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </Card>

      {/* Assurances 2027 */}
      <Card padding="none">
        <SectionHeader id="assurances" title="4. Assurances" total={TOTAL_ASSURANCES_2027} icon={FileText} />
        {expandedSections.assurances && (
          <div className="p-4 border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Prime annuelle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ASSURANCES_2027.map((item) => (
                  <TableRow key={item.type}>
                    <TableCell className="font-medium">{item.type}</TableCell>
                    <TableCell className="text-right font-mono">{formatMontant(item.primeAnnuelle)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-bold">Total Assurances</TableCell>
                  <TableCell className="text-right font-bold">26 000 000</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </Card>

      {/* Fonctionnement 2027 */}
      <Card padding="none">
        <SectionHeader id="fonctionnement" title="5. Fonctionnement" total={TOTAL_FONCTIONNEMENT_2027} icon={Building2} />
        {expandedSections.fonctionnement && (
          <div className="p-4 border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Poste</TableHead>
                  <TableHead className="text-right">Mensuel</TableHead>
                  <TableHead className="text-right">Annuel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {FONCTIONNEMENT_2027.map((item) => (
                  <TableRow key={item.poste}>
                    <TableCell className="font-medium">{item.poste}</TableCell>
                    <TableCell className="text-right">{formatMontant(item.mensuel)}</TableCell>
                    <TableCell className="text-right font-mono">{formatMontant(item.montant)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2} className="font-bold">Total Fonctionnement</TableCell>
                  <TableCell className="text-right font-bold">24 000 000</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </Card>

      {/* Marketing 2027 */}
      <Card padding="none">
        <SectionHeader id="marketing" title="6. Marketing & Communication" total={TOTAL_MARKETING_2027} icon={Megaphone} />
        {expandedSections.marketing && (
          <div className="p-4 border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Poste</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MARKETING_2027.map((item) => (
                  <TableRow key={item.poste}>
                    <TableCell className="font-medium">{item.poste}</TableCell>
                    <TableCell className="text-right font-mono">{formatMontant(item.montant)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-bold">Total Marketing</TableCell>
                  <TableCell className="text-right font-bold">35 000 000</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </Card>

      {/* Provisions 2027 */}
      <Card padding="none">
        <SectionHeader id="provisions" title="7. Provisions" total={TOTAL_PROVISIONS_2027} icon={PiggyBank} />
        {expandedSections.provisions && (
          <div className="p-4 border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Poste</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PROVISIONS_2027.map((item) => (
                  <TableRow key={item.poste}>
                    <TableCell className="font-medium">{item.poste}</TableCell>
                    <TableCell className="text-right font-mono">{formatMontant(item.montant)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-bold">Total Provisions</TableCell>
                  <TableCell className="text-right font-bold">20 000 000</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}

// Vue Comparative
function VueComparative() {
  const chartData = SYNTHESE_COMPARATIVE.postes.map((p) => ({
    poste: p.poste,
    '2026': p.budget2026,
    '2027': p.budget2027,
  }));

  return (
    <div className="space-y-6">
      {/* Graphique comparatif */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-primary-900 mb-4">
          Comparaison 2026 vs 2027
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis
                dataKey="poste"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: '#e4e4e7' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e4e4e7' }}
                tickFormatter={(value) => `${value / 1_000_000}M`}
              />
              <Tooltip
                formatter={(value: number) => `${formatMontant(value)} FCFA`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e4e4e7',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="2026" name="2026 (10 mois)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="2027" name="2027 (12 mois)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Tableau comparatif */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-primary-900 mb-4">
          Synthèse comparative
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Poste</TableHead>
              <TableHead className="text-right">2026 (10 mois)</TableHead>
              <TableHead className="text-right">2027 (12 mois)</TableHead>
              <TableHead className="text-right">Variation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {SYNTHESE_COMPARATIVE.postes.map((p) => {
              const variation = p.budget2027 - p.budget2026;
              const variationPct = p.budget2026 > 0 ? ((variation / p.budget2026) * 100) : 100;
              return (
                <TableRow key={p.poste}>
                  <TableCell className="font-medium">{p.poste}</TableCell>
                  <TableCell className="text-right font-mono">{formatMontant(p.budget2026)}</TableCell>
                  <TableCell className="text-right font-mono">{formatMontant(p.budget2027)}</TableCell>
                  <TableCell className="text-right">
                    <span className={cn(
                      'font-medium',
                      variation > 0 ? 'text-amber-600' : variation < 0 ? 'text-green-600' : 'text-primary-500'
                    )}>
                      {variation > 0 ? '+' : ''}{formatMontant(variation)}
                      {p.budget2026 > 0 && ` (${variationPct > 0 ? '+' : ''}${variationPct.toFixed(0)}%)`}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-primary-100">
              <TableCell className="font-bold">TOTAL</TableCell>
              <TableCell className="text-right font-bold font-mono">
                {formatMontant(SYNTHESE_COMPARATIVE.totaux.budget2026)}
              </TableCell>
              <TableCell className="text-right font-bold font-mono">
                {formatMontant(SYNTHESE_COMPARATIVE.totaux.budget2027)}
              </TableCell>
              <TableCell className="text-right font-bold text-amber-600">
                +{formatMontant(SYNTHESE_COMPARATIVE.totaux.budget2027 - SYNTHESE_COMPARATIVE.totaux.budget2026)}
                {' '}(+{(((SYNTHESE_COMPARATIVE.totaux.budget2027 - SYNTHESE_COMPARATIVE.totaux.budget2026) / SYNTHESE_COMPARATIVE.totaux.budget2026) * 100).toFixed(0)}%)
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Card>

      {/* Ratios & Benchmarks */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-primary-900 mb-4">
          Ratios & Benchmarks (2027)
        </h3>
        <p className="text-sm text-primary-500 mb-4">
          GLA Cosmos Angré : {GLA_COSMOS_ANGRE.toLocaleString()} m²
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Indicateur</TableHead>
              <TableHead className="text-center">Valeur</TableHead>
              <TableHead className="text-center">Benchmark CI</TableHead>
              <TableHead className="text-center">Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {RATIOS_BENCHMARKS.map((r) => (
              <TableRow key={r.indicateur}>
                <TableCell className="font-medium">{r.indicateur}</TableCell>
                <TableCell className="text-center font-mono">{r.valeur}</TableCell>
                <TableCell className="text-center text-primary-500">{r.benchmarkCI}</TableCell>
                <TableCell className="text-center">
                  <Badge className="bg-green-100 text-green-700">
                    Dans les standards
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-sm text-primary-500 mt-4 italic">
          Analyse : Budget dans les standards du marché ivoirien pour un centre de cette taille.
        </p>
      </Card>
    </div>
  );
}

// Vue Graphiques
function VueGraphiques({ budget }: { budget: BudgetExploitationAnnee }) {
  const parCategorie = budget.postes.reduce((acc, poste) => {
    acc[poste.categorie] = (acc[poste.categorie] || 0) + poste.budgetAnnuel;
    return acc;
  }, {} as Record<CategorieExploitation, number>);

  const pieData = Object.entries(parCategorie).map(([cat, montant]) => ({
    name: CATEGORY_LABELS[cat as CategorieExploitation],
    value: montant,
    fill: CATEGORY_COLORS[cat as CategorieExploitation].fill,
  }));

  const barData = budget.postes.map((p) => ({
    name: p.poste.substring(0, 15),
    montant: p.budgetAnnuel / 1_000_000,
    fill: CATEGORY_COLORS[p.categorie].fill,
  }));

  // Données mensuelles simulées
  const monthlyData = budget.annee === 2026
    ? [
        { mois: 'Nov', montant: budget.montantTotal / 2 / 1_000_000 },
        { mois: 'Déc', montant: budget.montantTotal / 2 / 1_000_000 },
      ]
    : [
        { mois: 'Jan', montant: budget.montantTotal / 12 / 1_000_000 },
        { mois: 'Fév', montant: budget.montantTotal / 12 / 1_000_000 },
        { mois: 'Mar', montant: budget.montantTotal / 12 / 1_000_000 },
        { mois: 'Avr', montant: budget.montantTotal / 12 / 1_000_000 },
        { mois: 'Mai', montant: budget.montantTotal / 12 / 1_000_000 },
        { mois: 'Juin', montant: budget.montantTotal / 12 / 1_000_000 },
        { mois: 'Juil', montant: budget.montantTotal / 12 / 1_000_000 },
        { mois: 'Août', montant: budget.montantTotal / 12 / 1_000_000 },
        { mois: 'Sept', montant: budget.montantTotal / 12 / 1_000_000 },
        { mois: 'Oct', montant: budget.montantTotal / 12 / 1_000_000 },
        { mois: 'Nov', montant: budget.montantTotal / 12 / 1_000_000 },
        { mois: 'Déc', montant: budget.montantTotal / 12 / 1_000_000 },
      ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card padding="md">
          <h3 className="font-semibold text-primary-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary-600" />
            Répartition par catégorie
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${formatMontant(value)} FCFA`, 'Montant']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Bar Chart */}
        <Card padding="md">
          <h3 className="font-semibold text-primary-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary-600" />
            Montants par poste (M FCFA)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={120} fontSize={11} />
                <Tooltip formatter={(value: number) => [`${value.toFixed(0)} M FCFA`, 'Montant']} />
                <Bar dataKey="montant" radius={[0, 4, 4, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Evolution mensuelle */}
      <Card padding="md">
        <h3 className="font-semibold text-primary-900 mb-4">
          Budget mensuel prévisionnel {budget.annee} (M FCFA)
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v.toFixed(0)}M`} />
              <Tooltip formatter={(value: number) => [`${value.toFixed(1)} M FCFA`, 'Budget']} />
              <Bar dataKey="montant" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-primary-500 text-center mt-2">
          Budget moyen mensuel : {formatMontant(budget.montantTotal / (budget.annee === 2026 ? 2 : 12))} FCFA
        </p>
      </Card>

      {/* Comparaison 2026 vs 2027 */}
      <Card padding="md">
        <h3 className="font-semibold text-primary-900 mb-4">Comparaison 2026 vs 2027</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={SYNTHESE_COMPARATIVE.postes.map((p) => ({
              poste: p.poste,
              '2026': p.budget2026 / 1_000_000,
              '2027': p.budget2027 / 1_000_000,
            }))} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis
                dataKey="poste"
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tickFormatter={(value) => `${value}M`} />
              <Tooltip formatter={(value: number) => `${value.toFixed(0)} M FCFA`} />
              <Legend />
              <Bar dataKey="2026" name="2026 (10 mois)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="2027" name="2027 (12 mois)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

// Vue Par Phase
function VueParPhase({ annee }: { annee: 2026 | 2027 }) {
  const phases = annee === 2026
    ? [
        {
          phase: 'Nov 2026',
          prevu: 95_250_000,
          description: 'Premier mois d\'exploitation',
          periode: 'Novembre 2026',
          responsable: 'Center Manager',
        },
        {
          phase: 'Déc 2026',
          prevu: 95_250_000,
          description: 'Deuxième mois d\'exploitation',
          periode: 'Décembre 2026',
          responsable: 'Center Manager',
        },
      ]
    : [
        {
          phase: 'T1 2027',
          prevu: 190_000_000,
          description: 'Premier trimestre - Montée en charge',
          periode: 'Janvier - Mars 2027',
          responsable: 'Center Manager',
        },
        {
          phase: 'T2 2027',
          prevu: 190_000_000,
          description: 'Deuxième trimestre - Stabilisation',
          periode: 'Avril - Juin 2027',
          responsable: 'Center Manager',
        },
        {
          phase: 'T3 2027',
          prevu: 190_000_000,
          description: 'Troisième trimestre - Croisière',
          periode: 'Juillet - Septembre 2027',
          responsable: 'Center Manager',
        },
        {
          phase: 'T4 2027',
          prevu: 191_000_000,
          description: 'Quatrième trimestre - Bilan annuel',
          periode: 'Octobre - Décembre 2027',
          responsable: 'Center Manager',
        },
      ];

  const total = phases.reduce((sum, p) => sum + p.prevu, 0);

  return (
    <div className="space-y-6">
      {/* Graphique par phase */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-primary-900 mb-4">
          Budget par {annee === 2026 ? 'mois' : 'trimestre'} ({annee})
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={phases} layout="vertical" margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis
                type="number"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value / 1_000_000}M`}
              />
              <YAxis type="category" dataKey="phase" tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => `${formatMontant(value)} FCFA`} />
              <Legend />
              <Bar dataKey="prevu" name="Prévu" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Cards par phase */}
      <div className={cn('grid gap-6', annee === 2026 ? 'grid-cols-2' : 'grid-cols-2')}>
        {phases.map((phase) => (
          <Card key={phase.phase} padding="md" className="border-primary-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-primary-900">{phase.phase}</h4>
              <Badge className="bg-primary-100 text-primary-700">{phase.periode}</Badge>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-primary-500 mb-1">Budget prévu</p>
                <p className="text-xl font-bold text-primary-900">{formatMontant(phase.prevu)}</p>
              </div>
              <p className="text-sm text-primary-600">{phase.description}</p>
              <div className="pt-2 border-t border-primary-100">
                <p className="text-xs text-primary-400">Responsable: {phase.responsable}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Récapitulatif */}
      <Card padding="md" className="bg-primary-50 border-primary-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-primary-800">Total {annee}</h4>
            <p className="text-sm text-primary-600">
              Budget exploitation ({annee === 2026 ? '2 mois' : '12 mois'})
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-primary-900">{formatMontant(total)}</p>
            <p className="text-sm text-primary-600">FCFA</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Vue Synthèse (avec édition, ajout et suppression)
function VueSyntheseEditable({
  lignes,
  totaux,
  annee,
  onEdit,
  onAdd,
  onDelete,
}: {
  lignes: LigneBudgetExploitation[];
  totaux: { prevu: number; engage: number; consomme: number; reste: number };
  annee: 2026 | 2027;
  onEdit: (ligne: LigneBudgetExploitation) => void;
  onAdd: () => void;
  onDelete: (id: number) => void;
}) {
  const budget = annee === 2026 ? BUDGET_EXPLOITATION_2026 : BUDGET_EXPLOITATION_2027;

  // Si pas de données du hook, afficher la vue statique
  if (lignes.length === 0) {
    return <VueSynthese budget={budget} />;
  }

  const tauxEngagement = totaux.prevu > 0 ? (totaux.engage / totaux.prevu) * 100 : 0;
  const tauxConsommation = totaux.prevu > 0 ? (totaux.consomme / totaux.prevu) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Bouton Ajouter */}
      <div className="flex justify-end">
        <Button variant="primary" onClick={onAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une ligne
        </Button>
      </div>

      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-primary-900">Synthèse Budget Exploitation {annee}</h3>
            <p className="text-sm text-primary-500">Récapitulatif éditable - Cliquez sur une ligne pour modifier</p>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">#</TableHead>
              <TableHead>Poste</TableHead>
              <TableHead className="text-right">Prévu</TableHead>
              <TableHead className="text-right">Engagé</TableHead>
              <TableHead className="text-right">Consommé</TableHead>
              <TableHead className="text-right">Part</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lignes.map((ligne, idx) => {
              const part = totaux.prevu > 0 ? ((ligne.montantPrevu / totaux.prevu) * 100).toFixed(1) : '0';
              return (
                <TableRow
                  key={ligne.id}
                  className="hover:bg-primary-50"
                >
                  <TableCell className="text-primary-400">{idx + 1}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{ligne.poste}</p>
                      {ligne.description && (
                        <p className="text-xs text-primary-400">{ligne.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatMontant(ligne.montantPrevu)}</TableCell>
                  <TableCell className="text-right font-mono text-blue-600">{formatMontant(ligne.montantEngage)}</TableCell>
                  <TableCell className="text-right font-mono text-green-600">{formatMontant(ligne.montantConsomme)}</TableCell>
                  <TableCell className="text-right">{part}%</TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => onEdit(ligne)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-error-600 hover:bg-error-50" onClick={() => ligne.id && onDelete(ligne.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-primary-100">
              <TableCell colSpan={2} className="font-bold">
                TOTAL EXPLOITATION {annee}
              </TableCell>
              <TableCell className="text-right font-bold font-mono">
                {formatMontant(totaux.prevu)}
              </TableCell>
              <TableCell className="text-right font-bold font-mono text-blue-700">
                {formatMontant(totaux.engage)}
              </TableCell>
              <TableCell className="text-right font-bold font-mono text-green-700">
                {formatMontant(totaux.consomme)}
              </TableCell>
              <TableCell className="text-right font-bold">100%</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableFooter>
        </Table>

        <div className="grid grid-cols-2 gap-6 mt-6 pt-6 border-t">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-primary-600">Taux d'engagement</span>
              <span className="font-semibold">{tauxEngagement.toFixed(1)}%</span>
            </div>
            <Progress value={tauxEngagement} variant="default" size="md" />
          </div>
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-primary-600">Taux de consommation</span>
              <span className="font-semibold">{tauxConsommation.toFixed(1)}%</span>
            </div>
            <Progress value={tauxConsommation} variant="success" size="md" />
          </div>
        </div>
      </Card>
    </div>
  );
}

// Modal d'ajout de nouvelle ligne budgétaire
function BudgetAddModalOperationnel({
  open,
  onClose,
  onSave,
  annee,
  nextOrdre,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (ligne: Omit<LigneBudgetExploitation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  annee: 2026 | 2027;
  nextOrdre: number;
}) {
  const [poste, setPoste] = useState('');
  const [description, setDescription] = useState('');
  const [categorie, setCategorie] = useState<CategorieExploitation | ''>('');
  const [prevu, setPrevu] = useState(0);
  const [engage, setEngage] = useState(0);
  const [consomme, setConsomme] = useState(0);
  const [couleur, setCouleur] = useState('#3B82F6');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Catégories disponibles
  const CATEGORIES: { id: CategorieExploitation; label: string }[] = [
    { id: 'masse_salariale', label: 'Masse salariale' },
    { id: 'prestations', label: 'Prestations' },
    { id: 'fluides', label: 'Fluides & Énergies' },
    { id: 'assurances', label: 'Assurances' },
    { id: 'fonctionnement', label: 'Fonctionnement' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'provisions', label: 'Provisions' },
    { id: 'contingence', label: 'Contingence' },
  ];

  // Couleurs par défaut par catégorie
  const DEFAULT_COLORS: Record<string, string> = {
    masse_salariale: '#3B82F6',
    prestations: '#10B981',
    fluides: '#F59E0B',
    assurances: '#8B5CF6',
    fonctionnement: '#6366F1',
    marketing: '#EC4899',
    provisions: '#14B8A6',
    contingence: '#F97316',
  };

  // Mettre à jour la couleur quand la catégorie change
  useEffect(() => {
    if (categorie && DEFAULT_COLORS[categorie]) {
      setCouleur(DEFAULT_COLORS[categorie]);
    }
  }, [categorie]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setPoste('');
      setDescription('');
      setCategorie('');
      setPrevu(0);
      setEngage(0);
      setConsomme(0);
      setCouleur('#3B82F6');
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const handleSave = async () => {
    setError(null);

    // Validation
    if (!poste.trim()) {
      setError('Le nom du poste est obligatoire');
      return;
    }
    if (!categorie) {
      setError('La catégorie est obligatoire');
      return;
    }
    if (engage > prevu) {
      setError('Le montant engagé ne peut pas dépasser le montant prévu');
      return;
    }
    if (consomme > engage) {
      setError('Le montant consommé ne peut pas dépasser le montant engagé');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        budgetType: 'operationnel',
        annee,
        ordre: nextOrdre,
        poste: poste.trim(),
        description: description.trim() || undefined,
        categorie,
        montantPrevu: prevu,
        montantEngage: engage,
        montantConsomme: consomme,
        couleur,
      });
      onClose();
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg m-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Ajouter une ligne budgétaire</h2>
              <p className="text-primary-100 text-sm">Budget Opérationnel {annee}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Erreur */}
          {error && (
            <div className="p-3 bg-error-50 border border-error-200 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-error-500" />
              <p className="text-sm text-error-700">{error}</p>
            </div>
          )}

          {/* Nom du poste */}
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Nom du poste *
            </label>
            <Input
              type="text"
              value={poste}
              onChange={(e) => setPoste(e.target.value)}
              placeholder="Ex: Fournitures bureau"
            />
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Catégorie *
            </label>
            <select
              value={categorie}
              onChange={(e) => setCategorie(e.target.value as CategorieExploitation | '')}
              className="w-full text-sm border border-primary-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Sélectionner une catégorie</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Description
            </label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description détaillée (optionnel)"
            />
          </div>

          {/* Montants */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Prévu
              </label>
              <MoneyInput value={prevu} onChange={setPrevu} className="text-right font-mono" />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Engagé
              </label>
              <MoneyInput value={engage} onChange={setEngage} className="text-right font-mono" />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Consommé
              </label>
              <MoneyInput value={consomme} onChange={setConsomme} className="text-right font-mono" />
            </div>
          </div>

          {/* Couleur */}
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Couleur
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={couleur}
                onChange={(e) => setCouleur(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-primary-200"
              />
              <div
                className="px-3 py-1 rounded text-white text-sm"
                style={{ backgroundColor: couleur }}
              >
                Aperçu
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-primary-50 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={isSaving}>
            <Plus className="h-4 w-4 mr-2" />
            {isSaving ? 'Ajout...' : 'Ajouter'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Composant principal Budget Opérationnel
export function BudgetOperationnel() {
  const [activeTab, setActiveTab] = useState('synthese');
  const [annee, setAnnee] = useState<2026 | 2027>(2027);
  const [editingLigne, setEditingLigne] = useState<LigneBudgetExploitation | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isResettingEngagements, setIsResettingEngagements] = useState(false);

  const budget = annee === 2026 ? BUDGET_EXPLOITATION_2026 : BUDGET_EXPLOITATION_2027;

  // Hook pour les données persistées
  const {
    lignes,
    isLoading,
    error,
    totaux,
    updateLigne,
    addLigne,
    deleteLigne,
    resetToDefaults,
  } = useBudgetExploitation({
    budgetType: 'operationnel',
    annee,
  });

  // State pour le modal d'ajout
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Handler de sauvegarde
  const handleSave = async (id: number, prevu: number, engage: number, consomme: number, note?: string) => {
    await updateLigne(id, {
      montantPrevu: prevu,
      montantEngage: engage,
      montantConsomme: consomme,
      note,
    });
  };

  // Handler d'ajout
  const handleAdd = async (ligne: Omit<LigneBudgetExploitation, 'id' | 'createdAt' | 'updatedAt'>) => {
    await addLigne(ligne);
    setIsAddModalOpen(false);
  };

  // Handler de suppression
  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette ligne budgétaire ?')) {
      return;
    }
    await deleteLigne(id);
  };

  // Handler de reset
  const handleReset = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir réinitialiser tous les montants aux valeurs par défaut ?')) {
      return;
    }
    setIsResetting(true);
    try {
      await resetToDefaults();
    } finally {
      setIsResetting(false);
    }
  };

  // Handler de reset des engagements uniquement
  const handleResetEngagementsOnly = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir remettre tous les engagements et réalisations à 0 ?\n\nLes montants prévus seront conservés.')) {
      return;
    }
    setIsResettingEngagements(true);
    try {
      const count = await resetBudgetEngagements();
      alert(`✅ ${count} ligne(s) budgétaire(s) mise(s) à jour.\n\nEngagé = 0\nRéalisé = 0`);
    } catch (error) {
      console.error('Reset engagements error:', error);
      alert('❌ Erreur lors de la réinitialisation des engagements');
    } finally {
      setIsResettingEngagements(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <span className="ml-2 text-primary-600">Chargement du budget...</span>
      </div>
    );
  }

  // Use hook data if available
  const useHookData = lignes.length > 0;
  const budgetTotal = useHookData ? totaux.prevu : budget.montantTotal;
  const masseSalariale = useHookData
    ? lignes.find((l) => l.categorie === 'masse_salariale')?.montantPrevu || 0
    : budget.postes.find((p) => p.categorie === 'masse_salariale')?.budgetAnnuel || 0;
  const prestations = useHookData
    ? lignes.find((l) => l.categorie === 'prestations')?.montantPrevu || 0
    : budget.postes.find((p) => p.categorie === 'prestations')?.budgetAnnuel || 0;
  const fluides = useHookData
    ? lignes.find((l) => l.categorie === 'fluides')?.montantPrevu || 0
    : budget.postes.find((p) => p.categorie === 'fluides')?.budgetAnnuel || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-primary-900">Budget d'Exploitation</h2>
          <p className="text-sm text-primary-500">
            Centre Commercial Cosmos Angre - New Heaven SA / CRMC - Éditable
          </p>
        </div>
        <div className="flex items-center gap-4">
          <AnneeSelector annee={annee} onChange={setAnnee} />
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetEngagementsOnly}
            disabled={isResettingEngagements}
            className="text-warning-600 border-warning-300 hover:bg-warning-50"
          >
            <RotateCcw className={cn('h-4 w-4 mr-2', isResettingEngagements && 'animate-spin')} />
            {isResettingEngagements ? 'Réinitialisation...' : 'RAZ Engagements'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isResetting}
          >
            <RotateCcw className={cn('h-4 w-4 mr-2', isResetting && 'animate-spin')} />
            {isResetting ? 'Réinitialisation...' : 'Réinitialiser tout'}
          </Button>
          <BudgetImportExport budgetType="operationnel" />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <Card padding="md" className="bg-error-50 border-error-200">
          <p className="text-error-700">{error}</p>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard
          label="Budget total"
          value={formatMontant(budgetTotal)}
          subValue={`FCFA - ${annee}`}
          icon={Wallet}
          color="text-primary-600"
          bgColor="bg-primary-100"
        />
        <KPICard
          label="Masse salariale"
          value={formatMontant(masseSalariale)}
          subValue={budgetTotal > 0 ? `${((masseSalariale / budgetTotal) * 100).toFixed(0)}% du budget` : '0%'}
          icon={Users}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <KPICard
          label="Prestations"
          value={formatMontant(prestations)}
          subValue={budgetTotal > 0 ? `${((prestations / budgetTotal) * 100).toFixed(0)}% du budget` : '0%'}
          icon={Shield}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <KPICard
          label="Fluides"
          value={formatMontant(fluides)}
          subValue={budgetTotal > 0 ? `${((fluides / budgetTotal) * 100).toFixed(0)}% du budget` : '0%'}
          icon={Zap}
          color="text-amber-600"
          bgColor="bg-amber-100"
        />
        <KPICard
          label="Effectif"
          value={annee === 2026 ? `${TOTAL_EFFECTIF_2026} pers.` : `${TOTAL_EFFECTIF_2027} pers.`}
          subValue="Équipe exploitation"
          icon={Users}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="synthese">Synthèse</TabsTrigger>
          <TabsTrigger value="detail">Détail</TabsTrigger>
          <TabsTrigger value="graphiques">Graphiques</TabsTrigger>
          <TabsTrigger value="par-phase">Par phase</TabsTrigger>
        </TabsList>

        <TabsContent value="synthese">
          <VueSyntheseEditable lignes={lignes} totaux={totaux} annee={annee} onEdit={setEditingLigne} onAdd={() => setIsAddModalOpen(true)} onDelete={handleDelete} />
        </TabsContent>

        <TabsContent value="detail">
          <VueDetails annee={annee} />
        </TabsContent>

        <TabsContent value="graphiques">
          <VueGraphiques budget={budget} />
        </TabsContent>

        <TabsContent value="par-phase">
          <VueParPhase annee={annee} />
        </TabsContent>
      </Tabs>

      {/* Modal d'édition */}
      <BudgetEditModal
        ligne={editingLigne}
        open={!!editingLigne}
        onClose={() => setEditingLigne(null)}
        onSave={handleSave}
      />

      {/* Modal d'ajout */}
      <BudgetAddModalOperationnel
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAdd}
        annee={annee}
        nextOrdre={lignes.length + 1}
      />
    </div>
  );
}
