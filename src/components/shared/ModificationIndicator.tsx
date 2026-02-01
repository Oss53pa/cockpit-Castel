/**
 * ModificationIndicator - Indicateur de modification dans les tableaux
 * Affiche une pastille colorée avec tooltip au survol
 * - 🔵 Bleu : Modification interne (utilisateur du système)
 * - 🟠 Orange : Modification externe (sync, import, etc.)
 */

import * as React from 'react';
import { createPortal } from 'react-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { cn } from '@/lib/utils';
import type { Historique } from '@/types';
import { Clock, User, FileEdit, ArrowRight } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface ModificationInfo {
  id: number;
  timestamp: string;
  champModifie: string;
  ancienneValeur: string;
  nouvelleValeur: string;
  auteurId: number;
  auteurNom?: string;
  isExternal: boolean;
}

export interface ModificationIndicatorProps {
  entiteType: Historique['entiteType'];
  entiteId: number;
  /** Nombre d'heures pour considérer une modification comme "récente" (défaut: 48h) */
  recentHours?: number;
  /** Afficher même sans modification récente (pour debug) */
  showAlways?: boolean;
  className?: string;
}

// ============================================================================
// HOOK: useRecentModification
// ============================================================================

export function useRecentModification(
  entiteType: Historique['entiteType'],
  entiteId: number,
  recentHours = 48
): ModificationInfo | null {
  const modification = useLiveQuery(async () => {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - recentHours);
    const cutoffISO = cutoffDate.toISOString();

    // Récupérer la dernière modification récente
    const historique = await db.historique
      .where('entiteType')
      .equals(entiteType)
      .and((h) => h.entiteId === entiteId && h.timestamp >= cutoffISO)
      .toArray();

    if (historique.length === 0) return null;

    // Trier par date décroissante et prendre la plus récente
    const latest = historique.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];

    // Récupérer le nom de l'auteur
    let auteurNom = 'Utilisateur';
    let isExternal = false;

    if (latest.auteurId) {
      const user = await db.users.get(latest.auteurId);
      if (user) {
        auteurNom = `${user.prenom} ${user.nom}`;
        // Déterminer si c'est une modification externe (sync, import, système)
        // On considère comme externe les utilisateurs système (ID <= 0) ou marqués comme tels
        isExternal = latest.auteurId <= 0 || user.role === 'system';
      } else {
        // Utilisateur non trouvé = probablement externe
        isExternal = true;
        auteurNom = 'Synchronisation';
      }
    }

    // Vérifier si c'est une modification de sync (champs spéciaux)
    if (
      latest.champModifie?.includes('sync') ||
      latest.champModifie?.includes('import') ||
      latest.champModifie?.includes('external')
    ) {
      isExternal = true;
    }

    return {
      id: latest.id!,
      timestamp: latest.timestamp,
      champModifie: latest.champModifie,
      ancienneValeur: latest.ancienneValeur,
      nouvelleValeur: latest.nouvelleValeur,
      auteurId: latest.auteurId,
      auteurNom,
      isExternal,
    };
  }, [entiteType, entiteId, recentHours]);

  return modification ?? null;
}

// ============================================================================
// HOOK: useAllRecentModifications
// Pour récupérer toutes les modifications récentes d'une entité
// ============================================================================

export function useAllRecentModifications(
  entiteType: Historique['entiteType'],
  entiteId: number,
  recentHours = 48,
  limit = 5
): ModificationInfo[] {
  const modifications = useLiveQuery(async () => {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - recentHours);
    const cutoffISO = cutoffDate.toISOString();

    const historique = await db.historique
      .where('entiteType')
      .equals(entiteType)
      .and((h) => h.entiteId === entiteId && h.timestamp >= cutoffISO)
      .toArray();

    if (historique.length === 0) return [];

    // Trier par date décroissante
    const sorted = historique.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, limit);

    // Récupérer les infos des auteurs
    const userIds = [...new Set(sorted.map((h) => h.auteurId))];
    const users = await db.users.where('id').anyOf(userIds).toArray();
    const userMap = new Map(users.map((u) => [u.id, u]));

    return sorted.map((h) => {
      const user = userMap.get(h.auteurId);
      const isExternal = !user || h.auteurId <= 0 || user.role === 'system';

      return {
        id: h.id!,
        timestamp: h.timestamp,
        champModifie: h.champModifie,
        ancienneValeur: h.ancienneValeur,
        nouvelleValeur: h.nouvelleValeur,
        auteurId: h.auteurId,
        auteurNom: user ? `${user.prenom} ${user.nom}` : 'Synchronisation',
        isExternal,
      };
    });
  }, [entiteType, entiteId, recentHours, limit]);

  return modifications ?? [];
}

// ============================================================================
// HELPERS
// ============================================================================

const FIELD_LABELS: Record<string, string> = {
  titre: 'Titre',
  description: 'Description',
  statut: 'Statut',
  avancement: 'Avancement',
  date_fin_prevue: 'Deadline',
  date_debut_prevue: 'Date début',
  date_prevue: 'Date prévue',
  date_validation: 'Date validation',
  priorite: 'Priorité',
  responsableId: 'Responsable',
  responsable: 'Responsable',
  probabilite: 'Probabilité',
  impact: 'Impact',
  score: 'Score',
  plan_mitigation: 'Plan mitigation',
  montant_prevu: 'Montant prévu',
  montant_realise: 'Montant réalisé',
  phase: 'Phase',
  axe: 'Axe',
  categorie: 'Catégorie',
};

function formatFieldLabel(field: string): string {
  return FIELD_LABELS[field] || field.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
}

function formatValue(value: string, field: string): string {
  try {
    const parsed = JSON.parse(value);

    // Null ou undefined
    if (parsed === null || parsed === undefined) return '-';

    // Booléen
    if (typeof parsed === 'boolean') return parsed ? 'Oui' : 'Non';

    // Nombre (pourcentage pour avancement)
    if (typeof parsed === 'number') {
      if (field === 'avancement') return `${parsed}%`;
      if (field.includes('montant') || field.includes('budget')) {
        return `${parsed.toLocaleString('fr-FR')} FCFA`;
      }
      return String(parsed);
    }

    // Date
    if (typeof parsed === 'string' && /^\d{4}-\d{2}-\d{2}/.test(parsed)) {
      return new Date(parsed).toLocaleDateString('fr-FR');
    }

    // Tableau
    if (Array.isArray(parsed)) {
      return parsed.length === 0 ? '(vide)' : `${parsed.length} élément(s)`;
    }

    // Objet
    if (typeof parsed === 'object') {
      return '(objet modifié)';
    }

    return String(parsed);
  } catch {
    // Si le parsing échoue, retourner la valeur brute
    return value || '-';
  }
}

function formatTimestamp(timestamp: string): { date: string; time: string; relative: string } {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  let relative: string;
  if (diffMins < 1) {
    relative = "À l'instant";
  } else if (diffMins < 60) {
    relative = `Il y a ${diffMins} min`;
  } else if (diffHours < 24) {
    relative = `Il y a ${diffHours}h`;
  } else if (diffDays === 1) {
    relative = 'Hier';
  } else {
    relative = `Il y a ${diffDays} jours`;
  }

  return {
    date: date.toLocaleDateString('fr-FR'),
    time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    relative,
  };
}

// ============================================================================
// COMPOSANT: ModificationIndicator
// ============================================================================

export function ModificationIndicator({
  entiteType,
  entiteId,
  recentHours = 48,
  showAlways = false,
  className,
}: ModificationIndicatorProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  const modification = useRecentModification(entiteType, entiteId, recentHours);
  const allModifications = useAllRecentModifications(entiteType, entiteId, recentHours, 5);

  // Ne rien afficher s'il n'y a pas de modification récente
  if (!modification && !showAlways) {
    return null;
  }

  const isExternal = modification?.isExternal ?? false;

  const updatePosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = tooltipRef.current?.getBoundingClientRect().height || 200;
    const gap = 8;

    let top = rect.bottom + gap + window.scrollY;
    let left = rect.left + window.scrollX;

    // Ajuster si le tooltip dépasse à droite
    if (left + tooltipWidth > window.innerWidth - 10) {
      left = window.innerWidth - tooltipWidth - 10;
    }

    // Ajuster si le tooltip dépasse en bas
    if (top + tooltipHeight > window.innerHeight + window.scrollY - 10) {
      top = rect.top - tooltipHeight - gap + window.scrollY;
    }

    setPosition({ top, left });
  };

  const handleMouseEnter = () => {
    setIsVisible(true);
    requestAnimationFrame(updatePosition);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <>
      <div
        ref={triggerRef}
        className={cn('inline-flex items-center cursor-help', className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Pastille de modification */}
        <span
          className={cn(
            'inline-block w-3 h-3 rounded-full animate-pulse',
            isExternal
              ? 'bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.5)]'
              : 'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]'
          )}
          title={isExternal ? 'Modification externe' : 'Modification interne'}
        />
      </div>

      {/* Tooltip avec détails */}
      {isVisible && modification && createPortal(
        <div
          ref={tooltipRef}
          className="fixed z-[99999] w-80 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden animate-fade-in"
          style={{
            top: position.top,
            left: position.left,
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Header */}
          <div
            className={cn(
              'px-4 py-2 border-b flex items-center gap-2',
              isExternal ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'
            )}
          >
            <FileEdit className={cn('h-4 w-4', isExternal ? 'text-orange-600' : 'text-blue-600')} />
            <span className={cn('font-medium text-sm', isExternal ? 'text-orange-800' : 'text-blue-800')}>
              {allModifications.length > 1
                ? `${allModifications.length} modifications récentes`
                : 'Modification récente'}
            </span>
          </div>

          {/* Liste des modifications */}
          <div className="max-h-64 overflow-y-auto">
            {allModifications.map((mod, index) => {
              const time = formatTimestamp(mod.timestamp);
              const fieldLabel = formatFieldLabel(mod.champModifie);
              const oldVal = formatValue(mod.ancienneValeur, mod.champModifie);
              const newVal = formatValue(mod.nouvelleValeur, mod.champModifie);

              return (
                <div
                  key={mod.id}
                  className={cn(
                    'px-4 py-3 border-b border-gray-100 last:border-0',
                    index === 0 && 'bg-gray-50'
                  )}
                >
                  {/* Champ modifié */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm text-gray-900">
                      {fieldLabel}
                    </span>
                    {index === 0 && (
                      <span className="px-1.5 py-0.5 text-xs bg-primary-100 text-primary-700 rounded">
                        Dernière
                      </span>
                    )}
                  </div>

                  {/* Valeur changée */}
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <span className="text-gray-500 line-through max-w-[120px] truncate" title={oldVal}>
                      {oldVal}
                    </span>
                    <ArrowRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-900 font-medium max-w-[120px] truncate" title={newVal}>
                      {newVal}
                    </span>
                  </div>

                  {/* Auteur et date */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>
                        {mod.auteurNom}
                        {mod.isExternal && (
                          <span className="ml-1 text-orange-600">(externe)</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span title={`${time.date} à ${time.time}`}>
                        {time.relative}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 text-center">
            Modifications des dernières {recentHours}h
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// ============================================================================
// COMPOSANT: ModificationCell
// Cellule de tableau avec l'indicateur
// ============================================================================

export interface ModificationCellProps {
  entiteType: Historique['entiteType'];
  entiteId: number;
  recentHours?: number;
}

export function ModificationCell({
  entiteType,
  entiteId,
  recentHours = 48,
}: ModificationCellProps) {
  return (
    <div className="flex justify-center">
      <ModificationIndicator
        entiteType={entiteType}
        entiteId={entiteId}
        recentHours={recentHours}
      />
    </div>
  );
}

export default ModificationIndicator;
