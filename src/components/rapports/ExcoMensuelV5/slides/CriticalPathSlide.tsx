import React, { useState, useMemo } from 'react';
import { C } from '../constants';
import { SectionHeader, SlideCard } from '../components';
import type { ExcoV5Data } from '../hooks/useExcoV5Data';
import type { CriticalAction } from '@/hooks/useCriticalPath';

interface Props { data: ExcoV5Data; printMode?: boolean }

// Couleurs des phases
const PHASE_COLORS: Record<string, string> = {
  'SOFT OPENING': '#b39ddb',
  'COMMERCIALISATION': '#ffd54f',
  'HANDOVER': '#64b5f6',
  'MOBILISATION': '#f48fb1',
  'BUDGET': '#80cbc4',
  'CONSTRUCTION': '#ffb74d',
  'CLÔTURE': '#90a4ae',
};

function getPhaseColor(phase: string): string {
  return PHASE_COLORS[phase] ?? C.gray500;
}

// Filtres axe
const AXE_FILTERS = [
  { key: 'all', label: 'TOUS' },
  { key: 'axe6_exploitation', label: 'Opérations' },
  { key: 'axe3_technique', label: 'Technique' },
  { key: 'axe2_commercial', label: 'Commercial' },
  { key: 'axe1_rh', label: 'RH' },
  { key: 'axe4_budget', label: 'Budget' },
];

export function CriticalPathSlide({ data, printMode }: Props) {
  const cp = data.criticalPath;
  const allActions = cp?.criticalActions ?? [];
  const [filter, setFilter] = useState('all');

  // Actions filtrées
  const filteredActions = useMemo(() => {
    const list = filter === 'all' ? allActions : allActions.filter(a => a.axe === filter);
    return list.slice(0, 10);
  }, [allActions, filter]);

  // Stats
  const total = cp?.totalCriticalActions ?? 0;
  const noMargin = cp?.actionsNoMargin ?? 0;
  const lowMargin = cp?.actionsLowMargin ?? 0;
  const bottlenecks = cp?.bottlenecks.length ?? 0;
  const okMargin = Math.max(0, total - noMargin - lowMargin);

  // Répartition en %
  const pctNoMargin = total > 0 ? Math.round((noMargin / total) * 100) : 0;
  const pctLowMargin = total > 0 ? Math.round((lowMargin / total) * 100) : 0;
  const pctOk = total > 0 ? 100 - pctNoMargin - pctLowMargin : 0;

  // Impact par jalon (grouper par phase)
  const phaseStats = useMemo(() => {
    const map = new Map<string, { total: number; noMargin: number }>();
    for (const a of allActions) {
      const phase = a.phase ?? 'AUTRE';
      const entry = map.get(phase) ?? { total: 0, noMargin: 0 };
      entry.total++;
      if (a.margin === 0) entry.noMargin++;
      map.set(phase, entry);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1].noMargin - a[1].noMargin)
      .slice(0, 5);
  }, [allActions]);

  return (
    <div>
      <SectionHeader
        title="Chemin Critique"
        subtitle={`${total} actions critiques — ${noMargin} sans marge`}
      />

      {/* ============ KPIs + Répartition ============ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.3fr', gap: 12, marginBottom: 20 }}>
        <KpiCard value={noMargin} label="Actions sans marge" sub={`${pctNoMargin}% du chemin critique`} color={C.red} />
        <KpiCard value={lowMargin} label="Marge < 7 jours" sub={`${pctLowMargin}% à risque imminent`} color={C.orange} />
        <KpiCard value={bottlenecks} label="Goulots d'étranglement" sub={bottlenecks === 0 ? 'Aucun blocage chaîné' : `${bottlenecks} blocage(s)`} color={bottlenecks > 0 ? C.purple : C.green} />

        {/* Répartition criticité */}
        <div style={{
          padding: '16px', backgroundColor: C.white, borderRadius: 10,
          border: `1px solid ${C.gray200}`, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.gray600, marginBottom: 10 }}>
            Répartition criticité
          </div>
          {/* Stacked bar */}
          <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
            {pctNoMargin > 0 && <div style={{ width: `${pctNoMargin}%`, backgroundColor: C.red }} />}
            {pctLowMargin > 0 && <div style={{ width: `${pctLowMargin}%`, backgroundColor: C.orange }} />}
            {pctOk > 0 && <div style={{ width: `${pctOk}%`, backgroundColor: C.green }} />}
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 10, color: C.gray500 }}>
            <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, backgroundColor: C.red, marginRight: 4 }} />Sans marge</span>
            <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, backgroundColor: C.orange, marginRight: 4 }} />&lt;7j</span>
            <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, backgroundColor: C.green, marginRight: 4 }} />OK</span>
          </div>
        </div>
      </div>

      {/* ============ Impact par jalon ============ */}
      {phaseStats.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: C.gray500, fontWeight: 600, marginBottom: 8 }}>Impact par jalon</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {phaseStats.map(([phase, stats]) => (
              <div key={phase} style={{
                padding: '8px 14px', borderRadius: 8,
                backgroundColor: C.white, border: `1px solid ${C.gray200}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ color: getPhaseColor(phase), fontSize: 11 }}>●</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: getPhaseColor(phase) }}>{phase}</span>
                </div>
                <div style={{ fontSize: 11, color: C.gray500 }}>
                  <span style={{ fontWeight: 600, color: stats.noMargin > 0 ? C.red : C.gray600 }}>{stats.noMargin} sans marge</span>
                  {' / '}{stats.total} total
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============ Filtres axe ============ */}
      {!printMode && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {AXE_FILTERS.map(f => {
            const isActive = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600,
                  backgroundColor: isActive ? C.navy : C.white,
                  color: isActive ? C.white : C.gray600,
                  boxShadow: isActive ? 'none' : `inset 0 0 0 1px ${C.gray200}`,
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ============ Top 10 Actions Critiques ============ */}
      <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 12 }}>
        Top 10 Actions Critiques
      </div>

      {filteredActions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, color: C.gray400 }}>
          Aucune action critique{filter !== 'all' ? ' pour cet axe' : ''}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {filteredActions.map((action, i) => (
            <ActionCard key={action.id} action={action} rank={i + 1} />
          ))}
        </div>
      )}

      {/* Notes */}
      {data.criticalPathNotes && (
        <div style={{ marginTop: 16, padding: 16, backgroundColor: C.goldBg, borderRadius: 10,  }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.gold, marginBottom: 4 }}>NOTE</div>
          <div style={{ fontSize: 13, color: C.gray700, whiteSpace: 'pre-wrap' }}>{data.criticalPathNotes}</div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function KpiCard({ value, label, sub, color }: { value: number; label: string; sub: string; color: string }) {
  return (
    <div style={{
      textAlign: 'center', padding: '16px 12px',
      backgroundColor: C.white, borderRadius: 10,
      border: `1px solid ${C.gray200}`,
    }}>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: C.gray600, fontWeight: 600, marginTop: 4 }}>{label}</div>
      <div style={{ fontSize: 10, color: C.gray400, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function ActionCard({ action, rank }: { action: CriticalAction; rank: number }) {
  const marginColor = action.margin === 0 ? C.red : action.margin <= 7 ? C.orange : C.green;
  const marginLabel = action.margin === 0 ? 'SANS MARGE' : `${action.margin}J MARGE`;
  const cardBorder = action.margin === 0 ? C.red : action.margin <= 7 ? C.orange : C.gray200;
  const dateFr = new Date(action.dateFinPrevue).toLocaleDateString('fr-FR');

  return (
    <div style={{
      backgroundColor: C.white, borderRadius: 10,
      border: `1px solid ${C.gray200}`,
      padding: '14px 16px',
      display: 'flex', gap: 12,
    }}>
      {/* Rank badge */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        backgroundColor: action.margin === 0 ? C.redBg : action.margin <= 7 ? C.orangeBg : C.gray100,
        color: marginColor, fontWeight: 600, fontSize: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {rank}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title + margin badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, lineHeight: 1.3 }}>
            {action.titre}
          </div>
          <span style={{
            fontSize: 10, fontWeight: 600, color: marginColor,
            padding: '2px 8px', borderRadius: 4,
            backgroundColor: action.margin === 0 ? C.redBg : action.margin <= 7 ? C.orangeBg : C.greenBg,
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {marginLabel}
          </span>
        </div>

        {/* Meta row: person, date, phase */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: C.gray500 }}>
            {action.responsable}
          </span>
          <span style={{ fontSize: 11, color: C.gray400 }}>
            {dateFr}
          </span>
          {action.phase && (
            <span style={{
              fontSize: 10, fontWeight: 600, color: getPhaseColor(action.phase),
              padding: '1px 8px', borderRadius: 10,
              backgroundColor: `${getPhaseColor(action.phase)}15`,
              border: `1px solid ${getPhaseColor(action.phase)}30`,
            }}>
              ● {action.phase}
            </span>
          )}
        </div>

        {/* Axe label */}
        <div style={{ fontSize: 11, color: C.gray500, marginBottom: 4 }}>
          {action.axeLabel}
        </div>

        {/* Dependencies */}
        {action.predecesseursTitres.length > 0 && (
          <div style={{ fontSize: 10, color: C.gray400, fontStyle: 'italic' }}>
            Dépend de : {action.predecesseursTitres.join(', ')}
          </div>
        )}

        {/* Progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <div style={{
            flex: 1, height: 4, backgroundColor: C.gray200, borderRadius: 2, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 2,
              width: `${action.avancement}%`,
              backgroundColor: marginColor,
            }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.gray500, minWidth: 28, textAlign: 'right' }}>
            {action.avancement}%
          </span>
        </div>
      </div>
    </div>
  );
}
