import React, { useMemo } from 'react';
import { C, METEO_CONFIG } from '../constants';
import { SectionHeader, SlideCard, TrendIcon, WeatherIcon } from '../components';
import type { ExcoV5Data, AxeData } from '../hooks/useExcoV5Data';

interface Props { data: ExcoV5Data }

export function ScorecardSlide({ data }: Props) {
  const sortedAxes = useMemo(() =>
    [...data.axesData].sort((a, b) => a.avancement - b.avancement),
    [data.axesData]
  );

  const moyAvancement = useMemo(() => {
    if (data.axesData.length === 0) return 0;
    return Math.round(data.axesData.reduce((s, a) => s + a.avancement, 0) / data.axesData.length);
  }, [data.axesData]);

  const totalActions = data.axesData.reduce((s, a) => s + a.actionsTotal, 0);
  const totalTerminees = data.axesData.reduce((s, a) => s + a.actionsTerminees, 0);
  const totalJalons = data.axesData.reduce((s, a) => s + a.jalonsTotal, 0);
  const totalJalonsAtteints = data.axesData.reduce((s, a) => s + a.jalonsAtteints, 0);
  const axesA0 = data.axesData.filter(a => a.avancement === 0).length;
  const axesEnRetard = data.axesData.filter(a => a.tendance === 'down').length;

  const cible = Math.round(data.pourcentageTempsEcoule);

  return (
    <div>
      <SectionHeader
        title="Scorecard Consolidé"
        subtitle="Vue d'ensemble de tous les axes stratégiques"
      />

      {/* ============ Header KPIs ============ */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16,
      }}>
        <SlideCard style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.gray400, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            Moy. Avancement
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: moyAvancement >= cible ? C.green : C.orange }}>
            {moyAvancement}%
          </div>
          <div style={{ fontSize: 11, color: C.gray500 }}>Cible: {cible}%</div>
        </SlideCard>

        <SlideCard style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.gray400, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            Actions
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.navy }}>
            {totalTerminees}/{totalActions}
          </div>
          <div style={{ fontSize: 11, color: C.gray500 }}>
            {totalActions > 0 ? Math.round((totalTerminees / totalActions) * 100) : 0}% terminées
          </div>
        </SlideCard>

        <SlideCard style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.gray400, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            Jalons
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.navy }}>
            {totalJalonsAtteints}/{totalJalons}
          </div>
          <div style={{ fontSize: 11, color: C.gray500 }}>
            {totalJalons > 0 ? Math.round((totalJalonsAtteints / totalJalons) * 100) : 0}% atteints
          </div>
        </SlideCard>

        <SlideCard style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.gray400, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            Alertes
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: axesA0 + axesEnRetard > 0 ? C.red : C.green }}>
            {axesA0 + axesEnRetard}
          </div>
          <div style={{ fontSize: 11, color: C.gray500 }}>
            {axesA0 > 0 ? `${axesA0} à 0%` : ''}
            {axesA0 > 0 && axesEnRetard > 0 ? ' · ' : ''}
            {axesEnRetard > 0 ? `${axesEnRetard} en retard` : ''}
            {axesA0 === 0 && axesEnRetard === 0 ? 'Aucune alerte' : ''}
          </div>
        </SlideCard>
      </div>

      {/* ============ Table Header ============ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '170px 1fr 70px 70px 60px 50px 50px',
        gap: 0, alignItems: 'center',
        padding: '10px 20px',
        backgroundColor: C.gray100,
        borderRadius: '10px 10px 0 0',
        borderBottom: `1px solid ${C.gray200}`,
      }}>
        <span style={thStyle}>Axe</span>
        <span style={thStyle}>Avancement</span>
        <span style={{ ...thStyle, textAlign: 'center' }}>Actions</span>
        <span style={{ ...thStyle, textAlign: 'center' }}>Jalons</span>
        <span style={{ ...thStyle, textAlign: 'center' }}>Écart</span>
        <span style={{ ...thStyle, textAlign: 'center' }}>Trend</span>
        <span style={{ ...thStyle, textAlign: 'center' }}>Météo</span>
      </div>

      {/* ============ Axis Rows ============ */}
      <div style={{
        backgroundColor: C.white,
        border: `1px solid ${C.gray200}`,
        borderTop: 'none',
        borderRadius: '0 0 10px 10px',
        overflow: 'hidden',
      }}>
        {sortedAxes.map((axe, idx) => (
          <AxisRow key={axe.id} axe={axe} idx={idx} cible={cible} />
        ))}
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 600, color: C.gray500,
  textTransform: 'uppercase', letterSpacing: '0.05em',
};

// ============================================================================
// Axis Row
// ============================================================================

function AxisRow({ axe, idx, cible }: { axe: AxeData; idx: number; cible: number }) {
  const ecart = Math.round(axe.avancement - cible);
  const v = Math.max(0, Math.min(100, axe.avancement));
  const meteo = METEO_CONFIG[axe.meteo];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '170px 1fr 70px 70px 60px 50px 50px',
      gap: 0, alignItems: 'center',
      padding: '14px 20px',
      backgroundColor: idx % 2 === 0 ? C.white : C.gray50,
      borderBottom: idx < 7 ? `1px solid ${C.gray100}` : 'none',
    }}>
      {/* Col 1: Badge + Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          backgroundColor: C.gray100,
          border: `1.5px solid ${C.gray300}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 600, color: C.gray600,
        }}>
          {axe.labelCourt}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{axe.labelCourt}</div>
          <div style={{ fontSize: 10, color: C.gray400 }}>{axe.label}</div>
        </div>
      </div>

      {/* Col 2: Progress bar */}
      <div style={{ paddingRight: 16, paddingLeft: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.navy, minWidth: 36 }}>
            {Math.round(axe.avancement)}%
          </span>
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{
              height: 8, backgroundColor: C.gray200,
              borderRadius: 4, overflow: 'visible', position: 'relative',
            }}>
              <div style={{
                height: '100%', width: `${v}%`, backgroundColor: axe.color,
                borderRadius: 4, transition: 'width 0.5s ease',
              }} />
              {/* Cible marker */}
              <div style={{
                position: 'absolute', left: `${Math.min(cible, 100)}%`,
                top: -2, bottom: -2, width: 2,
                backgroundColor: C.navy, borderRadius: 1, opacity: 0.4,
              }} />
            </div>
          </div>
          <span style={{ fontSize: 10, color: C.gray400, whiteSpace: 'nowrap' }}>Cible {cible}%</span>
        </div>
      </div>

      {/* Col 3: Actions */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>
          {axe.actionsTerminees}/{axe.actionsTotal}
        </div>
        {axe.actionsEnRetard > 0 && (
          <div style={{ fontSize: 9, color: C.red, fontWeight: 600 }}>{axe.actionsEnRetard} retard</div>
        )}
      </div>

      {/* Col 4: Jalons */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>
          {axe.jalonsAtteints}/{axe.jalonsTotal}
        </div>
        {axe.jalonsEnDanger > 0 && (
          <div style={{ fontSize: 9, color: C.red, fontWeight: 600 }}>{axe.jalonsEnDanger} danger</div>
        )}
      </div>

      {/* Col 5: Écart */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 14, fontWeight: 600,
          color: ecart >= 0 ? C.green : C.red,
        }}>
          {ecart >= 0 ? '+' : ''}{ecart}
        </div>
      </div>

      {/* Col 6: Tendance */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <TrendIcon direction={axe.tendance} size={16} />
      </div>

      {/* Col 7: Météo */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <WeatherIcon level={axe.meteo} size={20} />
      </div>
    </div>
  );
}
