/**
 * Composant arête (flèche de dépendance) pour le diagramme
 */

import React from 'react';
import type { DependencyEdge, DependencyNode } from '@/types/interdependency.types';
import { DEPENDENCY_STYLES } from '@/types/interdependency.types';
import { generateEdgeSVGPath, DEFAULT_LAYOUT_CONFIG } from '@/lib/interdependency';

interface InterdependencyEdgeProps {
  edge: DependencyEdge;
  sourceNode: DependencyNode;
  targetNode: DependencyNode;
  isHighlighted?: boolean;
}

export const InterdependencyEdge: React.FC<InterdependencyEdgeProps> = ({
  edge,
  sourceNode,
  targetNode,
  isHighlighted = false,
}) => {
  const style = DEPENDENCY_STYLES[edge.type];
  const path = generateEdgeSVGPath(sourceNode, targetNode, DEFAULT_LAYOUT_CONFIG);

  // Déterminer la couleur
  let strokeColor = '#9CA3AF'; // Gris par défaut
  if (edge.isImpacted) {
    strokeColor = '#F59E0B'; // Orange pour simulation
  } else if (edge.isCritical) {
    strokeColor = '#F97316'; // Orange vif pour chemin critique
  } else if (isHighlighted) {
    strokeColor = '#3B82F6'; // Bleu pour surbrillance
  }

  const strokeWidth = edge.isCritical || isHighlighted ? 3 : 2;

  // Calculer la position de la flèche
  const endX = targetNode.x;
  const endY = targetNode.y + DEFAULT_LAYOUT_CONFIG.nodeDimensions.height / 2;

  // ID unique pour le marker
  const markerId = `arrow-${edge.id.replace(/[^a-zA-Z0-9]/g, '-')}`;

  return (
    <g>
      {/* Définition de la flèche */}
      <defs>
        <marker
          id={markerId}
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill={strokeColor} />
        </marker>
      </defs>

      {/* Ligne de connexion */}
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={style.dashArray}
        markerEnd={`url(#${markerId})`}
        className="transition-all duration-200"
      />

      {/* Label du lag si != 0 */}
      {edge.lag !== 0 && (
        <g>
          {/* Calculer la position du label au milieu de la courbe */}
          <LagLabel
            sourceNode={sourceNode}
            targetNode={targetNode}
            lag={edge.lag}
            type={edge.type}
          />
        </g>
      )}
    </g>
  );
};

/**
 * Label affichant le décalage (lag)
 */
const LagLabel: React.FC<{
  sourceNode: DependencyNode;
  targetNode: DependencyNode;
  lag: number;
  type: string;
}> = ({ sourceNode, targetNode, lag, type }) => {
  const { nodeDimensions } = DEFAULT_LAYOUT_CONFIG;

  // Position au milieu de l'arête
  const startX = sourceNode.x + nodeDimensions.width;
  const startY = sourceNode.y + nodeDimensions.height / 2;
  const endX = targetNode.x;
  const endY = targetNode.y + nodeDimensions.height / 2;

  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2 - 10;

  const sign = lag >= 0 ? '+' : '';
  const text = `${sign}${lag}j`;

  return (
    <g transform={`translate(${midX}, ${midY})`}>
      <rect
        x={-18}
        y={-10}
        width={36}
        height={16}
        rx={4}
        fill="white"
        stroke="#D1D5DB"
        strokeWidth={1}
      />
      <text
        x={0}
        y={3}
        fontSize={10}
        fill="#6B7280"
        textAnchor="middle"
        fontFamily="ui-monospace, monospace"
      >
        {text}
      </text>
    </g>
  );
};
