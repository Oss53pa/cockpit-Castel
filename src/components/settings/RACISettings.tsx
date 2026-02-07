import { useState } from 'react';
import { Card, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { cn } from '@/lib/utils';
import { PROJET_CONFIG } from '@/data/constants';

// Types
type RACIRole = 'R' | 'A' | 'C' | 'I' | '-';

interface RACIEntry {
  livrable: string;
  roles: Record<string, RACIRole>;
}

interface _RACISection {
  title: string;
  entries: RACIEntry[];
}

// Roles/Stakeholders
const STAKEHOLDERS = [
  { key: 'PDG', label: 'PDG' },
  { key: 'DGA', label: 'DGA' },
  { key: 'CenterMgr', label: 'Center Mgr' },
  { key: 'CommercialMgr', label: 'Commercial Mgr' },
  { key: 'FM', label: 'FM' },
  { key: 'SecurityMgr', label: 'Security Mgr' },
  { key: 'MarketingMgr', label: 'Marketing Mgr' },
  { key: 'Finance', label: 'Finance' },
];

// RACI Legend
const RACI_LEGEND: { letter: RACIRole; name: string; description: string; color: string }[] = [
  { letter: 'R', name: 'Responsible', description: 'Réalise le travail', color: 'bg-info-500' },
  { letter: 'A', name: 'Accountable', description: 'Responsable final (1 seul par ligne)', color: 'bg-error-500' },
  { letter: 'C', name: 'Consulted', description: 'Donne un avis avant décision', color: 'bg-warning-500' },
  { letter: 'I', name: 'Informed', description: 'Informé après décision', color: 'bg-primary-400' },
];

// RACI Data - Phase Préparation
const RACI_PREPARATION: RACIEntry[] = [
  { livrable: 'Budget projet consolidé', roles: { PDG: 'A', DGA: 'R', CenterMgr: 'C', CommercialMgr: 'C', FM: 'C', SecurityMgr: 'C', MarketingMgr: 'C', Finance: 'R' } },
  { livrable: 'Plan commercialisation', roles: { PDG: 'I', DGA: 'A', CenterMgr: 'C', CommercialMgr: 'R', FM: 'I', SecurityMgr: 'I', MarketingMgr: 'C', Finance: 'C' } },
  { livrable: 'Organigramme cible', roles: { PDG: 'A', DGA: 'R', CenterMgr: 'C', CommercialMgr: 'I', FM: 'I', SecurityMgr: 'I', MarketingMgr: 'I', Finance: 'I' } },
  { livrable: 'Stratégie communication', roles: { PDG: 'I', DGA: 'A', CenterMgr: 'C', CommercialMgr: 'C', FM: 'I', SecurityMgr: 'I', MarketingMgr: 'R', Finance: 'I' } },
  { livrable: 'Audit technique', roles: { PDG: 'I', DGA: 'A', CenterMgr: 'I', CommercialMgr: 'I', FM: 'R', SecurityMgr: 'C', MarketingMgr: 'I', Finance: 'I' } },
  { livrable: 'Grille tarifaire', roles: { PDG: 'A', DGA: 'R', CenterMgr: 'I', CommercialMgr: 'R', FM: 'I', SecurityMgr: 'I', MarketingMgr: 'I', Finance: 'C' } },
  { livrable: 'Étude de marché', roles: { PDG: 'I', DGA: 'A', CenterMgr: 'I', CommercialMgr: 'R', FM: 'I', SecurityMgr: 'I', MarketingMgr: 'C', Finance: 'I' } },
];

// RACI Data - Phase Mobilisation
const RACI_MOBILISATION: RACIEntry[] = [
  { livrable: 'Recrutement managers', roles: { PDG: 'A', DGA: 'R', CenterMgr: 'I', CommercialMgr: 'I', FM: 'I', SecurityMgr: 'I', MarketingMgr: 'I', Finance: 'I' } },
  { livrable: 'Recrutement équipes', roles: { PDG: 'I', DGA: 'A', CenterMgr: 'R', CommercialMgr: 'I', FM: 'I', SecurityMgr: 'I', MarketingMgr: 'I', Finance: 'I' } },
  { livrable: 'Signatures BEFA 70%', roles: { PDG: 'I', DGA: 'A', CenterMgr: 'I', CommercialMgr: 'R', FM: 'I', SecurityMgr: 'I', MarketingMgr: 'I', Finance: 'C' } },
  { livrable: 'Signature Carrefour', roles: { PDG: 'A', DGA: 'R', CenterMgr: 'I', CommercialMgr: 'R', FM: 'I', SecurityMgr: 'I', MarketingMgr: 'I', Finance: 'C' } },
  { livrable: 'Handover technique', roles: { PDG: 'I', DGA: 'A', CenterMgr: 'R', CommercialMgr: 'I', FM: 'R', SecurityMgr: 'C', MarketingMgr: 'I', Finance: 'I' } },
  { livrable: 'Réception OPR', roles: { PDG: 'I', DGA: 'A', CenterMgr: 'I', CommercialMgr: 'I', FM: 'R', SecurityMgr: 'C', MarketingMgr: 'I', Finance: 'I' } },
  { livrable: 'Levée réserves', roles: { PDG: 'I', DGA: 'A', CenterMgr: 'I', CommercialMgr: 'I', FM: 'R', SecurityMgr: 'I', MarketingMgr: 'I', Finance: 'I' } },
  { livrable: 'Contrats exploitation', roles: { PDG: 'I', DGA: 'A', CenterMgr: 'R', CommercialMgr: 'I', FM: 'R', SecurityMgr: 'R', MarketingMgr: 'I', Finance: 'C' } },
  { livrable: 'Procédures exploitation', roles: { PDG: 'I', DGA: 'A', CenterMgr: 'R', CommercialMgr: 'I', FM: 'R', SecurityMgr: 'R', MarketingMgr: 'I', Finance: 'I' } },
  { livrable: 'Systèmes (ERP, GMAO)', roles: { PDG: 'I', DGA: 'A', CenterMgr: 'R', CommercialMgr: 'I', FM: 'R', SecurityMgr: 'I', MarketingMgr: 'I', Finance: 'R' } },
  { livrable: 'Campagne teasing', roles: { PDG: 'I', DGA: 'A', CenterMgr: 'C', CommercialMgr: 'C', FM: 'I', SecurityMgr: 'I', MarketingMgr: 'R', Finance: 'C' } },
  { livrable: 'Site web', roles: { PDG: 'I', DGA: 'A', CenterMgr: 'I', CommercialMgr: 'C', FM: 'I', SecurityMgr: 'I', MarketingMgr: 'R', Finance: 'I' } },
];

// RACI Data - Phase Lancement
const RACI_LANCEMENT: RACIEntry[] = [
  { livrable: 'Commission sécurité', roles: { PDG: 'C', DGA: 'A', CenterMgr: 'R', CommercialMgr: 'I', FM: 'R', SecurityMgr: 'R', MarketingMgr: 'I', Finance: 'I' } },
  { livrable: 'Soft Opening', roles: { PDG: 'A', DGA: 'R', CenterMgr: 'R', CommercialMgr: 'R', FM: 'R', SecurityMgr: 'R', MarketingMgr: 'R', Finance: 'I' } },
  { livrable: 'Inauguration', roles: { PDG: 'A', DGA: 'R', CenterMgr: 'R', CommercialMgr: 'C', FM: 'R', SecurityMgr: 'R', MarketingMgr: 'R', Finance: 'C' } },
  { livrable: 'Campagne lancement', roles: { PDG: 'I', DGA: 'A', CenterMgr: 'C', CommercialMgr: 'C', FM: 'I', SecurityMgr: 'I', MarketingMgr: 'R', Finance: 'C' } },
  { livrable: 'Formation équipes', roles: { PDG: 'I', DGA: 'A', CenterMgr: 'R', CommercialMgr: 'I', FM: 'R', SecurityMgr: 'R', MarketingMgr: 'I', Finance: 'I' } },
  { livrable: 'Test grandeur nature', roles: { PDG: 'I', DGA: 'A', CenterMgr: 'R', CommercialMgr: 'I', FM: 'R', SecurityMgr: 'R', MarketingMgr: 'I', Finance: 'I' } },
];

// RACI Data - Gouvernance & Reporting
const RACI_GOUVERNANCE: RACIEntry[] = [
  { livrable: 'Flash hebdo', roles: { PDG: 'I', DGA: 'A', CenterMgr: 'R', CommercialMgr: 'C', FM: 'C', SecurityMgr: 'C', MarketingMgr: 'C', Finance: 'C' } },
  { livrable: 'Rapport mensuel investisseurs', roles: { PDG: 'A', DGA: 'R', CenterMgr: 'C', CommercialMgr: 'C', FM: 'C', SecurityMgr: 'C', MarketingMgr: 'C', Finance: 'R' } },
  { livrable: 'EXCO mensuel', roles: { PDG: 'I', DGA: 'A', CenterMgr: 'R', CommercialMgr: 'R', FM: 'R', SecurityMgr: 'R', MarketingMgr: 'R', Finance: 'R' } },
  { livrable: 'COPIL projet', roles: { PDG: 'A', DGA: 'R', CenterMgr: 'C', CommercialMgr: 'I', FM: 'I', SecurityMgr: 'I', MarketingMgr: 'I', Finance: 'C' } },
  { livrable: 'Arbitrages budget', roles: { PDG: 'A', DGA: 'R', CenterMgr: 'C', CommercialMgr: 'C', FM: 'C', SecurityMgr: 'C', MarketingMgr: 'C', Finance: 'R' } },
];

// Component for RACI cell
function RACICell({ value }: { value: RACIRole }) {
  const styles: Record<RACIRole, string> = {
    'R': 'bg-info-100 text-info-700 font-bold',
    'A': 'bg-error-100 text-error-700 font-bold',
    'C': 'bg-warning-100 text-warning-700 font-medium',
    'I': 'bg-primary-100 text-primary-600',
    '-': 'bg-gray-50 text-gray-300',
  };

  return (
    <td className={cn('px-2 py-2 text-center text-sm border-r border-primary-100', styles[value] || styles['-'])}>
      {value !== '-' ? value : ''}
    </td>
  );
}

// Component for RACI table
function RACITable({ title, entries }: { title: string; entries: RACIEntry[] }) {
  return (
    <div className="overflow-x-auto">
      <h4 className="text-md font-semibold text-primary-800 mb-3 px-1">{title}</h4>
      <table className="w-full border-collapse border border-primary-200 text-sm">
        <thead>
          <tr className="bg-primary-800 text-white">
            <th className="px-3 py-2 text-left font-medium border-r border-primary-700 min-w-[200px]">Livrable</th>
            {STAKEHOLDERS.map(s => (
              <th key={s.key} className="px-2 py-2 text-center font-medium border-r border-primary-700 min-w-[80px]">
                <div className="text-xs leading-tight">{s.label}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, idx) => (
            <tr key={idx} className={cn('border-b border-primary-100', idx % 2 === 0 ? 'bg-white' : 'bg-primary-50/50')}>
              <td className="px-3 py-2 font-medium text-primary-900 border-r border-primary-100">
                {entry.livrable}
              </td>
              {STAKEHOLDERS.map(s => (
                <RACICell key={s.key} value={entry.roles[s.key] || '-'} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RACISettings() {
  const [activePhase, setActivePhase] = useState('preparation');

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card padding="md">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-primary-900">Matrice RACI</h3>
            <p className="text-sm text-primary-500 mt-1">
              {`Définition des responsabilités pour chaque livrable du projet ${PROJET_CONFIG.nom}`}
            </p>
          </div>
          <Badge variant="info">Référentiel projet</Badge>
        </div>

        {/* Legend */}
        <div className="bg-primary-50 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-semibold text-primary-800 mb-3">Légende RACI</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {RACI_LEGEND.map(item => (
              <div key={item.letter} className="flex items-start gap-3">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-lg', item.color)}>
                  {item.letter}
                </div>
                <div>
                  <p className="font-semibold text-primary-900 text-sm">{item.name}</p>
                  <p className="text-xs text-primary-500">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stakeholders */}
        <div className="bg-white border border-primary-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-primary-800 mb-3">Parties prenantes</h4>
          <div className="flex flex-wrap gap-2">
            {STAKEHOLDERS.map(s => (
              <Badge key={s.key} variant="secondary" className="text-xs">
                {s.label}
              </Badge>
            ))}
          </div>
        </div>
      </Card>

      {/* RACI Tables */}
      <Card padding="md">
        <Tabs value={activePhase} onValueChange={setActivePhase}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="preparation">
              Phase Préparation
            </TabsTrigger>
            <TabsTrigger value="mobilisation">
              Phase Mobilisation
            </TabsTrigger>
            <TabsTrigger value="lancement">
              Phase Lancement
            </TabsTrigger>
            <TabsTrigger value="gouvernance">
              Gouvernance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preparation">
            <RACITable
              title="Livrables Majeurs - Phase Préparation"
              entries={RACI_PREPARATION}
            />
          </TabsContent>

          <TabsContent value="mobilisation">
            <RACITable
              title="Livrables Majeurs - Phase Mobilisation"
              entries={RACI_MOBILISATION}
            />
          </TabsContent>

          <TabsContent value="lancement">
            <RACITable
              title="Livrables Majeurs - Phase Lancement"
              entries={RACI_LANCEMENT}
            />
          </TabsContent>

          <TabsContent value="gouvernance">
            <RACITable
              title="Gouvernance & Reporting"
              entries={RACI_GOUVERNANCE}
            />
          </TabsContent>
        </Tabs>
      </Card>

      {/* Summary Stats */}
      <Card padding="md">
        <h4 className="text-md font-semibold text-primary-900 mb-4">Statistiques de la matrice</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-primary-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary-900">
              {RACI_PREPARATION.length + RACI_MOBILISATION.length + RACI_LANCEMENT.length + RACI_GOUVERNANCE.length}
            </div>
            <div className="text-sm text-primary-600">Livrables définis</div>
          </div>
          <div className="bg-info-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-info-700">{STAKEHOLDERS.length}</div>
            <div className="text-sm text-info-600">Parties prenantes</div>
          </div>
          <div className="bg-success-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-success-700">4</div>
            <div className="text-sm text-success-600">Phases projet</div>
          </div>
          <div className="bg-warning-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-warning-700">
              {(RACI_PREPARATION.length + RACI_MOBILISATION.length + RACI_LANCEMENT.length + RACI_GOUVERNANCE.length) * STAKEHOLDERS.length}
            </div>
            <div className="text-sm text-warning-600">Affectations RACI</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
