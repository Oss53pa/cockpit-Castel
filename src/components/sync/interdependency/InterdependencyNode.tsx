/**
 * Composant noeud pour le diagramme d'interdépendance
 */

import React from 'react';
import { Lock, AlertTriangle, CheckCircle2, Clock, Pause } from 'lucide-react';
import type { DependencyNode } from '@/types/interdependency.types';
import { AXE_COLORS } from '@/types/interdependency.types';
import type { ActionStatus } from '@/types';

interface InterdependencyNodeProps {
  node: DependencyNode;
  isSelected: boolean;
  onClick: () => void;
  width?: number;
  height?: number;
}

const STATUS_ICONS: Record<ActionStatus, React.ReactNode> = {
  non_demarree: <Clock className="h-3 w-3 text-gray-400" />,
  en_cours: <Clock className="h-3 w-3 text-blue-500 animate-pulse" />,
  en_attente: <Pause className="h-3 w-3 text-yellow-500" />,
  bloquee: <Lock className="h-3 w-3 text-red-500" />,
  terminee: <CheckCircle2 className="h-3 w-3 text-green-500" />,
  annulee: <AlertTriangle className="h-3 w-3 text-gray-400" />,
};

export const InterdependencyNode: React.FC<InterdependencyNodeProps> = ({
  node,
  isSelected,
  onClick,
  width = 180,
  height = 80,
}) => {
  const colors = AXE_COLORS[node.action.axe];
  const truncatedTitle =
    node.action.titre.length > 25
      ? node.action.titre.substring(0, 22) + '...'
      : node.action.titre;

  // Déterminer les styles selon l'état
  const borderColor = node.isCritical
    ? '#F97316' // Orange pour chemin critique
    : isSelected
      ? colors.dark
      : colors.bg;

  const borderWidth = node.isCritical || isSelected ? 3 : 2;

  const fillColor = node.isImpacted
    ? '#FEF3C7' // Jaune clair pour simulation
    : node.isBlocked
      ? '#FEE2E2' // Rouge clair pour bloqué
      : colors.light;

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Rectangle de fond */}
      <rect
        width={width}
        height={height}
        rx={8}
        ry={8}
        fill={fillColor}
        stroke={borderColor}
        strokeWidth={borderWidth}
        className="transition-all duration-200"
      />

      {/* Barre de couleur en haut */}
      <rect
        width={width}
        height={6}
        rx={8}
        ry={8}
        fill={colors.bg}
        clipPath="url(#topRound)"
      />
      <rect x={0} y={3} width={width} height={3} fill={colors.bg} />

      {/* Code WBS */}
      <text
        x={10}
        y={22}
        fontSize={11}
        fontWeight="600"
        fill={colors.dark}
        fontFamily="ui-monospace, monospace"
      >
        {node.action.id_action}
      </text>

      {/* Icône de statut */}
      <foreignObject x={width - 24} y={10} width={16} height={16}>
        {STATUS_ICONS[node.action.statut]}
      </foreignObject>

      {/* Titre */}
      <text x={10} y={42} fontSize={12} fill="#374151" fontWeight="500">
        {truncatedTitle}
      </text>

      {/* Barre de progression */}
      <rect
        x={10}
        y={52}
        width={width - 20}
        height={6}
        rx={3}
        fill="#E5E7EB"
      />
      <rect
        x={10}
        y={52}
        width={Math.max(0, ((width - 20) * node.action.avancement) / 100)}
        height={6}
        rx={3}
        fill={node.action.avancement === 100 ? '#22C55E' : colors.bg}
      />

      {/* Pourcentage */}
      <text x={10} y={72} fontSize={10} fill="#6B7280">
        {node.action.avancement}%
      </text>

      {/* Indicateur de blocage */}
      {node.isBlocked && (
        <foreignObject x={width - 50} y={58} width={16} height={16}>
          <Lock className="h-4 w-4 text-red-500" />
        </foreignObject>
      )}

      {/* Indicateur de slack */}
      {!node.isCritical && node.slack > 0 && (
        <text x={width - 35} y={72} fontSize={9} fill="#9CA3AF">
          +{Math.round(node.slack)}j
        </text>
      )}

      {/* Badge impact simulation */}
      {node.isImpacted && node.impactDelay && (
        <g transform={`translate(${width - 30}, -8)`}>
          <rect
            width={30}
            height={16}
            rx={8}
            fill="#F59E0B"
          />
          <text
            x={15}
            y={12}
            fontSize={9}
            fill="white"
            textAnchor="middle"
            fontWeight="600"
          >
            +{node.impactDelay}j
          </text>
        </g>
      )}

      {/* Indicateur chemin critique */}
      {node.isCritical && (
        <g transform={`translate(-8, -8)`}>
          <circle r={8} fill="#F97316" />
          <text
            x={0}
            y={4}
            fontSize={10}
            fill="white"
            textAnchor="middle"
            fontWeight="bold"
          >
            C
          </text>
        </g>
      )}
    </g>
  );
};
