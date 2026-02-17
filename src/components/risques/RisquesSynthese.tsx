import { useState, useMemo } from 'react';
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
  Megaphone,
  CalendarClock,
  Globe,
  Shield,
  FileSignature,
  Boxes,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useRisques, useRisquesCritiques } from '@/hooks';
import { SEUILS_RISQUES } from '@/data/constants';
import type { Risque, RisqueCategory } from '@/types';

// Type pour le niveau de risque
type RisqueNiveau = 'critique' | 'majeur' | 'modere' | 'faible';

// Fonction pour déterminer le niveau d'un risque basé sur son score (seuils depuis constants.ts)
function getNiveauRisque(score: number): RisqueNiveau {
  if (score >= SEUILS_RISQUES.critique) return 'critique';
  if (score >= SEUILS_RISQUES.majeur) return 'majeur';
  if (score >= SEUILS_RISQUES.modere) return 'modere';
  return 'faible';
}

// Catégories de risques avec icônes
const RISQUE_CATEGORIES = [
  { id: 'technique', label: 'Technique / Chantier', icon: Building2, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { id: 'commercial', label: 'Commercial / BEFA', icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-50' },
  { id: 'rh', label: 'RH / Équipe', icon: Users, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  { id: 'financier', label: 'Budget / Finance', icon: Wallet, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  { id: 'reglementaire', label: 'Réglementaire', icon: FileCheck, color: 'text-red-600', bgColor: 'bg-red-50' },
  { id: 'operationnel', label: 'Exploitation / Systèmes', icon: Settings, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  { id: 'marketing', label: 'Marketing / Communication', icon: Megaphone, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  { id: 'planning', label: 'Planning / Délais', icon: CalendarClock, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  { id: 'organisationnel', label: 'Organisationnel', icon: Boxes, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  { id: 'exploitation', label: 'Exploitation', icon: Settings, color: 'text-teal-600', bgColor: 'bg-teal-50' },
  { id: 'externe', label: 'Externe / Contexte', icon: Globe, color: 'text-gray-600', bgColor: 'bg-gray-50' },
  { id: 'securite', label: 'Sécurité', icon: Shield, color: 'text-rose-600', bgColor: 'bg-rose-50' },
  { id: 'contractuel', label: 'Contractuel', icon: FileSignature, color: 'text-slate-600', bgColor: 'bg-slate-50' },
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
  // Données depuis la base de données
  const risquesData = useRisques();
  const risquesCritiquesData = useRisquesCritiques();

  // Calcul des statistiques depuis les données réelles
  const syntheseRisques = useMemo(() => {
    const parNiveau = {
      critique: 0,
      majeur: 0,
      modere: 0,
      faible: 0,
    };

    risquesData.forEach((r) => {
      const niveau = getNiveauRisque(r.score);
      parNiveau[niveau]++;
    });

    return {
      total: risquesData.length,
      parNiveau,
    };
  }, [risquesData]);

  // Statistiques par catégorie
  const statsByCategorie = useMemo(() => {
    return RISQUE_CATEGORIES.map((axe) => {
      const risquesCategorie = risquesData.filter(
        (r) => r.categorie === axe.id ||
               (axe.id === 'financier' && r.categorie === 'budget') ||
               (axe.id === 'operationnel' && r.categorie === 'exploitation')
      );
      const critiques = risquesCategorie.filter(r => getNiveauRisque(r.score) === 'critique').length;
      const majeurs = risquesCategorie.filter(r => getNiveauRisque(r.score) === 'majeur').length;
      return {
        ...axe,
        total: risquesCategorie.length,
        critiques,
        majeurs,
      };
    });
  }, [risquesData]);

  // Top 10 risques critiques (triés par score décroissant)
  const risquesCritiques = useMemo(() => {
    return [...risquesData]
      .filter(r => r.status !== 'closed')
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [risquesData]);

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
            {syntheseRisques.total} risques
          </Badge>
        </div>

        {/* Distribution par niveau */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-error-50 rounded-lg p-4 text-center border border-error-200">
            <div className="text-3xl font-bold text-error-700">{syntheseRisques.parNiveau.critique}</div>
            <div className="text-sm text-error-600 font-medium">Critiques</div>
            <div className="text-xs text-error-500 mt-1">Score 12-16</div>
          </div>
          <div className="bg-warning-50 rounded-lg p-4 text-center border border-warning-200">
            <div className="text-3xl font-bold text-warning-700">{syntheseRisques.parNiveau.majeur}</div>
            <div className="text-sm text-warning-600 font-medium">Majeurs</div>
            <div className="text-xs text-warning-500 mt-1">Score 10-15</div>
          </div>
          <div className="bg-info-50 rounded-lg p-4 text-center border border-info-200">
            <div className="text-3xl font-bold text-info-700">{syntheseRisques.parNiveau.modere}</div>
            <div className="text-sm text-info-600 font-medium">Modérés</div>
            <div className="text-xs text-info-500 mt-1">Score 5-9</div>
          </div>
          <div className="bg-success-50 rounded-lg p-4 text-center border border-success-200">
            <div className="text-3xl font-bold text-success-700">{syntheseRisques.parNiveau.faible}</div>
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
                style={{ width: `${syntheseRisques.total > 0 ? (syntheseRisques.parNiveau.critique / syntheseRisques.total) * 100 : 0}%` }}
              />
            </div>
            <div className="w-12 text-sm text-right text-primary-700 font-medium">
              {syntheseRisques.total > 0 ? Math.round((syntheseRisques.parNiveau.critique / syntheseRisques.total) * 100) : 0}%
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 text-sm text-primary-600">Majeurs</div>
            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-warning-500 rounded-full transition-all"
                style={{ width: `${syntheseRisques.total > 0 ? (syntheseRisques.parNiveau.majeur / syntheseRisques.total) * 100 : 0}%` }}
              />
            </div>
            <div className="w-12 text-sm text-right text-primary-700 font-medium">
              {syntheseRisques.total > 0 ? Math.round((syntheseRisques.parNiveau.majeur / syntheseRisques.total) * 100) : 0}%
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 text-sm text-primary-600">Modérés</div>
            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-info-500 rounded-full transition-all"
                style={{ width: `${syntheseRisques.total > 0 ? (syntheseRisques.parNiveau.modere / syntheseRisques.total) * 100 : 0}%` }}
              />
            </div>
            <div className="w-12 text-sm text-right text-primary-700 font-medium">
              {syntheseRisques.total > 0 ? Math.round((syntheseRisques.parNiveau.modere / syntheseRisques.total) * 100) : 0}%
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
                <th className="px-3 py-2 text-left font-medium text-primary-700">Catégorie</th>
              </tr>
            </thead>
            <tbody>
              {risquesCritiques.map((risque, index) => (
                <tr key={risque.id} className={index % 2 === 0 ? 'bg-white' : 'bg-primary-50/50'}>
                  <td className="px-3 py-2 font-bold text-primary-600">{index + 1}</td>
                  <td className="px-3 py-2 font-mono text-primary-700">{risque.id_risque || `R-${risque.id}`}</td>
                  <td className="px-3 py-2 text-primary-800">{risque.titre}</td>
                  <td className="px-3 py-2 text-center">
                    <Badge variant="error" className="font-bold">{risque.score}</Badge>
                  </td>
                  <td className="px-3 py-2 text-primary-600">{risque.categorie}</td>
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
            <p className="text-sm text-primary-700">Risques critiques ({syntheseRisques.parNiveau.critique})</p>
            <p className="text-xs text-primary-500 mt-1">Responsable: DGA</p>
          </div>
          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="warning">Bi-mensuel</Badge>
            </div>
            <p className="text-sm text-primary-700">Risques majeurs ({syntheseRisques.parNiveau.majeur})</p>
            <p className="text-xs text-primary-500 mt-1">Responsable: Managers</p>
          </div>
          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="info">Mensuel</Badge>
            </div>
            <p className="text-sm text-primary-700">Risques modérés ({syntheseRisques.parNiveau.modere})</p>
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

      {/* Statistiques de la base */}
      <Card padding="md">
        <h4 className="text-md font-semibold text-primary-900 mb-4 flex items-center gap-2">
          <Database className="h-4 w-4 text-primary-600" />
          Données Base de Données
        </h4>

        <div className="p-3 bg-primary-50 rounded-lg">
          <p className="text-sm text-primary-700 font-medium">Statistiques actuelles:</p>
          <div className="flex flex-wrap gap-4 mt-2 text-sm">
            <span>Total: <strong>{syntheseRisques.total}</strong></span>
            <span>Critiques: <strong className="text-error-600">{syntheseRisques.parNiveau.critique}</strong></span>
            <span>Majeurs: <strong className="text-warning-600">{syntheseRisques.parNiveau.majeur}</strong></span>
            <span>Modérés: <strong className="text-info-600">{syntheseRisques.parNiveau.modere}</strong></span>
            <span>Faibles: <strong className="text-success-600">{syntheseRisques.parNiveau.faible}</strong></span>
          </div>
        </div>
      </Card>
    </div>
  );
}
