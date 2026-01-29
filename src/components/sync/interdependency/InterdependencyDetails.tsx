/**
 * Panel de détails pour une action sélectionnée
 */

import React from 'react';
import {
  X,
  Calendar,
  User,
  Clock,
  GitBranch,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  Lock,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { DependencyNode, InterdependencyGraph } from '@/types/interdependency.types';
import { AXE_COLORS } from '@/types/interdependency.types';
import { getPredecessors, getSuccessors } from '@/lib/interdependency';

const AXE_LABELS: Record<string, string> = {
  axe1_rh: 'RH',
  axe2_commercial: 'Commercial',
  axe3_technique: 'Technique',
  axe4_budget: 'Budget',
  axe5_marketing: 'Marketing',
  axe6_exploitation: 'Exploitation',
};

const STATUS_LABELS: Record<string, string> = {
  non_demarree: 'Non démarrée',
  en_cours: 'En cours',
  en_attente: 'En attente',
  bloquee: 'Bloquée',
  terminee: 'Terminée',
  annulee: 'Annulée',
};

interface InterdependencyDetailsProps {
  node: DependencyNode;
  graph: InterdependencyGraph;
  onClose: () => void;
  onNodeClick: (nodeId: string) => void;
  onSimulateClick: () => void;
}

export const InterdependencyDetails: React.FC<InterdependencyDetailsProps> = ({
  node,
  graph,
  onClose,
  onNodeClick,
  onSimulateClick,
}) => {
  const colors = AXE_COLORS[node.action.axe];
  const predecessors = getPredecessors(graph, node.id);
  const successors = getSuccessors(graph, node.id);

  return (
    <div className="bg-white border-l border-gray-200 w-80 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className="p-3 border-b flex items-start justify-between"
        style={{ backgroundColor: colors.light }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-mono px-1.5 py-0.5 rounded"
              style={{ backgroundColor: colors.bg, color: 'white' }}
            >
              {node.action.id_action}
            </span>
            {node.isCritical && (
              <span className="text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded">
                Critique
              </span>
            )}
            {node.isBlocked && (
              <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Bloqué
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-800 text-sm leading-tight">
            {node.action.titre}
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            {AXE_LABELS[node.action.axe]} • {STATUS_LABELS[node.action.statut]}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Dates */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Planification
          </h4>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Début:</span>
              <span className="font-medium">
                {format(new Date(node.action.date_debut_prevue), 'dd MMM yyyy', {
                  locale: fr,
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Fin:</span>
              <span className="font-medium">
                {format(new Date(node.action.date_fin_prevue), 'dd MMM yyyy', {
                  locale: fr,
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Durée:</span>
              <span className="font-medium">
                {node.action.duree_prevue_jours} jours
              </span>
            </div>
          </div>
        </div>

        {/* Responsable */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Responsable
          </h4>
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-gray-400" />
            <span>{node.action.responsable || 'Non assigné'}</span>
          </div>
        </div>

        {/* Progression */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Avancement
          </h4>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${node.action.avancement}%`,
                  backgroundColor:
                    node.action.avancement === 100 ? '#22C55E' : colors.bg,
                }}
              />
            </div>
            <span className="text-sm font-medium">{node.action.avancement}%</span>
          </div>
        </div>

        {/* Valeurs PERT */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Analyse PERT
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-50 rounded p-2">
              <span className="text-gray-500">ES (Début au plus tôt)</span>
              <p className="font-mono font-medium">J+{Math.round(node.ES)}</p>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <span className="text-gray-500">EF (Fin au plus tôt)</span>
              <p className="font-mono font-medium">J+{Math.round(node.EF)}</p>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <span className="text-gray-500">LS (Début au plus tard)</span>
              <p className="font-mono font-medium">J+{Math.round(node.LS)}</p>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <span className="text-gray-500">LF (Fin au plus tard)</span>
              <p className="font-mono font-medium">J+{Math.round(node.LF)}</p>
            </div>
            <div className="bg-gray-50 rounded p-2 col-span-2">
              <span className="text-gray-500">Marge (Slack)</span>
              <p
                className={`font-mono font-medium ${node.slack === 0 ? 'text-orange-600' : 'text-green-600'}`}
              >
                {Math.round(node.slack)} jours
              </p>
            </div>
          </div>
        </div>

        {/* Prédécesseurs */}
        {predecessors.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" />
              Prédécesseurs ({predecessors.length})
            </h4>
            <ul className="space-y-1">
              {predecessors.map((pred) => (
                <li key={pred.id}>
                  <button
                    onClick={() => onNodeClick(pred.id)}
                    className="w-full text-left text-sm p-1.5 rounded hover:bg-gray-100 flex items-center gap-2"
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: AXE_COLORS[pred.action.axe].bg }}
                    />
                    <span className="font-mono text-xs text-gray-500">
                      {pred.id}
                    </span>
                    <span className="truncate">{pred.action.titre}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Successeurs */}
        {successors.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <ArrowRight className="h-3 w-3" />
              Successeurs ({successors.length})
            </h4>
            <ul className="space-y-1">
              {successors.map((succ) => (
                <li key={succ.id}>
                  <button
                    onClick={() => onNodeClick(succ.id)}
                    className="w-full text-left text-sm p-1.5 rounded hover:bg-gray-100 flex items-center gap-2"
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: AXE_COLORS[succ.action.axe].bg }}
                    />
                    <span className="font-mono text-xs text-gray-500">
                      {succ.id}
                    </span>
                    <span className="truncate">{succ.action.titre}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Raison de blocage */}
        {node.isBlocked && node.blockingReason && (
          <div className="bg-red-50 border border-red-200 rounded-md p-2">
            <h4 className="text-xs font-semibold text-red-700 mb-1">
              Raison du blocage
            </h4>
            <p className="text-sm text-red-600">{node.blockingReason}</p>
          </div>
        )}
      </div>

      {/* Footer - Bouton simulation */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <button
          onClick={onSimulateClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
        >
          <TrendingUp className="h-4 w-4" />
          Simuler un retard
        </button>
      </div>
    </div>
  );
};
