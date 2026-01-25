// ============================================================================
// MATRICE RACI - Composant d'affichage
// ============================================================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  RACI_LEGEND,
  RACI_PREPARATION,
  RACI_MOBILISATION,
  RACI_LANCEMENT,
  RACI_GOUVERNANCE,
  type RACIEntry,
  type RACIRole,
} from '@/data/cosmosAngreRef4';

// Couleurs RACI
const RACI_COLORS: Record<RACIRole, string> = {
  R: 'bg-blue-500 text-white',
  A: 'bg-red-500 text-white',
  C: 'bg-amber-500 text-white',
  I: 'bg-gray-400 text-white',
  '': 'bg-transparent',
};

const RACI_BG_LIGHT: Record<RACIRole, string> = {
  R: 'bg-blue-100',
  A: 'bg-red-100',
  C: 'bg-amber-100',
  I: 'bg-gray-100',
  '': '',
};

// Colonnes de rôles
const ROLES = [
  { key: 'PDG', label: 'PDG' },
  { key: 'DGA', label: 'DGA' },
  { key: 'CenterMgr', label: 'Center Mgr' },
  { key: 'CommercialMgr', label: 'Commercial' },
  { key: 'FM', label: 'FM' },
  { key: 'SecurityMgr', label: 'Security' },
  { key: 'MarketingMgr', label: 'Marketing' },
  { key: 'Finance', label: 'Finance' },
] as const;

// Cellule RACI avec tooltip
function RACICell({ role, livrable }: { role: RACIRole; livrable: string }) {
  if (!role) return <TableCell className="text-center">-</TableCell>;

  const legend = RACI_LEGEND[role as keyof typeof RACI_LEGEND];

  return (
    <TableCell className={cn('text-center', RACI_BG_LIGHT[role])}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <span
              className={cn(
                'inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm',
                RACI_COLORS[role]
              )}
            >
              {role}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">{legend.label}</p>
            <p className="text-xs text-muted-foreground">{legend.description}</p>
            <p className="text-xs mt-1">pour "{livrable}"</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </TableCell>
  );
}

// Tableau RACI
function RACITable({ entries, title }: { entries: RACIEntry[]; title: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>
          {entries.length} livrables
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Livrable</TableHead>
              {ROLES.map((role) => (
                <TableHead key={role.key} className="text-center w-20">
                  {role.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{entry.livrable}</TableCell>
                {ROLES.map((role) => (
                  <RACICell
                    key={role.key}
                    role={entry[role.key as keyof RACIEntry] as RACIRole}
                    livrable={entry.livrable}
                  />
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Légende RACI
function RACILegend() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Légende RACI</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(Object.entries(RACI_LEGEND) as [keyof typeof RACI_LEGEND, typeof RACI_LEGEND[keyof typeof RACI_LEGEND]][]).map(
            ([key, value]) => (
              <div key={key} className="flex items-center gap-3">
                <span
                  className={cn(
                    'inline-flex items-center justify-center w-10 h-10 rounded-full font-bold',
                    RACI_COLORS[key]
                  )}
                >
                  {key}
                </span>
                <div>
                  <p className="font-semibold text-sm">{value.label}</p>
                  <p className="text-xs text-muted-foreground">{value.description}</p>
                </div>
              </div>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Statistiques RACI
function RACIStats({ entries }: { entries: RACIEntry[] }) {
  const stats = ROLES.map((role) => {
    const counts = { R: 0, A: 0, C: 0, I: 0 };
    entries.forEach((entry) => {
      const value = entry[role.key as keyof RACIEntry] as RACIRole;
      if (value && value in counts) {
        counts[value as keyof typeof counts]++;
      }
    });
    return { ...role, ...counts };
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Répartition des responsabilités</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rôle</TableHead>
              <TableHead className="text-center">
                <span className={cn('px-2 py-1 rounded', RACI_COLORS.R)}>R</span>
              </TableHead>
              <TableHead className="text-center">
                <span className={cn('px-2 py-1 rounded', RACI_COLORS.A)}>A</span>
              </TableHead>
              <TableHead className="text-center">
                <span className={cn('px-2 py-1 rounded', RACI_COLORS.C)}>C</span>
              </TableHead>
              <TableHead className="text-center">
                <span className={cn('px-2 py-1 rounded', RACI_COLORS.I)}>I</span>
              </TableHead>
              <TableHead className="text-center">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map((stat) => (
              <TableRow key={stat.key}>
                <TableCell className="font-medium">{stat.label}</TableCell>
                <TableCell className="text-center">{stat.R || '-'}</TableCell>
                <TableCell className="text-center">{stat.A || '-'}</TableCell>
                <TableCell className="text-center">{stat.C || '-'}</TableCell>
                <TableCell className="text-center">{stat.I || '-'}</TableCell>
                <TableCell className="text-center font-semibold">
                  {stat.R + stat.A + stat.C + stat.I}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Composant principal
export function RACIMatrix() {
  const [activeTab, setActiveTab] = useState('preparation');

  const allEntries = [
    ...RACI_PREPARATION,
    ...RACI_MOBILISATION,
    ...RACI_LANCEMENT,
    ...RACI_GOUVERNANCE,
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Matrice RACI</h2>
          <p className="text-muted-foreground">
            Responsabilités par livrable et par phase du projet
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{allEntries.length} livrables</Badge>
          <Badge variant="outline">{ROLES.length} rôles</Badge>
        </div>
      </div>

      {/* Légende */}
      <RACILegend />

      {/* Onglets par phase */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="preparation">Préparation</TabsTrigger>
          <TabsTrigger value="mobilisation">Mobilisation</TabsTrigger>
          <TabsTrigger value="lancement">Lancement</TabsTrigger>
          <TabsTrigger value="gouvernance">Gouvernance</TabsTrigger>
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
        </TabsList>

        <TabsContent value="preparation">
          <RACITable
            entries={RACI_PREPARATION}
            title="Phase Préparation — Livrables Majeurs"
          />
        </TabsContent>

        <TabsContent value="mobilisation">
          <RACITable
            entries={RACI_MOBILISATION}
            title="Phase Mobilisation — Livrables Majeurs"
          />
        </TabsContent>

        <TabsContent value="lancement">
          <RACITable
            entries={RACI_LANCEMENT}
            title="Phase Lancement — Livrables Majeurs"
          />
        </TabsContent>

        <TabsContent value="gouvernance">
          <RACITable
            entries={RACI_GOUVERNANCE}
            title="Gouvernance & Reporting"
          />
        </TabsContent>

        <TabsContent value="stats">
          <RACIStats entries={allEntries} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default RACIMatrix;
