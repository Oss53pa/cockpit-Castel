import React from 'react';
import { C } from '../constants';
import { SectionHeader, SlideCard, ProgressBar } from '../components';
import type { ExcoV5Data } from '../hooks/useExcoV5Data';

interface Props { data: ExcoV5Data }

export function TrajectorySlide({ data }: Props) {
  const tempsEcoule = data.pourcentageTempsEcoule;
  const avancement = data.avancementGlobal;
  const ecart = Math.round(avancement - tempsEcoule);

  // Projections
  const projActuelle = tempsEcoule > 0 ? (avancement / tempsEcoule) * 100 : 0;
  const projX3 = Math.min(100, projActuelle * 3);
  const projX5 = Math.min(100, projActuelle * 5);

  // SVG chart dimensions
  const svgW = 600;
  const svgH = 180;
  const pad = { top: 16, right: 28, bottom: 56, left: 38 };
  const plotW = svgW - pad.left - pad.right;
  const plotH = svgH - pad.top - pad.bottom;

  const toX = (pct: number) => pad.left + (pct / 100) * plotW;
  const toY = (pct: number) => pad.top + plotH - (pct / 100) * plotH;

  const gridLines = [0, 25, 50, 75, 100];

  // Axes pour barres d'avancement (exclure divers)
  const axesBars = data.axesData.filter(a => a.id !== 'divers');

  return (
    <div>
      <SectionHeader
        title="Trajectoire Projet"
        subtitle="Prévu vs Réalisé — Projections multi-scénarios"
      />

      {/* ============ ALERTE BANNER ============ */}
      <div style={{
        padding: '10px 16px', borderRadius: 8, marginBottom: 12,
        backgroundColor: ecart >= 0 ? C.greenBg : C.redBg,
        border: `1px solid ${ecart >= 0 ? C.green : C.red}30`,
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: ecart >= 0 ? C.green : C.red }}>
          {ecart >= 0
            ? `Projet en avance : ${Math.round(avancement)}% d'avancement pour ${Math.round(tempsEcoule)}% du temps écoulé`
            : `Projection actuelle : seulement ${Math.round(projActuelle)}% d'avancement à l'ouverture`}
        </div>
        <div style={{ fontSize: 11, color: C.gray600, marginTop: 2 }}>
          {ecart >= 0
            ? 'Le projet progresse conformément au planning prévu.'
            : `Même avec ×5, le projet n'atteindrait que ${Math.round(projX5)}%. Soft opening à 80% inaccessible sans rattrapage majeur.`}
        </div>
      </div>

      {/* ============ CHART + KPIS ============ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 8 }}>
        {/* Chart — pleine largeur de sa carte */}
        <SlideCard style={{ padding: '4px 4px' }}>
          <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: 'block' }}>
            {/* Grid H */}
            {gridLines.map(v => (
              <g key={`g-${v}`}>
                <line x1={pad.left} y1={toY(v)} x2={pad.left + plotW} y2={toY(v)} stroke={C.gray200} strokeDasharray="3 3" strokeWidth={0.5} />
                {v < 100 && (
                  <text x={pad.left - 6} y={toY(v) + 3} textAnchor="end" style={{ fontSize: 5.5, fill: C.gray400 }}>{v}%</text>
                )}
              </g>
            ))}
            {/* X labels */}
            {gridLines.map(v => (
              v < 100 && <text key={`x-${v}`} x={toX(v)} y={svgH - 14} textAnchor="middle" style={{ fontSize: 5.5, fill: C.gray400 }}>{v}%</text>
            ))}
            {/* Axis titles */}
            <text x={svgW / 2} y={svgH - 2} textAnchor="middle" style={{ fontSize: 5.5, fill: C.gray500 }}>Temps écoulé</text>
            <text x={8} y={svgH / 2} textAnchor="middle" transform={`rotate(-90, 8, ${svgH / 2})`} style={{ fontSize: 5.5, fill: C.gray500 }}>Avancement</text>

            {/* Planned diagonal */}
            <line x1={toX(0)} y1={toY(0)} x2={toX(100)} y2={toY(100)} stroke={C.gray300} strokeWidth={1} strokeDasharray="6 3" />
            <text x={toX(85)} y={toY(88)} textAnchor="middle" style={{ fontSize: 5, fill: C.gray400 }}>Planifié</text>

            {/* Today vertical */}
            <line x1={toX(tempsEcoule)} y1={pad.top} x2={toX(tempsEcoule)} y2={toY(0)} stroke={C.navy} strokeWidth={0.5} strokeDasharray="3 2" opacity={0.4} />
            <text x={toX(tempsEcoule)} y={pad.top - 4} textAnchor="middle" style={{ fontSize: 5.5, fill: C.navy, fontWeight: 600 }}>Aujourd&apos;hui</text>

            {/* Projection ×5 (green dashed) */}
            <line x1={toX(tempsEcoule)} y1={toY(avancement)} x2={toX(100)} y2={toY(projX5)} stroke={C.green} strokeWidth={1} strokeDasharray="5 3" />
            <text x={toX(100) + 3} y={toY(projX5) + 3} style={{ fontSize: 5.5, fill: C.green, fontWeight: 600 }}>{Math.round(projX5)}%</text>

            {/* Projection ×3 (orange dashed) — label décalé si même position que ×5 */}
            <line x1={toX(tempsEcoule)} y1={toY(avancement)} x2={toX(100)} y2={toY(projX3)} stroke={C.orange} strokeWidth={1} strokeDasharray="4 2" />
            {Math.abs(projX3 - projX5) > 3 && (
              <text x={toX(100) + 3} y={toY(projX3) + 3} style={{ fontSize: 5.5, fill: C.orange, fontWeight: 600 }}>{Math.round(projX3)}%</text>
            )}

            {/* Actual line */}
            <line x1={toX(0)} y1={toY(0)} x2={toX(tempsEcoule)} y2={toY(avancement)} stroke={C.red} strokeWidth={1.5} />
            {/* Projection actuelle (red dashed) — label décalé si trop proche */}
            <line x1={toX(tempsEcoule)} y1={toY(avancement)} x2={toX(100)} y2={toY(projActuelle)} stroke={C.red} strokeWidth={1} strokeDasharray="4 2" />
            {Math.abs(projActuelle - projX3) > 3 && Math.abs(projActuelle - projX5) > 3 && (
              <text x={toX(100) + 3} y={toY(projActuelle) + 3} style={{ fontSize: 5.5, fill: C.red, fontWeight: 600 }}>{Math.round(projActuelle)}%</text>
            )}

            {/* Current point */}
            <circle cx={toX(tempsEcoule)} cy={toY(avancement)} r={3} fill={C.white} stroke={C.red} strokeWidth={1.5} />

            {/* Milestones on X axis */}
            {data.jalonsCles.map((j, i, arr) => {
              const samePrev = i > 0 && arr[i - 1].pctTemps === j.pctTemps;
              const yOffset = samePrev ? 16 : 10;
              // Couper le label en lignes de ~20 caractères max
              const words = j.label.split(' ');
              const lines: string[] = [];
              let current = '';
              for (const w of words) {
                if (current && (current + ' ' + w).length > 20) {
                  lines.push(current);
                  current = w;
                } else {
                  current = current ? current + ' ' + w : w;
                }
              }
              if (current) lines.push(current);
              return (
                <g key={i}>
                  {!samePrev && <circle cx={toX(j.pctTemps)} cy={toY(0) + 2} r={2} fill={j.atteint ? C.green : C.gray500} />}
                  <text x={toX(j.pctTemps)} y={toY(0) + yOffset} textAnchor="middle" style={{ fontSize: 4.5, fill: j.atteint ? C.green : C.gray500 }}>
                    {lines.map((line, li) => (
                      <tspan key={li} x={toX(j.pctTemps)} dy={li === 0 ? 0 : 5.5}>{line}</tspan>
                    ))}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 4, fontSize: 9 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 12, height: 2, backgroundColor: C.red, display: 'inline-block', borderRadius: 1 }} />
              <span style={{ color: C.gray500 }}>Actuelle → {Math.round(projActuelle)}%</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 12, height: 2, backgroundColor: C.orange, display: 'inline-block', borderRadius: 1 }} />
              <span style={{ color: C.gray500 }}>×3 → {Math.round(projX3)}%</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 12, height: 2, backgroundColor: C.green, display: 'inline-block', borderRadius: 1 }} />
              <span style={{ color: C.gray500 }}>×5 → {Math.round(projX5)}%</span>
            </span>
          </div>
        </SlideCard>

        {/* Indicateurs clés */}
        <SlideCard style={{ padding: '8px 10px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.gray400, textAlign: 'center', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Indicateurs clés
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <KpiBox label="TEMPS ÉCOULÉ" value={`${Math.round(tempsEcoule)}%`} color={C.purple} />
            <KpiBox label="AVANCEMENT" value={`${Math.round(avancement)}%`} color={C.blue} />
            <KpiBox label="ÉCART" value={`${ecart >= 0 ? '+' : ''}${ecart} pts`} color={ecart >= 0 ? C.green : C.red} />
            <KpiBox label="PROJ. ACTUELLE" value={`${Math.round(projActuelle)}%`} color={C.orange} />
            <KpiBox label="PROJ. ×3" value={`${Math.round(projX3)}%`} color={C.green} />
            <KpiBox label="PROJ. ×5" value={`${Math.round(projX5)}%`} color={C.teal} />
          </div>
        </SlideCard>
      </div>

      {/* ============ AVANCEMENT PAR AXE ============ */}
      <div style={{ marginTop: 16 }}>
        <SlideCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>Avancement par axe</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: C.gray500 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, backgroundColor: C.blue, borderRadius: 2, display: 'inline-block' }} /> Réel
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, backgroundColor: C.gray300, borderRadius: 2, display: 'inline-block' }} /> Cible
              </span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
            {axesBars.map(axe => (
              <div key={axe.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>{axe.labelCourt}</span>
                  <span style={{ fontSize: 11, color: C.gray500 }}>
                    {Math.round(axe.avancement)}% / {Math.round(axe.prevu)}%
                  </span>
                </div>
                <ProgressBar value={Math.round(axe.avancement)} target={Math.round(axe.prevu)} color={axe.color} height={8} showLabel={false} />
              </div>
            ))}
          </div>
        </SlideCard>
      </div>

      {/* ============ JALONS CLÉS ============ */}
      <div style={{ marginTop: 16 }}>
        <SlideCard>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 16 }}>
            Jalons clés
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            {/* Ligne horizontale */}
            <div style={{ position: 'absolute', top: 20, left: 30, right: 30, height: 2, backgroundColor: C.gray200 }} />

            {data.jalonsCles.map((j, i) => (
              <div key={i} style={{ textAlign: 'center', zIndex: 1, flex: 1, minWidth: 0, padding: '0 4px' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', margin: '0 auto 8px',
                  backgroundColor: j.atteint ? C.greenBg : C.gray100,
                  border: `2px solid ${j.atteint ? C.green : C.gray300}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 600, color: j.atteint ? C.green : C.gray400,
                }}>
                  {j.atteint ? '✓' : '—'}
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: C.navy, lineHeight: 1.3, overflowWrap: 'break-word', wordWrap: 'break-word' }}>{j.label}</div>
                <div style={{ fontSize: 9, color: C.gray500, marginTop: 2 }}>{j.pctTemps}% temps</div>
              </div>
            ))}
          </div>
        </SlideCard>
      </div>
    </div>
  );
}

function KpiBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '4px 8px', borderRadius: 6, backgroundColor: C.gray50,
    }}>
      <div style={{ fontSize: 9, fontWeight: 500, color: C.gray500, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color }}>{value}</div>
    </div>
  );
}
