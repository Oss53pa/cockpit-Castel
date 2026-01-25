import { useState } from 'react';
import {
  Wallet,
  CheckCircle,
  TrendingDown,
  PiggyBank,
  AlertTriangle,
  ArrowDownLeft,
  Building2,
  Clock,
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
} from '@/components/ui';
import { formatNumber } from '@/lib/utils';

// Données du Budget Opérationnel
const BUDGET_OPERATIONNEL_TOTAL = 720_500_000;
const BUDGET_ENGAGE = 0;
const BUDGET_CONSOMME = 0;
const PROVISIONS = 65_500_000;

// Postes budgétaires opérationnels (à consommer après ouverture)
interface PosteOperationnel {
  id: string;
  poste: string;
  budgetAnnuel: number;
  budgetMensuel: number;
  categorie: 'personnel' | 'exploitation' | 'marketing' | 'maintenance' | 'autres';
}

const POSTES_OPERATIONNELS: PosteOperationnel[] = [
  { id: 'salaires', poste: 'Masse salariale', budgetAnnuel: 280_000_000, budgetMensuel: 23_333_333, categorie: 'personnel' },
  { id: 'charges_sociales', poste: 'Charges sociales', budgetAnnuel: 84_000_000, budgetMensuel: 7_000_000, categorie: 'personnel' },
  { id: 'energie', poste: 'Énergie & Fluides', budgetAnnuel: 72_000_000, budgetMensuel: 6_000_000, categorie: 'exploitation' },
  { id: 'maintenance', poste: 'Maintenance & Entretien', budgetAnnuel: 48_000_000, budgetMensuel: 4_000_000, categorie: 'maintenance' },
  { id: 'securite', poste: 'Sécurité & Gardiennage', budgetAnnuel: 36_000_000, budgetMensuel: 3_000_000, categorie: 'exploitation' },
  { id: 'marketing_ops', poste: 'Marketing opérationnel', budgetAnnuel: 60_000_000, budgetMensuel: 5_000_000, categorie: 'marketing' },
  { id: 'assurances', poste: 'Assurances', budgetAnnuel: 24_000_000, budgetMensuel: 2_000_000, categorie: 'autres' },
  { id: 'fournitures', poste: 'Fournitures & Consommables', budgetAnnuel: 18_000_000, budgetMensuel: 1_500_000, categorie: 'exploitation' },
  { id: 'telecom', poste: 'Télécommunications', budgetAnnuel: 12_000_000, budgetMensuel: 1_000_000, categorie: 'exploitation' },
  { id: 'divers', poste: 'Frais divers', budgetAnnuel: 21_000_000, budgetMensuel: 1_750_000, categorie: 'autres' },
  { id: 'provisions_ops', poste: 'Provisions', budgetAnnuel: 65_500_000, budgetMensuel: 5_458_333, categorie: 'autres' },
];

// Prévisions mensuelles (12 mois)
const PREVISIONS_MENSUELLES = [
  { mois: 'Jan', prevu: 54_541_666, realise: 0 },
  { mois: 'Fév', prevu: 54_541_666, realise: 0 },
  { mois: 'Mar', prevu: 54_541_666, realise: 0 },
  { mois: 'Avr', prevu: 54_541_666, realise: 0 },
  { mois: 'Mai', prevu: 54_541_666, realise: 0 },
  { mois: 'Juin', prevu: 54_541_666, realise: 0 },
  { mois: 'Juil', prevu: 65_000_000, realise: 0 },
  { mois: 'Août', prevu: 65_000_000, realise: 0 },
  { mois: 'Sep', prevu: 60_000_000, realise: 0 },
  { mois: 'Oct', prevu: 60_000_000, realise: 0 },
  { mois: 'Nov', prevu: 72_000_000, realise: 0 },
  { mois: 'Déc', prevu: 72_000_000, realise: 0 },
];

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

// Couleurs par catégorie
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  personnel: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  exploitation: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  marketing: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  maintenance: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  autres: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
};

const CATEGORY_LABELS: Record<string, string> = {
  personnel: 'Personnel',
  exploitation: 'Exploitation',
  marketing: 'Marketing',
  maintenance: 'Maintenance',
  autres: 'Autres',
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

// Vue Synthèse
function VueSynthese() {
  const totalAnnuel = POSTES_OPERATIONNELS.reduce((sum, p) => sum + p.budgetAnnuel, 0);
  const parCategorie = POSTES_OPERATIONNELS.reduce((acc, poste) => {
    if (!acc[poste.categorie]) {
      acc[poste.categorie] = 0;
    }
    acc[poste.categorie] += poste.budgetAnnuel;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <Card padding="md">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-amber-100">
            <Clock className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-primary-900">
              Budget non encore activé
            </h3>
            <p className="text-sm text-primary-500">
              Ce budget sera activé à l'ouverture du centre commercial
            </p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-6">
          {Object.entries(parCategorie).map(([cat, montant]) => (
            <div
              key={cat}
              className={cn(
                'p-4 rounded-lg border',
                CATEGORY_COLORS[cat].bg,
                CATEGORY_COLORS[cat].border
              )}
            >
              <p className={cn('text-xs mb-1', CATEGORY_COLORS[cat].text)}>
                {CATEGORY_LABELS[cat]}
              </p>
              <p className="text-lg font-bold text-primary-900">{formatMontant(montant)}</p>
              <p className="text-xs text-primary-500">
                {((montant / totalAnnuel) * 100).toFixed(1)}%
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card padding="md">
        <h3 className="text-lg font-semibold text-primary-900 mb-4">
          Postes budgétaires opérationnels
        </h3>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Poste</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead className="text-right">Budget Annuel</TableHead>
              <TableHead className="text-right">Budget Mensuel</TableHead>
              <TableHead className="text-right">Part du budget</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {POSTES_OPERATIONNELS.map((poste) => (
              <TableRow key={poste.id}>
                <TableCell className="font-medium">{poste.poste}</TableCell>
                <TableCell>
                  <Badge
                    className={cn(
                      CATEGORY_COLORS[poste.categorie].bg,
                      CATEGORY_COLORS[poste.categorie].text
                    )}
                  >
                    {CATEGORY_LABELS[poste.categorie]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{formatMontant(poste.budgetAnnuel)}</TableCell>
                <TableCell className="text-right">{formatMontant(poste.budgetMensuel)}</TableCell>
                <TableCell className="text-right">
                  {((poste.budgetAnnuel / BUDGET_OPERATIONNEL_TOTAL) * 100).toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-primary-100">
              <TableCell className="font-bold">TOTAL</TableCell>
              <TableCell></TableCell>
              <TableCell className="text-right font-bold">
                {formatMontant(BUDGET_OPERATIONNEL_TOTAL)}
              </TableCell>
              <TableCell className="text-right font-bold">
                {formatMontant(BUDGET_OPERATIONNEL_TOTAL / 12)}
              </TableCell>
              <TableCell className="text-right font-bold">100%</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Card>
    </div>
  );
}

// Vue Prévisions
function VuePrevisions() {
  const cumulData = PREVISIONS_MENSUELLES.reduce((acc, item, index) => {
    const previousCumul = index > 0 ? acc[index - 1].cumul : 0;
    acc.push({
      ...item,
      cumul: previousCumul + item.prevu,
    });
    return acc;
  }, [] as Array<{ mois: string; prevu: number; realise: number; cumul: number }>);

  return (
    <div className="space-y-6">
      <Card padding="md">
        <h3 className="text-lg font-semibold text-primary-900 mb-4">
          Prévisions de dépenses mensuelles
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={PREVISIONS_MENSUELLES} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis
                dataKey="mois"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e4e4e7' }}
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
              <Bar dataKey="prevu" name="Prévu" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="realise" name="Réalisé" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card padding="md">
        <h3 className="text-lg font-semibold text-primary-900 mb-4">
          Budget cumulé prévisionnel
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cumulData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis
                dataKey="mois"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e4e4e7' }}
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
              <Area
                type="monotone"
                dataKey="cumul"
                name="Cumul prévu"
                stroke="#3b82f6"
                fill="#93c5fd"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

// Vue par Catégorie
function VueParCategorie() {
  const categoriesData = Object.entries(
    POSTES_OPERATIONNELS.reduce((acc, poste) => {
      if (!acc[poste.categorie]) {
        acc[poste.categorie] = { postes: [], total: 0 };
      }
      acc[poste.categorie].postes.push(poste);
      acc[poste.categorie].total += poste.budgetAnnuel;
      return acc;
    }, {} as Record<string, { postes: PosteOperationnel[]; total: number }>)
  );

  return (
    <div className="space-y-6">
      {categoriesData.map(([categorie, data]) => (
        <Card key={categorie} padding="md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', CATEGORY_COLORS[categorie].bg)}>
                <Building2 className={cn('h-5 w-5', CATEGORY_COLORS[categorie].text)} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary-900">
                  {CATEGORY_LABELS[categorie]}
                </h3>
                <p className="text-sm text-primary-500">
                  {data.postes.length} poste{data.postes.length > 1 ? 's' : ''} budgétaire{data.postes.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary-900">{formatMontant(data.total)}</p>
              <p className="text-sm text-primary-500">
                {((data.total / BUDGET_OPERATIONNEL_TOTAL) * 100).toFixed(1)}% du budget
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {data.postes.map((poste) => (
              <div
                key={poste.id}
                className="flex items-center justify-between p-3 bg-primary-50 rounded-lg"
              >
                <span className="font-medium text-primary-900">{poste.poste}</span>
                <div className="text-right">
                  <p className="font-semibold text-primary-900">{formatMontant(poste.budgetAnnuel)}</p>
                  <p className="text-xs text-primary-500">{formatMontant(poste.budgetMensuel)}/mois</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

// Composant principal Budget Opérationnel
export function BudgetOperationnel() {
  const [activeTab, setActiveTab] = useState('synthese');

  const tauxProvisions = (PROVISIONS / BUDGET_OPERATIONNEL_TOTAL) * 100;
  const restant = BUDGET_OPERATIONNEL_TOTAL - BUDGET_CONSOMME;
  const ecart = BUDGET_ENGAGE - BUDGET_CONSOMME;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-primary-900">Budget Opérationnel</h2>
        <p className="text-sm text-primary-500">
          Budget de fonctionnement annuel post-ouverture
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          label="Budget total"
          value={formatMontant(BUDGET_OPERATIONNEL_TOTAL)}
          subValue="FCFA"
          icon={Wallet}
          color="text-primary-600"
          bgColor="bg-primary-100"
        />
        <KPICard
          label="Engagé"
          value={formatMontant(BUDGET_ENGAGE)}
          subValue="0.0%"
          icon={ArrowDownLeft}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <KPICard
          label="Consommé"
          value={formatMontant(BUDGET_CONSOMME)}
          subValue="0.0%"
          icon={CheckCircle}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <KPICard
          label="Restant"
          value={formatMontant(restant)}
          subValue=""
          icon={TrendingDown}
          color="text-orange-600"
          bgColor="bg-orange-100"
        />
        <KPICard
          label="Provisions"
          value={formatMontant(PROVISIONS)}
          subValue={`${tauxProvisions.toFixed(1)}%`}
          icon={PiggyBank}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
        <KPICard
          label="Écart"
          value={ecart === 0 ? '-0' : ecart >= 0 ? `+${formatMontant(ecart)}` : `-${formatMontant(Math.abs(ecart))}`}
          subValue="Engagé - Consommé"
          icon={AlertTriangle}
          color={ecart >= 0 ? 'text-success-600' : 'text-error-600'}
          bgColor={ecart >= 0 ? 'bg-success-100' : 'bg-error-100'}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="synthese">Synthèse</TabsTrigger>
          <TabsTrigger value="previsions">Prévisions</TabsTrigger>
          <TabsTrigger value="par-categorie">Par catégorie</TabsTrigger>
        </TabsList>

        <TabsContent value="synthese">
          <VueSynthese />
        </TabsContent>

        <TabsContent value="previsions">
          <VuePrevisions />
        </TabsContent>

        <TabsContent value="par-categorie">
          <VueParCategorie />
        </TabsContent>
      </Tabs>
    </div>
  );
}
