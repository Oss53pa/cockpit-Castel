import React, { useState, useMemo } from 'react';
import { C, AXES_V5 } from '../constants';
import { SectionHeader } from '../components';
import type { ExcoV5Data } from '../hooks/useExcoV5Data';

interface Props { data: ExcoV5Data; printMode?: boolean }

function getMitigation(risk: Record<string, unknown>): string | null {
  const val = risk.planMitigation || risk.plan_mitigation || risk.mesures_attenuation;
  return typeof val === 'string' && val.trim() ? val.trim() : null;
}

function getSeverityConfig(score: number) {
  if (score >= 12) return { label: 'CRITIQUE', color: C.red, bg: C.redBg };
  if (score >= 8) return { label: 'MAJEUR', color: C.orange, bg: C.orangeBg };
  if (score >= 4) return { label: 'MODÉRÉ', color: C.yellow, bg: C.yellowBg };
  return { label: 'FAIBLE', color: C.green, bg: C.greenBg };
}

const SEVERITY_CATS = [
  { label: 'Critiques', threshold: '≥12', filter: (s: number) => s >= 12, color: C.red, bg: C.redBg },
  { label: 'Majeurs', threshold: '8-11', filter: (s: number) => s >= 8 && s < 12, color: C.orange, bg: C.orangeBg },
  { label: 'Modérés', threshold: '4-7', filter: (s: number) => s >= 4 && s < 8, color: C.green, bg: C.greenBg },
  { label: 'Faibles', threshold: '<4', filter: (s: number) => s < 4, color: C.blue, bg: C.blueBg },
];

export function RisksSlide({ data, printMode }: Props) {
  const [activeFilter, setActiveFilter] = useState('tous');

  // All active risks sorted by score
  const activeRisks = useMemo(() =>
    data.allRisques
      .filter(r => r.status !== 'closed')
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
    [data.allRisques]
  );

  const totalActive = activeRisks.length;

  // Distribution counts
  const distribution = useMemo(() =>
    SEVERITY_CATS.map(cat => ({
      ...cat,
      count: activeRisks.filter(r => cat.filter(r.score ?? 0)).length,
    })),
    [activeRisks]
  );

  const pctCritiqueMajeur = totalActive > 0
    ? Math.round(((distribution[0].count + distribution[1].count) / totalActive) * 100)
    : 0;

  // Axes that have active risks (for filter tabs)
  const axeFilters = useMemo(() => {
    const axeMap = new Map<string, number>();
    activeRisks.forEach(r => {
      if (r.axe_impacte) axeMap.set(r.axe_impacte, (axeMap.get(r.axe_impacte) ?? 0) + 1);
    });
    return Array.from(axeMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([dbCode]) => {
        const cfg = AXES_V5.find(a => a.dbCode === dbCode);
        return { dbCode, label: cfg?.label.split(' & ')[0] ?? dbCode };
      });
  }, [activeRisks]);

  // Filtered risks
  const filteredRisks = useMemo(() => {
    const base = activeFilter === 'tous' ? activeRisks : activeRisks.filter(r => r.axe_impacte === activeFilter);
    return base.slice(0, 6);
  }, [activeRisks, activeFilter]);

  return (
    <div>
      <SectionHeader
        title="Risques Majeurs"
        subtitle={`${totalActive} risques actifs au total`}
      />

      {/* ============ 4 KPI CARDS ============ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {distribution.map(cat => {
          const pct = totalActive > 0 ? Math.round((cat.count / totalActive) * 100) : 0;
          return (
            <div key={cat.label} style={{
              padding: '14px 16px', borderRadius: 10,
              backgroundColor: C.white, border: `1px solid ${C.gray200}`,
            }}>
              <div style={{ fontSize: 28, fontWeight: 600, color: cat.color }}>{cat.count}</div>
              <div style={{ fontSize: 12, color: C.gray600 }}>
                {cat.label} <span style={{ color: C.gray400 }}>({cat.threshold})</span>
              </div>
              <div style={{ fontSize: 11, color: cat.color, marginTop: 2 }}>{pct}% du total</div>
            </div>
          );
        })}
      </div>

      {/* ============ DISTRIBUTION BAR ============ */}
      <div style={{ marginBottom: 20, padding: '12px 16px', backgroundColor: C.white, borderRadius: 10, border: `1px solid ${C.gray200}` }}>
        <div style={{ fontSize: 11, color: C.gray500, marginBottom: 8 }}>Répartition des risques</div>
        <div style={{
          display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden',
          backgroundColor: C.gray200,
        }}>
          {distribution.map(cat => {
            const pct = totalActive > 0 ? (cat.count / totalActive) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div
                key={cat.label}
                style={{
                  width: `${pct}%`, backgroundColor: cat.color,
                  transition: 'width 0.5s',
                }}
                title={`${cat.label}: ${cat.count} (${Math.round(pct)}%)`}
              />
            );
          })}
        </div>
        {pctCritiqueMajeur > 0 && (
          <div style={{ fontSize: 11, color: C.red, marginTop: 8, fontWeight: 600 }}>
            {pctCritiqueMajeur}% des risques sont critiques ou majeurs
          </div>
        )}
      </div>

      {/* ============ FILTER TABS ============ */}
      {!printMode && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <FilterPill
            label="Tous"
            active={activeFilter === 'tous'}
            onClick={() => setActiveFilter('tous')}
          />
          {axeFilters.map(f => (
            <FilterPill
              key={f.dbCode}
              label={f.label}
              active={activeFilter === f.dbCode}
              onClick={() => setActiveFilter(f.dbCode)}
            />
          ))}
        </div>
      )}

      {/* ============ RISK CARDS ============ */}
      {filteredRisks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.gray400, fontSize: 13 }}>
          Aucun risque actif
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {filteredRisks.map((risk, i) => {
            const severity = getSeverityConfig(risk.score ?? 0);
            const axeCfg = AXES_V5.find(a => a.dbCode === risk.axe_impacte);
            const mitigation = getMitigation(risk as unknown as Record<string, unknown>);
            const prob = risk.probabilite_actuelle ?? 0;
            const impact = risk.impact_actuel ?? 0;

            return (
              <div
                key={risk.id_risque}
                style={{
                  padding: '10px 14px',
                  backgroundColor: C.white,
                  borderRadius: 8,
                  border: `1px solid ${C.gray200}`,
                }}
              >
                {/* Row 1: rank + title + score */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.gray400 }}>#{i + 1}</span>
                  <span style={{
                    flex: 1, fontSize: 12, fontWeight: 600, color: C.navy,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {risk.titre}
                  </span>
                  <span style={{
                    fontSize: 13, fontWeight: 600, color: severity.color,
                    minWidth: 22, textAlign: 'center',
                  }}>
                    {risk.score}
                  </span>
                </div>

                {/* Row 2: badges + P/I inline */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
                }}>
                  <span style={{
                    padding: '1px 6px', borderRadius: 3,
                    backgroundColor: severity.bg, color: severity.color,
                    fontSize: 9, fontWeight: 600, textTransform: 'uppercase',
                  }}>
                    {severity.label}
                  </span>
                  {axeCfg && (
                    <span style={{
                      padding: '1px 6px', borderRadius: 3,
                      backgroundColor: C.gray100, color: C.gray600,
                      fontSize: 9, fontWeight: 600,
                    }}>
                      {axeCfg.labelCourt}
                    </span>
                  )}
                  <span style={{ fontSize: 9, color: C.gray400, marginLeft: 'auto' }}>
                    P:{prob} · I:{impact}
                  </span>
                </div>

                {/* Row 3: mitigation (truncated) */}
                {mitigation && (
                  <div style={{
                    marginTop: 6, fontSize: 10, color: C.gray500, lineHeight: 1.3,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    <span style={{ fontWeight: 600, color: C.green }}>Mitigation : </span>
                    {mitigation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ScoreBlocks({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <span style={{
        fontSize: 9, fontWeight: 600, color: C.gray400,
        textTransform: 'uppercase', letterSpacing: '0.05em',
      }}>
        {label}
      </span>
      <div style={{ display: 'flex', gap: 2, marginTop: 3 }}>
        {[1, 2, 3, 4, 5].map(v => (
          <div key={v} style={{
            width: 16, height: 12, borderRadius: 2,
            backgroundColor: v <= value ? color : C.gray200,
          }} />
        ))}
      </div>
    </div>
  );
}

function FilterPill({ label, active, onClick }: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 16px', borderRadius: 99,
        border: `1px solid ${active ? C.navy : C.gray300}`,
        backgroundColor: active ? C.navy : C.white,
        color: active ? C.white : C.gray600,
        fontSize: 12, fontWeight: active ? 600 : 400,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}
