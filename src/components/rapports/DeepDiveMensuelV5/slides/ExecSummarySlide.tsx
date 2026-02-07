import React from 'react';
import { C } from '../constants';
import { SectionHeader, SlideCard, Gauge } from '../components';
import type { DeepDiveV5Data, ExecSummaryMessage } from '../hooks/useDeepDiveV5Data';

interface Props { data: DeepDiveV5Data }

const TYPE_CONFIG: Record<ExecSummaryMessage['type'], { color: string; bg: string; icon: string; label: string }> = {
  alerte:  { color: C.red,    bg: C.redBg,    icon: '⚠️', label: 'ALERTE' },
  blocage: { color: C.orange, bg: C.orangeBg, icon: '🚧', label: 'BLOCAGE' },
  levier:  { color: C.green,  bg: C.greenBg,  icon: '✅', label: 'LEVIER' },
};

export function ExecSummarySlide({ data }: Props) {
  const score = data.confidenceScore?.score;
  const scoreColor = getScoreColor(score);

  const miniKpis = [
    { label: 'Avancement', value: `${Math.round(data.avancementGlobal)}%`, color: C.blue },
    { label: 'Cible Temps', value: `${Math.round(data.pourcentageTempsEcoule)}%`, color: C.gray500 },
    { label: 'Jalons Atteints', value: `${data.kpis.jalonsAtteints}/${data.kpis.jalonsTotal}`, color: C.green },
    { label: 'Risques Actifs', value: `${data.kpis.totalRisques}`, color: C.orange },
  ];

  return (
    <div>
      <SectionHeader
        title="Synthèse Exécutive"
        subtitle="3 messages clés pour la Direction Générale"
        icon="🎯"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
        {/* Colonne gauche: Score Santé + mini KPIs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Jauge Score Santé */}
          <SlideCard style={{ textAlign: 'center', padding: '24px 16px' }}>
            <Gauge
              value={score ?? 0}
              size={140}
              strokeWidth={12}
              color={scoreColor}
              label="Score Santé"
              showValue
            />
            <div style={{
              marginTop: 8,
              fontSize: 12,
              color: scoreColor,
              fontWeight: 600,
            }}>
              {score !== undefined
                ? score >= 80 ? 'Zone maîtrisée' : score >= 50 ? 'Vigilance requise' : 'Zone critique'
                : 'Non disponible'}
            </div>
          </SlideCard>

          {/* Mini KPIs en 2x2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {miniKpis.map((kpi, i) => (
              <div
                key={i}
                style={{
                  textAlign: 'center',
                  padding: '12px 6px',
                  backgroundColor: C.white,
                  borderRadius: 10,
                  border: `1px solid ${C.gray200}`,
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                <div style={{ fontSize: 10, color: C.gray500, marginTop: 2 }}>{kpi.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Colonne droite: 3 messages clés empilés */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {data.execSummary.map((msg, i) => {
            const cfg = TYPE_CONFIG[msg.type];
            return (
              <SlideCard key={i} accentColor={cfg.color} accentPosition="left" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  {/* Icône et badge */}
                  <div style={{ flexShrink: 0, paddingTop: 2 }}>
                    <div style={{
                      width: 40, height: 40,
                      borderRadius: 10,
                      backgroundColor: cfg.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20,
                    }}>
                      {cfg.icon}
                    </div>
                  </div>
                  {/* Contenu */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center',
                      padding: '2px 8px', borderRadius: 99,
                      backgroundColor: cfg.bg, color: cfg.color,
                      fontSize: 10, fontWeight: 700, marginBottom: 6,
                      letterSpacing: '0.05em',
                    }}>
                      {cfg.label}
                    </div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: '0 0 4px' }}>
                      {msg.title}
                    </h3>
                    <p style={{ fontSize: 12, color: C.gray600, margin: 0, lineHeight: 1.5 }}>
                      {msg.text}
                    </p>
                  </div>
                </div>
              </SlideCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getScoreColor(score: number | undefined): string {
  if (score === undefined) return C.gray400;
  if (score >= 80) return C.green;
  if (score >= 50) return C.orange;
  return C.red;
}
