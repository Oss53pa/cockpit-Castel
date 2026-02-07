import React from 'react';
import { C, METEO_CONFIG, type MeteoLevel } from '../constants';
import { SectionHeader, SlideCard, Gauge, WeatherIcon } from '../components';
import type { ExcoV5Data } from '../hooks/useExcoV5Data';
import { PROJET_CONFIG, SEUILS_KPI_REPORT } from '@/data/constants';

interface Props { data: ExcoV5Data }

const FACTOR_LABELS: Record<string, string> = {
  velocite: 'Vélocité',
  jalons: 'Jalons',
  risques: 'Risques',
  occupation: 'Occupation',
  budget: 'Budget',
  sync: 'Synchronisation',
};

function getKpiColor(value: number, cible: number): string {
  if (cible <= 0) return C.gray500;
  const ratio = value / cible;
  if (ratio >= SEUILS_KPI_REPORT.goodRatio) return C.green;
  if (ratio >= SEUILS_KPI_REPORT.medRatio) return C.orange;
  return C.red;
}

function deriveKpiMeteo(value: number, cible: number): MeteoLevel {
  const ecart = value - cible;
  if (ecart >= SEUILS_KPI_REPORT.deviationGood) return 'bleu';
  if (ecart >= -SEUILS_KPI_REPORT.deviationGood) return 'vert';
  if (ecart >= -SEUILS_KPI_REPORT.deviationBad) return 'orange';
  return 'rouge';
}

export function DashboardSlide({ data }: Props) {
  const cs = data.confidenceScore;
  const score = cs?.score ?? 0;
  const tempsEcoule = data.pourcentageTempsEcoule;

  // KPI values
  const avancement = Math.round(data.avancementGlobal);
  const cibleAvancement = Math.round(tempsEcoule);
  const occupation = data.kpis.tauxOccupation;
  const jalonsAtteints = data.kpis.jalonsAtteints;
  const jalonsTotal = data.kpis.jalonsTotal;
  const jalonsPct = jalonsTotal > 0 ? Math.round((jalonsAtteints / jalonsTotal) * 100) : 0;
  const actionsTerminees = data.kpis.actionsTerminees;
  const totalActions = data.kpis.totalActions;
  const actionsPct = totalActions > 0 ? Math.round((actionsTerminees / totalActions) * 100) : 0;
  const budgetEngageM = Math.round(data.budgetSynthese.engage / 1e6);
  const budgetPrevuM = Math.round(data.budgetSynthese.prevu / 1e6);

  // Score
  const scoreColor = score >= 80 ? C.green : score >= 50 ? C.orange : C.red;
  const trendIcon = cs?.trend === 'up' ? '↑' : cs?.trend === 'down' ? '↓' : '→';
  const trendText = cs?.trend === 'up' ? 'En hausse' : cs?.trend === 'down' ? 'En baisse' : 'Stable';
  const trendLabel = score >= 80 ? 'Maîtrisé' : score >= 50 ? 'Vigilance' : 'Critique';

  // Météo
  const meteoConfig = METEO_CONFIG[data.meteoGlobale];

  // Mobilisation value
  const mobilisationValue = data.syncStatus
    ? Math.round(data.syncStatus.mobilizationProgress)
    : Math.round(data.comparaisonAxes.commercial.avancement);

  return (
    <div>
      <SectionHeader
        title="Tableau de Bord"
        subtitle={`J-${data.joursRestants} — ${data.moisCourant}`}
      />

      {/* ============ ROW 1: 5 KPI CARDS ============ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
        <KpiCard
          label="Avancement global"
          value={`${avancement}%`}
          sub={`Cible: ${cibleAvancement}%`}
          color={getKpiColor(avancement, cibleAvancement)}
        />
        <KpiCard
          label="Occupation"
          value={`${occupation}%`}
          sub={`Cible: ${PROJET_CONFIG.occupationCible}%`}
          color={getKpiColor(occupation, PROJET_CONFIG.occupationCible)}
        />
        <KpiCard
          label="Jalons atteints"
          value={`${jalonsAtteints}/${jalonsTotal}`}
          sub={`${jalonsPct}%`}
          color={getKpiColor(jalonsPct, SEUILS_KPI_REPORT.jalonsPct)}
        />
        <KpiCard
          label="Actions terminées"
          value={`${actionsTerminees}/${totalActions}`}
          sub={`${actionsPct}%`}
          color={getKpiColor(actionsPct, SEUILS_KPI_REPORT.actionsPct)}
        />
        <KpiCard
          label="Budget engagé"
          value={<>{budgetEngageM}M / {budgetPrevuM}M <span style={{ fontSize: 11, fontWeight: 400, color: C.gray500 }}>FCFA</span></>}
          sub=""
          color={getKpiColor(data.budgetSynthese.tauxEngagement, tempsEcoule)}
        />
      </div>

      {/* ============ ROW 2: SCORE DE CONFIANCE + DÉCOMPOSITION ============ */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, marginBottom: 16 }}>
        {/* Score de Confiance */}
        <SlideCard style={{ textAlign: 'center', padding: '20px 16px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.gray500, marginBottom: 12 }}>
            Score de Confiance
          </div>

          {/* Gauge with custom number inside */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <Gauge value={score} size={150} strokeWidth={6} color={scoreColor} showValue={false} />
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            }}>
              <div style={{ fontSize: 44, fontWeight: 700, color: C.navy, lineHeight: 1 }}>
                {Math.round(score)}
              </div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: C.gray400, marginTop: 2 }}>/100</div>

          {/* Trend */}
          <div style={{ marginTop: 10, fontSize: 12, color: C.gray500 }}>
            <span style={{ color: cs?.trend === 'up' ? C.green : cs?.trend === 'down' ? C.red : C.gray500, fontWeight: 600 }}>
              {trendIcon}
            </span>
            {' '}vs mois préc.
          </div>
          <div style={{
            marginTop: 4, fontSize: 12, fontWeight: 600,
            color: scoreColor,
          }}>
            {trendText} — {trendLabel}
          </div>
        </SlideCard>

        {/* Décomposition du Score */}
        <SlideCard style={{ padding: '20px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 16 }}>
            Décomposition du Score
          </div>

          {cs && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(cs.factors).map(([key, factor]) => {
                const pts = Math.round(factor.value * factor.weight);
                const barColor = factor.value >= 80 ? C.green : factor.value >= 50 ? C.orange : C.red;
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.navy, minWidth: 110 }}>
                      {FACTOR_LABELS[key] || key}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 600, color: C.green,
                      backgroundColor: C.greenBg, padding: '1px 6px', borderRadius: 4,
                    }}>
                      ×{factor.weight}
                    </span>
                    {/* Progress bar */}
                    <div style={{ flex: 1, height: 6, backgroundColor: C.gray200, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${Math.min(100, factor.value)}%`,
                        backgroundColor: barColor, borderRadius: 5,
                        transition: 'width 0.5s',
                      }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: barColor, minWidth: 40, textAlign: 'right' }}>
                      {Math.round(factor.value)}%
                    </span>
                    <span style={{ fontSize: 11, color: C.gray500, minWidth: 46, textAlign: 'right' }}>
                      → {pts} pts
                    </span>
                  </div>
                );
              })}

              {/* Score calculé total */}
              <div style={{
                textAlign: 'right', marginTop: 6, paddingTop: 10,
                borderTop: `1px solid ${C.gray200}`,
              }}>
                <span style={{ fontSize: 13, color: C.gray500 }}>Score calculé </span>
                <span style={{ fontSize: 20, fontWeight: 700, color: C.navy }}>{Math.round(score)}</span>
                <span style={{ fontSize: 13, color: C.gray400 }}> / 100</span>
              </div>
            </div>
          )}
        </SlideCard>
      </div>

      {/* ============ ROW 3: MÉTÉO PROJET ============ */}
      <SlideCard>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <WeatherIcon level={data.meteoGlobale} size={28} />
            <span style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>Météo Projet</span>
          </div>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 12px', borderRadius: 99,
            backgroundColor: meteoConfig.bgColor,
            color: meteoConfig.color,
            fontSize: 12, fontWeight: 600,
          }}>
            {meteoConfig.label}
          </span>
        </div>

        {/* 5 météo cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          <MeteoCard
            label="Avancement Projet"
            value={avancement}
            meteo={deriveKpiMeteo(data.avancementGlobal, tempsEcoule)}
          />
          <MeteoCard
            label="Avancement Mobilisation"
            value={mobilisationValue}
            meteo={deriveKpiMeteo(mobilisationValue, tempsEcoule)}
            trend="up"
          />
          <MeteoCard
            label="Budget"
            value={Math.round(data.budgetSynthese.tauxEngagement)}
            meteo={deriveKpiMeteo(data.budgetSynthese.tauxEngagement, tempsEcoule)}
          />
          <MeteoCard
            label="Risques"
            value={cs ? Math.round(cs.factors.risques.value) : 0}
            meteo={cs ? (cs.factors.risques.value >= 70 ? 'vert' : cs.factors.risques.value >= 40 ? 'orange' : 'rouge') as MeteoLevel : 'rouge'}
          />
          <MeteoCard
            label="Jalons"
            value={jalonsPct}
            meteo={jalonsTotal > 0 ? deriveKpiMeteo(jalonsPct, tempsEcoule) : 'orange'}
          />
        </div>
      </SlideCard>
    </div>
  );
}

// ============================================================================
// KPI CARD — Top row
// ============================================================================

function KpiCard({ label, value, sub, color }: {
  label: string;
  value: React.ReactNode;
  sub: string;
  color: string;
}) {
  return (
    <div style={{
      backgroundColor: C.white,
      borderRadius: 10,
      border: `1px solid ${C.gray200}`,
      padding: '14px 16px',
    }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: C.gray500, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1.1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: C.gray400, marginTop: 4 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MÉTÉO CARD — Bottom row
// ============================================================================

function MeteoCard({ label, value, meteo, trend }: {
  label: string;
  value: number;
  meteo: MeteoLevel;
  trend?: 'up' | 'down' | 'stable';
}) {
  const meteoColor = METEO_CONFIG[meteo].color;
  const trendArrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';

  return (
    <div style={{
      backgroundColor: C.white,
      borderRadius: 10,
      border: `1px solid ${C.gray200}`,
      padding: '16px 14px',
      textAlign: 'center',
    }}>
      {/* Weather icons + trend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10 }}>
        <WeatherIcon level={meteo} size={28} />
        <span style={{ fontSize: 14, color: C.gray400 }}>{trendArrow}</span>
        <WeatherIcon level={meteo} size={22} />
      </div>

      {/* Value */}
      <div style={{ fontSize: 24, fontWeight: 700, color: meteoColor, marginBottom: 4 }}>
        {value}%
      </div>

      {/* Label */}
      <div style={{ fontSize: 11, fontWeight: 500, color: C.gray500 }}>
        {label}
      </div>
    </div>
  );
}
