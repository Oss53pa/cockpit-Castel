/**
 * WeeklyReportV2 — Rapport Hebdomadaire Professionnel
 * Design unifié avec le design system COSMOS (constantes C)
 * Données 100% live via useWeeklyReportData
 */

import React, { useRef, useState, useCallback } from 'react';
import { C, AXES_V5, METEO_CONFIG } from '@/components/rapports/ExcoMensuelV5/constants';
import type { MeteoLevel } from '@/components/rapports/ExcoMensuelV5/constants';
import { SendReportModal } from '@/components/rapports/ExcoMensuelV5/SendReportModal';
import { useWeeklyReportData } from './useWeeklyReportData';
import type {
  WeeklyHighlight,
  AxeWeeklyData,
  MilestonePreview,
  TopRisque,
  WeeklyProjection,
} from './useWeeklyReportData';
import type { Action, Risque } from '@/types';

/** Round to max 2 decimal places */
const f2 = (v: number) => Math.round(v * 100) / 100;

// ============================================================================
// MICRO-COMPOSANTS INTERNES
// ============================================================================

/** Card wrapper */
function WCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: C.white,
        borderRadius: 10,
        border: `1px solid ${C.gray200}`,
        padding: 20,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Section with title */
function WSection({
  title,
  number,
  children,
  style,
}: {
  title: string;
  number: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ marginBottom: 28, ...style }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 16,
          borderBottom: `2px solid ${C.gold}`,
          paddingBottom: 8,
        }}
      >
        <span
          style={{
            background: C.navy,
            color: C.white,
            borderRadius: '50%',
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {number}
        </span>
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: C.navy,
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

/** Progress bar */
function WProgressBar({
  value,
  target,
  color,
  height = 8,
}: {
  value: number;
  target?: number;
  color: string;
  height?: number;
}) {
  return (
    <div
      style={{
        position: 'relative',
        height,
        background: C.gray200,
        borderRadius: height / 2,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: color,
          borderRadius: height / 2,
          transition: 'width 0.5s ease',
        }}
      />
      {target !== undefined && (
        <div
          style={{
            position: 'absolute',
            left: `${Math.min(100, Math.max(0, target))}%`,
            top: 0,
            bottom: 0,
            width: 2,
            background: C.navy,
            opacity: 0.5,
          }}
        />
      )}
    </div>
  );
}

/** KPI card */
function WKpiCard({
  label,
  value,
  suffix,
  trend,
  color,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  trend?: 'up' | 'down' | 'stable' | null;
  color: string;
}) {
  const trendIcon = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—';
  const trendColor = trend === 'up' ? C.green : trend === 'down' ? C.red : C.gray400;

  return (
    <WCard
      style={{
        flex: 1,
        minWidth: 140,
        borderTop: `3px solid ${color}`,
        padding: '16px 14px',
      }}
    >
      <div style={{ fontSize: 11, color: C.gray500, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: C.navy }}>{value}</span>
        {suffix && <span style={{ fontSize: 13, color: C.gray500 }}>{suffix}</span>}
        {trend && (
          <span style={{ fontSize: 13, color: trendColor, marginLeft: 6 }}>{trendIcon}</span>
        )}
      </div>
    </WCard>
  );
}

/** Meteo badge */
function WMeteoBadge({ level }: { level: MeteoLevel }) {
  const cfg = METEO_CONFIG[level];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 12px',
        borderRadius: 20,
        background: cfg.bgColor,
        color: cfg.color,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {cfg.emoji} {cfg.label}
    </span>
  );
}

/** Trend badge — indique l'écart vs progression théorique (pas une variation temporelle) */
function WTrendBadge({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  const color = trend === 'up' ? C.green : trend === 'down' ? C.red : C.gray400;
  const label = trend === 'up' ? '▲ En avance' : trend === 'down' ? '▼ En retard' : '— Dans les temps';
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color }}>{label}</span>
  );
}

/** Status dot */
function WStatusDot({ color }: { color: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }}
    />
  );
}

/** Risk badge (score) */
function WRiskBadge({ score }: { score: number }) {
  let bg = C.greenBg;
  let color = C.green;
  if (score >= 16) {
    bg = C.redBg;
    color = C.red;
  } else if (score >= 10) {
    bg = C.orangeBg;
    color = C.orange;
  } else if (score >= 5) {
    bg = '#fffde7';
    color = '#f9a825';
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 30,
        padding: '2px 8px',
        borderRadius: 12,
        background: bg,
        color,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {score}
    </span>
  );
}

/** SVG Trend Chart (real vs ideal) */
function WTrendChart({
  data,
}: {
  data: { semaine: number; reel: number; ideal: number }[];
}) {
  if (data.length < 2) return null;
  const W = 460;
  const H = 100;
  const pad = { top: 10, right: 10, bottom: 20, left: 35 };
  const iW = W - pad.left - pad.right;
  const iH = H - pad.top - pad.bottom;

  const maxY = Math.max(100, ...data.map((d) => Math.max(d.reel, d.ideal)));
  const xScale = (i: number) => pad.left + (i / (data.length - 1)) * iW;
  const yScale = (v: number) => pad.top + iH - (v / maxY) * iH;

  const pathReal = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(d.reel)}`).join(' ');
  const pathIdeal = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(d.ideal)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W }}>
      {/* Grid */}
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line
            x1={pad.left}
            y1={yScale(v)}
            x2={W - pad.right}
            y2={yScale(v)}
            stroke={C.gray200}
            strokeDasharray="3,3"
          />
          <text x={pad.left - 4} y={yScale(v) + 3} textAnchor="end" fontSize={8} fill={C.gray400}>
            {v}%
          </text>
        </g>
      ))}
      {/* Ideal */}
      <path d={pathIdeal} fill="none" stroke={C.gray300} strokeWidth={1.5} strokeDasharray="4,3" />
      {/* Real */}
      <path d={pathReal} fill="none" stroke={C.gold} strokeWidth={2.5} />
      {/* Dot on last point */}
      {data.length > 0 && (
        <circle cx={xScale(data.length - 1)} cy={yScale(data[data.length - 1].reel)} r={4} fill={C.gold} />
      )}
      {/* Legend */}
      <line x1={pad.left} y1={H - 4} x2={pad.left + 20} y2={H - 4} stroke={C.gold} strokeWidth={2} />
      <text x={pad.left + 24} y={H - 1} fontSize={8} fill={C.gray500}>
        Réel
      </text>
      <line
        x1={pad.left + 60}
        y1={H - 4}
        x2={pad.left + 80}
        y2={H - 4}
        stroke={C.gray300}
        strokeWidth={1.5}
        strokeDasharray="4,3"
      />
      <text x={pad.left + 84} y={H - 1} fontSize={8} fill={C.gray500}>
        Idéal
      </text>
    </svg>
  );
}

/** Mini inline spark chart */
function WMiniChart({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
      <div style={{ flex: 1, height: 6, background: C.gray200, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: C.navy, minWidth: 36 }}>
        {Math.round(value)}%
      </span>
    </div>
  );
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function WeeklyReportV2() {
  const data = useWeeklyReportData();
  const reportRef = useRef<HTMLDivElement>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const presentationDate = new Date().toISOString().split('T')[0];

  const generateReportHtml = useCallback(() => {
    if (!reportRef.current) return '';
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Rapport Hebdomadaire - ${data.projectName} - S${data.weekNumber}</title>
<style>@import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;500;600;700&display=swap');body{font-family:'Exo 2',Inter,system-ui,sans-serif;margin:0;padding:24px;background:#f8f9fa;}
@media print{body{padding:0;background:#fff;}}</style>
</head><body>${reportRef.current.innerHTML}</body></html>`;
  }, [data.projectName, data.weekNumber]);

  if (data.isLoading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: C.gray400 }}>
        Chargement du rapport hebdomadaire...
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const prioriteColor = (p: string) => {
    if (p === 'critique') return C.red;
    if (p === 'haute') return C.orange;
    if (p === 'moyenne') return C.gold;
    return C.gray400;
  };

  const formatDate = (d: string) => {
    if (!d) return '—';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  const formatBudget = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n.toFixed(0);
  };

  return (
    <div
      ref={reportRef}
      style={{
        maxWidth: 900,
        margin: '0 auto',
        fontFamily: "'Exo 2', Inter, system-ui, sans-serif",
        color: C.navy,
        background: C.offWhite,
        padding: 24,
      }}
    >
      {/* ================================================================ */}
      {/* 1. HEADER */}
      {/* ================================================================ */}
      <div
        style={{
          background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyLight} 100%)`,
          borderRadius: 12,
          padding: '28px 32px',
          marginBottom: 24,
          color: C.white,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: C.goldLight, fontWeight: 700, marginBottom: 4 }}>
              Rapport Hebdomadaire
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>
              {data.projectName}
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
              Semaine {data.weekNumber} — {data.periodLabel}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handlePrint}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: C.white,
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              PDF / Imprimer
            </button>
            <button
              onClick={() => setShowSendModal(true)}
              style={{
                background: C.gold,
                border: 'none',
                color: C.navy,
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Envoyer
            </button>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 24,
            marginTop: 16,
            fontSize: 13,
            color: 'rgba(255,255,255,0.8)',
          }}
        >
          <span>J-{data.joursRestants} avant ouverture</span>
          <span>Cible : {formatDate(data.openingDate)}</span>
          <span>
            <WMeteoBadge level={data.meteo} />
          </span>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 2. METEO BANNER */}
      {/* ================================================================ */}
      {(() => {
        const cfg = METEO_CONFIG[data.meteo];
        return (
          <div
            style={{
              background: cfg.bgColor,
              border: `1px solid ${cfg.color}`,
              borderRadius: 10,
              padding: '14px 20px',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 20 }}>{cfg.emoji}</span>
            <div>
              <div style={{ fontWeight: 700, color: cfg.color, fontSize: 14 }}>{cfg.label}</div>
              <div style={{ fontSize: 13, color: C.navy, opacity: 0.8 }}>{data.weatherSummary}</div>
            </div>
          </div>
        );
      })()}

      {/* ================================================================ */}
      {/* 3. KPIs */}
      {/* ================================================================ */}
      <WSection title="Indicateurs clés" number={1}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <WKpiCard
            label="Avancement"
            value={Math.round(data.avancementGlobal)}
            suffix="%"
            trend={data.trends?.avancementProjet?.direction}
            color={C.gold}
          />
          <WKpiCard
            label="Actions"
            value={`${data.kpis.actionsTerminees}/${data.kpis.totalActions}`}
            trend={null}
            color={C.blue}
          />
          <WKpiCard
            label="Jalons"
            value={`${data.kpis.jalonsAtteints}/${data.kpis.jalonsTotal}`}
            trend={data.trends?.jalons?.direction}
            color={C.purple}
          />
          <WKpiCard
            label="Budget"
            value={formatBudget(data.budgetSynthese.realise)}
            suffix={`/ ${formatBudget(data.budgetSynthese.prevu)}`}
            trend={data.trends?.budget?.direction}
            color={C.green}
          />
        </div>
      </WSection>

      {/* ================================================================ */}
      {/* 4. COURBE + SYNC */}
      {/* ================================================================ */}
      <WSection title="Trajectoire & Synchronisation" number={2}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {/* Trend chart */}
          <WCard style={{ flex: 2, minWidth: 300 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.gray500, marginBottom: 8 }}>
              Progression Réel vs Idéal
            </div>
            <WTrendChart data={data.trendHistory} />
          </WCard>
          {/* Sync */}
          <WCard style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.gray500, marginBottom: 12 }}>
              Construction vs Mobilisation
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span>{data.comparaisonAxes.technique.label}</span>
                <span style={{ fontWeight: 700 }}>{f2(data.comparaisonAxes.technique.avancement)}%</span>
              </div>
              <WProgressBar value={data.comparaisonAxes.technique.avancement} color={C.orange} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span>{data.comparaisonAxes.commercial.label}</span>
                <span style={{ fontWeight: 700 }}>{f2(data.comparaisonAxes.commercial.avancement)}%</span>
              </div>
              <WProgressBar value={data.comparaisonAxes.commercial.avancement} color={C.blue} />
            </div>
            <div
              style={{
                textAlign: 'center',
                padding: '8px 0',
                borderTop: `1px solid ${C.gray200}`,
                marginTop: 8,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: data.comparaisonAxes.estSynchronise ? C.green : C.orange,
                }}
              >
                {data.comparaisonAxes.estSynchronise
                  ? '● Synchronisé'
                  : `● Écart ${data.comparaisonAxes.ecart > 0 ? '+' : ''}${f2(data.comparaisonAxes.ecart)} pts`}
              </span>
            </div>
          </WCard>
        </div>
      </WSection>

      {/* ================================================================ */}
      {/* 5. FAITS MARQUANTS */}
      {/* ================================================================ */}
      <WSection title="Faits marquants de la semaine" number={3}>
        <WCard>
          {data.highlights.length === 0 ? (
            <div style={{ color: C.gray400, fontSize: 13 }}>Aucun fait marquant cette semaine.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.highlights.map((h, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <WStatusDot
                    color={h.type === 'done' ? C.green : h.type === 'alert' ? C.red : C.blue}
                  />
                  <span style={{ fontSize: 13, lineHeight: 1.5 }}>{h.text}</span>
                </div>
              ))}
            </div>
          )}
        </WCard>
      </WSection>

      {/* ================================================================ */}
      {/* 6. DECISIONS & ARBITRAGES */}
      {/* ================================================================ */}
      {data.pendingDecisions.length > 0 && (
        <WSection title="Décisions & Arbitrages en attente" number={4}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {data.pendingDecisions.slice(0, 4).map((a) => (
              <WCard
                key={a.id}
                style={{
                  flex: '1 1 200px',
                  borderLeft: `3px solid ${prioriteColor(a.priorite)}`,
                  padding: '14px 16px',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 4 }}>
                  {a.titre}
                </div>
                <div style={{ fontSize: 12, color: C.gray500, marginBottom: 6 }}>
                  Axe : {AXES_V5.find((ax) => ax.dbCode === a.axe)?.labelCourt ?? a.axe}
                </div>
                {a.decisions_attendues && (
                  <div style={{ fontSize: 12, color: C.navy, background: C.gray50, padding: '6px 8px', borderRadius: 6 }}>
                    {a.decisions_attendues.slice(0, 2).map((d, i) => (
                      <div key={i} style={{ marginBottom: 2 }}>
                        • {typeof d === 'string' ? d : (d as { description?: string }).description ?? ''}
                      </div>
                    ))}
                  </div>
                )}
              </WCard>
            ))}
          </div>
        </WSection>
      )}

      {/* ================================================================ */}
      {/* 7. AVANCEMENT PAR AXE */}
      {/* ================================================================ */}
      <WSection title="Avancement par axe" number={data.pendingDecisions.length > 0 ? 5 : 4}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {data.axesData.map((axe) => (
            <WCard key={axe.id} style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <WStatusDot color={axe.color} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>{axe.labelCourt}</span>
                </div>
                <WTrendBadge trend={axe.tendance} />
              </div>
              <WProgressBar value={axe.avancement} target={axe.prevu} color={axe.color} height={6} />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 11,
                  color: C.gray500,
                  marginTop: 4,
                }}
              >
                <span>{Math.round(axe.avancement)}%</span>
                <span>Prévu {Math.round(axe.prevu)}%</span>
              </div>
              <div style={{ fontSize: 11, color: C.gray500, marginTop: 8 }}>
                {axe.actionsTerminees}/{axe.actionsTotal} actions
                {axe.actionsEnRetard > 0 && (
                  <span style={{ color: C.red, marginLeft: 6 }}>
                    ({axe.actionsEnRetard} retard{axe.actionsEnRetard > 1 ? 's' : ''})
                  </span>
                )}
              </div>
              {axe.topRisque && (
                <div style={{ fontSize: 11, color: C.orange, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Risque: <WRiskBadge score={axe.topRisque.score ?? 0} />
                </div>
              )}
              {axe.prochainJalon && (
                <div style={{ fontSize: 10, color: C.gray400, marginTop: 4 }}>
                  Prochain : {axe.prochainJalon.titre.slice(0, 30)}{axe.prochainJalon.titre.length > 30 ? '…' : ''} ({formatDate(axe.prochainJalon.date_prevue)})
                </div>
              )}
            </WCard>
          ))}
        </div>
      </WSection>

      {/* ================================================================ */}
      {/* 8. PROCHAINS JALONS 14j */}
      {/* ================================================================ */}
      <WSection title="Prochains jalons (14 jours)" number={data.pendingDecisions.length > 0 ? 6 : 5}>
        {data.prochainsMilestones.length === 0 ? (
          <WCard>
            <div style={{ color: C.gray400, fontSize: 13 }}>Aucun jalon prévu dans les 14 prochains jours.</div>
          </WCard>
        ) : (
          <WCard style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.gray50 }}>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 600, color: C.gray500, fontSize: 11 }}>
                    Jalon
                  </th>
                  <th style={{ textAlign: 'center', padding: '10px 14px', fontWeight: 600, color: C.gray500, fontSize: 11 }}>
                    Échéance
                  </th>
                  <th style={{ textAlign: 'center', padding: '10px 14px', fontWeight: 600, color: C.gray500, fontSize: 11, minWidth: 60 }}>
                    J-
                  </th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 600, color: C.gray500, fontSize: 11, minWidth: 140 }}>
                    Prérequis
                  </th>
                  <th style={{ textAlign: 'center', padding: '10px 14px', fontWeight: 600, color: C.gray500, fontSize: 11 }}>
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.prochainsMilestones.map((m, i) => {
                  const statusColor =
                    m.prerequisPct >= 80 ? C.green : m.prerequisPct >= 50 ? C.orange : C.red;
                  return (
                    <tr key={m.jalon.id ?? i} style={{ borderTop: `1px solid ${C.gray200}` }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 600, color: C.navy }}>{m.jalon.titre}</div>
                        <div style={{ fontSize: 11, color: C.gray400 }}>
                          {AXES_V5.find((ax) => ax.dbCode === m.jalon.axe)?.labelCourt ?? ''}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', padding: '10px 14px' }}>
                        {formatDate(m.jalon.date_prevue)}
                      </td>
                      <td style={{ textAlign: 'center', padding: '10px 14px', fontWeight: 700, color: m.joursRestants <= 3 ? C.red : C.navy }}>
                        {m.joursRestants}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <WMiniChart value={m.prerequisPct} color={statusColor} />
                      </td>
                      <td style={{ textAlign: 'center', padding: '10px 14px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 600,
                            background: statusColor === C.green ? C.greenBg : statusColor === C.orange ? C.orangeBg : C.redBg,
                            color: statusColor,
                          }}
                        >
                          {m.prerequisPct >= 80 ? 'En bonne voie' : m.prerequisPct >= 50 ? 'Vigilance' : 'Critique'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </WCard>
        )}
      </WSection>

      {/* ================================================================ */}
      {/* 9. TOP 5 RISQUES */}
      {/* ================================================================ */}
      <WSection title="Top 5 risques actifs" number={data.pendingDecisions.length > 0 ? 7 : 6}>
        {data.topRisques.length === 0 ? (
          <WCard>
            <div style={{ color: C.gray400, fontSize: 13 }}>Aucun risque actif identifié.</div>
          </WCard>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.topRisques.map((tr, i) => {
              const r = tr.risque;
              return (
                <WCard key={r.id ?? i} style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <WRiskBadge score={r.score ?? 0} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{r.titre}</div>
                      <div style={{ fontSize: 11, color: C.gray500, marginTop: 2 }}>
                        P{r.probabilite ?? '?'} × I{r.impact ?? '?'} — {AXES_V5.find((ax) => ax.dbCode === r.axe_impacte)?.label ?? r.axe_impacte}
                      </div>
                    </div>
                    <WTrendBadge trend={tr.evolution} />
                  </div>
                  {r.mesures_attenuation && (
                    <div
                      style={{
                        fontSize: 12,
                        color: C.gray600,
                        marginTop: 8,
                        padding: '6px 10px',
                        background: C.gray50,
                        borderRadius: 6,
                        borderLeft: `3px solid ${C.gold}`,
                      }}
                    >
                      Mitigation : {r.mesures_attenuation.slice(0, 120)}{r.mesures_attenuation.length > 120 ? '…' : ''}
                    </div>
                  )}
                </WCard>
              );
            })}
          </div>
        )}
      </WSection>

      {/* ================================================================ */}
      {/* 10. FOCUS S+1 */}
      {/* ================================================================ */}
      <WSection title="Focus semaine prochaine" number={data.pendingDecisions.length > 0 ? 8 : 7}>
        {data.focusSemaineProchaine.length === 0 ? (
          <WCard>
            <div style={{ color: C.gray400, fontSize: 13 }}>Aucune action prioritaire identifiée pour la semaine prochaine.</div>
          </WCard>
        ) : (
          <WCard style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {data.focusSemaineProchaine.map((a, i) => (
                <div
                  key={a.id ?? i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '6px 0',
                    borderBottom: i < data.focusSemaineProchaine.length - 1 ? `1px solid ${C.gray100}` : 'none',
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: C.navy,
                      color: C.white,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{a.titre}</span>
                    <span style={{ fontSize: 11, color: C.gray400, marginLeft: 8 }}>
                      {AXES_V5.find((ax) => ax.dbCode === a.axe)?.labelCourt ?? ''}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 10,
                      background: prioriteColor(a.priorite) + '22',
                      color: prioriteColor(a.priorite),
                    }}
                  >
                    {a.priorite}
                  </span>
                  <span style={{ fontSize: 11, color: C.gray400, minWidth: 70, textAlign: 'right' }}>
                    {formatDate(a.date_fin_prevue)}
                  </span>
                </div>
              ))}
            </div>
          </WCard>
        )}
      </WSection>

      {/* ================================================================ */}
      {/* 11. PROJECTION */}
      {/* ================================================================ */}
      <WSection title="Projection" number={data.pendingDecisions.length > 0 ? 9 : 8}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <WCard style={{ flex: 1, minWidth: 140, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: C.gray500, fontWeight: 600, marginBottom: 4 }}>RATIO PROGRESSION</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.navy }}>{f2(data.projection.ratioProgression)}%</div>
          </WCard>
          <WCard style={{ flex: 1, minWidth: 140, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: C.gray500, fontWeight: 600, marginBottom: 4 }}>FIN ESTIMÉE</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: !data.projection.projectionDisponible ? C.gray400 : data.projection.retardJours > 0 ? C.red : C.green }}>
              {data.projection.projectionDisponible && data.projection.finEstimee
                ? formatDate(data.projection.finEstimee)
                : 'Trop tôt pour projeter'}
            </div>
          </WCard>
          <WCard style={{ flex: 1, minWidth: 140, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: C.gray500, fontWeight: 600, marginBottom: 4 }}>CIBLE</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>
              {formatDate(data.projection.cible)}
            </div>
          </WCard>
          <WCard style={{ flex: 1, minWidth: 140, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: C.gray500, fontWeight: 600, marginBottom: 4 }}>RETARD PROJETÉ</div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: !data.projection.projectionDisponible ? C.gray400 : data.projection.retardJours > 0 ? C.red : C.green,
              }}
            >
              {!data.projection.projectionDisponible
                ? '—'
                : data.projection.retardJours > 0
                  ? `+${data.projection.retardJours}j`
                  : 'A l\'heure'}
            </div>
          </WCard>
        </div>
      </WSection>

      {/* ================================================================ */}
      {/* 12. PROPH3T IA */}
      {/* ================================================================ */}
      {data.confidenceScore && (
        <WSection title="PROPH3T — Score de Confiance" number={data.pendingDecisions.length > 0 ? 10 : 9}>
          <WCard
            style={{
              borderLeft: `4px solid ${
                data.confidenceScore.status === 'vert'
                  ? C.green
                  : data.confidenceScore.status === 'jaune'
                    ? C.orange
                    : C.red
              }`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: 800,
                    color:
                      data.confidenceScore.status === 'vert'
                        ? C.green
                        : data.confidenceScore.status === 'jaune'
                          ? C.orange
                          : C.red,
                  }}
                >
                  {data.confidenceScore.score}
                </div>
                <div style={{ fontSize: 11, color: C.gray500 }}>/ 100</div>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 8 }}>
                  Facteurs de confiance
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 12 }}>
                  <div>Vélocité: <strong>{f2(data.confidenceScore.factors.velocite.value)}%</strong></div>
                  <div>Jalons: <strong>{f2(data.confidenceScore.factors.jalons.value)}%</strong></div>
                  <div>Risques: <strong>{f2(data.confidenceScore.factors.risques.value)}%</strong></div>
                  <div>Occupation: <strong>{f2(data.confidenceScore.factors.occupation.value)}%</strong></div>
                  <div>Budget: <strong>{f2(data.confidenceScore.factors.budget.value)}%</strong></div>
                  <div>Sync: <strong>{f2(data.confidenceScore.factors.sync.value)}%</strong></div>
                </div>
              </div>
              <div>
                <WTrendBadge trend={data.confidenceScore.trend} />
                <div style={{ fontSize: 11, color: C.gray400, marginTop: 4 }}>
                  J-{data.confidenceScore.daysToOpening}
                </div>
              </div>
            </div>
            {data.confidenceScore.insufficientData && (
              <div
                style={{
                  marginTop: 12,
                  padding: '8px 12px',
                  background: C.orangeBg,
                  borderRadius: 6,
                  fontSize: 12,
                  color: C.orange,
                }}
              >
                Données insuffisantes pour un score fiable. Le score affiché est indicatif.
              </div>
            )}
          </WCard>
        </WSection>
      )}

      {/* ================================================================ */}
      {/* 13. NOTES */}
      {/* ================================================================ */}
      <WSection title="Notes & commentaires" number={data.pendingDecisions.length > 0 ? 11 : 10}>
        <WCard>
          <textarea
            value={data.notes}
            onChange={(e) => data.setNotes(e.target.value)}
            placeholder="Ajoutez vos notes pour cette semaine..."
            style={{
              width: '100%',
              minHeight: 80,
              border: `1px solid ${C.gray200}`,
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              fontFamily: 'inherit',
              color: C.navy,
              resize: 'vertical',
              outline: 'none',
            }}
          />
        </WCard>
      </WSection>

      {/* ================================================================ */}
      {/* FOOTER */}
      {/* ================================================================ */}
      <div
        style={{
          textAlign: 'center',
          padding: '16px 0',
          borderTop: `1px solid ${C.gray200}`,
          fontSize: 11,
          color: C.gray400,
        }}
      >
        Rapport généré le{' '}
        {new Date().toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
        {' '}— Document confidentiel — {data.projectName}
      </div>

      {/* Send Report Modal */}
      <SendReportModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        presentationDate={presentationDate}
        generateHtml={generateReportHtml}
      />
    </div>
  );
}
