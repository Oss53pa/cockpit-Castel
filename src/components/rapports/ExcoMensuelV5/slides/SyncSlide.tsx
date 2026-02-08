import React, { useMemo } from 'react';
import { C } from '../constants';
import { SectionHeader, Gauge } from '../components';
import type { ExcoV5Data, AxeData } from '../hooks/useExcoV5Data';
import { PROJET_CONFIG, SEUILS_SYNC_REPORT } from '@/data/constants';

interface Props { data: ExcoV5Data }

// 5 axes de mobilisation
const MOB_AXES = ['rh', 'commercial', 'budget', 'marketing', 'exploitation'];

export function SyncSlide({ data }: Props) {
  const sync = data.syncStatus;
  const ccPct = Math.round(sync?.projectProgress ?? 0);
  const mobPct = Math.round(sync?.mobilizationProgress ?? 0);
  const gap = Math.round(sync?.gap ?? 0);       // CC - MOB
  const ecartPts = mobPct - ccPct;               // MOB - CC pour l'affichage
  const alertLevel = sync?.alertLevel ?? 'GREEN';
  const isCritical = alertLevel === 'RED';
  const isWarning = alertLevel === 'ORANGE';
  const cible = Math.round(data.pourcentageTempsEcoule);

  // Détail mobilisation par axe
  const mobAxesData = useMemo(() =>
    MOB_AXES.map(id => data.axesData.find(a => a.id === id)).filter(Boolean) as AxeData[],
    [data.axesData]
  );

  // Scénarios de rattrapage (auto-calculés)
  const scenarios = useMemo(() => computeRattrapageScenarios(
    ccPct, mobPct, data.joursRestants
  ), [ccPct, mobPct, data.joursRestants]);

  // Risques liés à la désynchronisation (auto-générés)
  const desyncRisks = useMemo(() => generateDesyncRisks(ccPct, mobPct, ecartPts), [ccPct, mobPct, ecartPts]);

  // Alert message
  const alertMsg = ecartPts > 0
    ? { title: 'Désynchronisation critique : la mobilisation avance sans la construction',
        sub: 'Les équipes et locataires seront prêts avant que les locaux ne soient livrés. Risque de cash burn et de désengagement.' }
    : ecartPts < -5
    ? { title: 'La construction devance la mobilisation',
        sub: 'Les locaux seront livrés sans équipes ni locataires mobilisés. Risque de locaux vides à l\'ouverture.' }
    : { title: 'Construction et mobilisation synchronisées',
        sub: 'Les deux axes progressent de manière coordonnée.' };

  const alertColor = isCritical ? C.red : isWarning ? C.orange : C.green;

  return (
    <div>
      <SectionHeader
        title="Synchronisation Construction / Mobilisation"
        subtitle="CC vs moyenne pondérée des 5 axes de mobilisation"
      />

      {/* ============ Alert Banner ============ */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', borderRadius: 8, marginBottom: 16,
        backgroundColor: `${alertColor}12`, border: `1px solid ${alertColor}30`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: alertColor }}>!</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: alertColor }}>{alertMsg.title}</div>
            <div style={{ fontSize: 13, color: C.gray600, marginTop: 2 }}>{alertMsg.sub}</div>
          </div>
        </div>
        <div style={{
          padding: '10px 16px', borderRadius: 6,
          backgroundColor: C.navy, textAlign: 'center', flexShrink: 0,
          marginLeft: 14, color: C.white,
        }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>
            {ecartPts >= 0 ? '+' : ''}{ecartPts}
          </div>
          <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: 0.5, textTransform: 'uppercase', opacity: 0.7 }}>
            Pts Écart
          </div>
        </div>
      </div>

      {/* ============ Main Grid: 3 colonnes ============ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Col 1: Gauges + sync index */}
        <div style={{
          padding: 16, backgroundColor: C.white, borderRadius: 8,
          border: `1px solid ${C.gray200}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.gray500, textTransform: 'uppercase', marginBottom: 6 }}>
                Construction
              </div>
              <Gauge value={ccPct} size={90} color="#6366F1" />
              <div style={{ fontSize: 12, color: C.gray400, marginTop: 5 }}>
                Δ {data.syncSnapshots.length >= 2
                  ? `${ccPct - data.syncSnapshots[data.syncSnapshots.length - 2].cc >= 0 ? '+' : ''}${ccPct - data.syncSnapshots[data.syncSnapshots.length - 2].cc} pts`
                  : '—'}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.gray500, textTransform: 'uppercase', marginBottom: 6 }}>
                Mobilisation
              </div>
              <Gauge value={mobPct} size={90} color={C.green} />
              <div style={{ fontSize: 12, color: C.gray400, marginTop: 5 }}>
                Δ {data.syncSnapshots.length >= 2
                  ? `${mobPct - data.syncSnapshots[data.syncSnapshots.length - 2].mob >= 0 ? '+' : ''}${mobPct - data.syncSnapshots[data.syncSnapshots.length - 2].mob} pts`
                  : '—'}
              </div>
            </div>
          </div>
          {/* Sync index bar */}
          <div>
            <div style={{ fontSize: 12, color: C.gray500, marginBottom: 5 }}>Indice de synchronisation</div>
            <div style={{ position: 'relative', height: 8, backgroundColor: C.gray200, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min(mobPct, 100)}%`, backgroundColor: C.green, borderRadius: 4, zIndex: 2 }} />
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min(ccPct, 100)}%`, backgroundColor: '#6366F1', borderRadius: 4, zIndex: 3 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <div style={{ display: 'flex', gap: 10, fontSize: 11, color: C.gray400 }}>
                <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, backgroundColor: '#6366F1', marginRight: 4, verticalAlign: 'middle' }} />CC</span>
                <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, backgroundColor: C.green, marginRight: 4, verticalAlign: 'middle' }} />MOB</span>
              </div>
              <span style={{ fontSize: 11, color: C.gray400 }}>Cible {cible}%</span>
            </div>
          </div>
          {/* Détail mobilisation par axe */}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.gray100}` }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.gray400, textTransform: 'uppercase', marginBottom: 10 }}>Mobilisation par axe</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {mobAxesData.map(axe => (
                <div key={axe.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 13, color: C.gray600 }}>{axe.labelCourt}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{Math.round(axe.avancement)}%</span>
                  </div>
                  <div style={{ height: 6, backgroundColor: C.gray200, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(axe.avancement, 100)}%`, backgroundColor: axe.color, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${C.gray100}`, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: C.gray500, fontStyle: 'italic' }}>Moyenne</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>{mobPct}%</span>
            </div>
          </div>
        </div>

        {/* Col 2: Évolution chart */}
        <div style={{
          padding: 16, backgroundColor: C.white, borderRadius: 8,
          border: `1px solid ${C.gray200}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>Évolution de l'écart</div>
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: C.gray400, marginBottom: 10 }}>
            <span><span style={{ display: 'inline-block', width: 14, height: 3, backgroundColor: C.green, marginRight: 4, verticalAlign: 'middle' }} />MOB</span>
            <span><span style={{ display: 'inline-block', width: 14, height: 3, backgroundColor: C.gray400, marginRight: 4, verticalAlign: 'middle', borderTop: '2px dashed ' + C.gray400 }} />CC</span>
            <span><span style={{ display: 'inline-block', width: 14, height: 3, backgroundColor: C.orange, marginRight: 4, verticalAlign: 'middle' }} />Écart</span>
          </div>
          <EvolutionChart snapshots={data.syncSnapshots} ccPct={ccPct} mobPct={mobPct} />
        </div>

        {/* Col 3: Scénarios de rattrapage */}
        <div style={{
          padding: 16, backgroundColor: C.white, borderRadius: 8,
          border: `1px solid ${C.gray200}`,
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 12 }}>
            Scénarios de rattrapage
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {scenarios.map((s, i) => (
              <div key={i} style={{ padding: '10px 12px', borderRadius: 6, backgroundColor: C.gray50 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: s.isOptimal ? C.green : C.orange }}>{s.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.gray500 }}>CC {s.projCC}% / MOB {s.projMOB}%</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: C.gray400, width: 28 }}>CC</span>
                    <div style={{ flex: 1, height: 5, backgroundColor: C.gray200, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(Math.abs(s.projCC), 100)}%`, backgroundColor: '#6366F1', borderRadius: 3 }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: C.gray400, width: 28 }}>MOB</span>
                    <div style={{ flex: 1, height: 5, backgroundColor: C.gray200, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(Math.abs(s.projMOB), 100)}%`, backgroundColor: C.green, borderRadius: 3 }} />
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: C.gray500, fontStyle: 'italic' }}>{s.comment}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ Risques liés à la désynchronisation ============ */}
      {desyncRisks.length > 0 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 12 }}>
            Risques liés à la désynchronisation
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${desyncRisks.length}, 1fr)`, gap: 14 }}>
            {desyncRisks.map((r, i) => (
              <div key={i} style={{
                padding: '14px 16px', backgroundColor: C.white, borderRadius: 8,
                border: `1px solid ${C.gray200}`,
              }}>
                <span style={{
                  display: 'inline-block', fontSize: 11, fontWeight: 600,
                  padding: '3px 10px', borderRadius: 4, marginBottom: 8,
                  backgroundColor: r.severity === 'haute' ? C.redBg : C.orangeBg,
                  color: r.severity === 'haute' ? C.red : C.orange,
                  textTransform: 'uppercase',
                }}>
                  {r.severity}
                </span>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 5 }}>
                  {r.titre}
                </div>
                <div style={{ fontSize: 13, color: C.gray500 }}>{r.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Evolution Chart (SVG)
// ============================================================================

function EvolutionChart({ snapshots, ccPct, mobPct }: { snapshots: ExcoV5Data['syncSnapshots']; ccPct: number; mobPct: number }) {
  // Use real snapshots if available, else fallback to 2 points (6 months ago → now)
  const points = useMemo(() => {
    if (snapshots.length >= 2) return snapshots;
    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return [
      { date: sixMonthsAgo.toISOString().split('T')[0], cc: 0, mob: 0 },
      { date: now.toISOString().split('T')[0], cc: ccPct, mob: mobPct },
    ];
  }, [snapshots, ccPct, mobPct]);

  const labels = useMemo(() =>
    points.map(p => new Date(p.date).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })),
    [points]
  );

  const count = points.length;

  const W = 400;
  const H = 170;
  const padL = 32;
  const padR = 40;
  const padT = 12;
  const padB = 24;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const maxY = Math.max(20, ...points.map(p => Math.max(p.cc, p.mob))) + 5;

  const toX = (i: number) => padL + (i / Math.max(1, count - 1)) * chartW;
  const toY = (v: number) => padT + chartH - (v / maxY) * chartH;

  const mobPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(p.mob)}`).join(' ');
  const ccPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(p.cc)}`).join(' ');

  const yTicks = [0, Math.round(maxY / 2), maxY];

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      {/* Grid lines */}
      {yTicks.map(v => (
        <g key={v}>
          <line x1={padL} y1={toY(v)} x2={W - padR} y2={toY(v)} stroke={C.gray200} strokeWidth={0.5} />
          <text x={padL - 4} y={toY(v) + 3} textAnchor="end" style={{ fontSize: 11, fill: C.gray400 }}>{v}%</text>
        </g>
      ))}

      {/* X axis labels */}
      {labels.map((label, i) => (
        <text key={i} x={toX(i)} y={H - 4} textAnchor="middle" style={{ fontSize: 11, fill: C.gray400 }}>
          {label}
        </text>
      ))}

      {/* Construction line (dashed gray) */}
      <path d={ccPath} fill="none" stroke={C.gray400} strokeWidth={1.5} strokeDasharray="5 3" />
      {points.map((p, i) => (
        <circle key={`cc-${i}`} cx={toX(i)} cy={toY(p.cc)} r={3} fill={C.gray400} />
      ))}

      {/* Mobilisation line (solid green) */}
      <path d={mobPath} fill="none" stroke={C.green} strokeWidth={2} />
      {points.map((p, i) => (
        <circle key={`mob-${i}`} cx={toX(i)} cy={toY(p.mob)} r={3.5} fill={C.green} />
      ))}

      {/* End labels */}
      <text x={toX(count - 1) + 6} y={toY(points[count - 1].mob) + 4}
        style={{ fontSize: 12, fontWeight: 600, fill: C.green }}>{points[count - 1].mob}%</text>
      <text x={toX(count - 1) + 6} y={toY(points[count - 1].cc) + 4}
        style={{ fontSize: 12, fontWeight: 600, fill: C.gray400 }}>{points[count - 1].cc}%</text>
    </svg>
  );
}

// ============================================================================
// Scénarios de rattrapage
// ============================================================================

interface RattrapageScenario {
  label: string;
  projCC: number;
  projMOB: number;
  comment: string;
  isOptimal: boolean;
}

function computeRattrapageScenarios(ccPct: number, mobPct: number, joursRestants: number): RattrapageScenario[] {
  // Vitesse théorique CC = 100% en joursRestants
  const ccSpeed = (v: number, joursDispos: number) => Math.min(100, v + Math.round(((100 - v) * joursDispos) / Math.max(1, joursRestants)));
  const mobSpeed = (joursDispos: number) => Math.min(100, mobPct + Math.round(((100 - mobPct) * joursDispos) / Math.max(1, joursRestants)));

  return [
    {
      label: 'CC démarre mars',
      projCC: ccSpeed(ccPct, Math.max(0, joursRestants - 60)),
      projMOB: mobSpeed(joursRestants),
      comment: 'Retard soft opening probable',
      isOptimal: false,
    },
    {
      label: 'CC démarre mai',
      projCC: ccSpeed(ccPct, Math.max(0, joursRestants - 120)),
      projMOB: mobSpeed(joursRestants),
      comment: 'Équipes prêtes sans locaux = cash burn',
      isOptimal: false,
    },
    {
      label: 'CC démarre maintenant',
      projCC: ccSpeed(ccPct, joursRestants),
      projMOB: mobSpeed(joursRestants),
      comment: 'Scénario optimal — synchronisation possible',
      isOptimal: true,
    },
  ];
}

// ============================================================================
// Risques liés à la désynchronisation
// ============================================================================

interface DesyncRisk {
  severity: 'haute' | 'moyenne';
  titre: string;
  description: string;
}

function generateDesyncRisks(ccPct: number, mobPct: number, ecart: number): DesyncRisk[] {
  const risks: DesyncRisk[] = [];
  const absEcart = Math.abs(ecart);

  if (absEcart < SEUILS_SYNC_REPORT.desyncAlerte) return []; // Pas de risque si synchronisé

  if (mobPct > ccPct) {
    // Mobilisation devance la construction
    risks.push({
      severity: 'haute',
      titre: 'Équipes recrutées sans locaux disponibles',
      description: `Cash burn estimé ${Math.round(PROJET_CONFIG.coutsReportMensuels.portage / 1e6)}M/mois`,
    });
    risks.push({
      severity: 'moyenne',
      titre: 'Locataires en attente de fit-out',
      description: 'Désengagement ou renégociation BEFA',
    });
    risks.push({
      severity: absEcart > 15 ? 'haute' : 'moyenne',
      titre: 'Perte de crédibilité calendrier',
      description: `Signal négatif marché immobilier ${PROJET_CONFIG.nom}`,
    });
  } else {
    // Construction devance la mobilisation
    risks.push({
      severity: 'haute',
      titre: 'Locaux livrés sans équipes mobilisées',
      description: 'Coûts de gardiennage et maintenance à vide',
    });
    risks.push({
      severity: 'moyenne',
      titre: 'Retard de commercialisation',
      description: 'Perte de revenus locatifs estimée',
    });
    risks.push({
      severity: absEcart > 15 ? 'haute' : 'moyenne',
      titre: 'Image de projet inachevé',
      description: 'Impact sur attractivité commerciale',
    });
  }

  return risks;
}
