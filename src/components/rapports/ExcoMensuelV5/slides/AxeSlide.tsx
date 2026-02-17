import React, { useState, useMemo } from 'react';
import { C, AXES_V5, METEO_CONFIG } from '../constants';
import { SlideCard, Gauge } from '../components';
import type { ExcoV5Data } from '../hooks/useExcoV5Data';

interface Props {
  data: ExcoV5Data;
  axeId: string;
  printMode?: boolean;
}

function getStatutBadge(statut: string): { label: string; color: string; bg: string } {
  switch (statut) {
    case 'en_cours': return { label: 'En cours', color: C.blue, bg: C.blueBg };
    case 'termine': return { label: 'Terminé', color: C.green, bg: C.greenBg };
    case 'a_faire':
    case 'planifie':
    case 'a_planifier': return { label: 'À faire', color: C.gray500, bg: C.gray100 };
    default: return { label: statut.replace('_', ' '), color: C.gray500, bg: C.gray100 };
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function AxeSlide({ data, axeId, printMode }: Props) {
  const axe = data.axesData.find(a => a.id === axeId);
  const axeCfg = AXES_V5.find(a => a.id === axeId);
  const analysis = data.axeAnalyses[axeId] ?? { soWhat: '', recommendation: '' };
  const [activeTab, setActiveTab] = useState<'actions' | 'analyse'>('actions');
  const [editing, setEditing] = useState(false);
  const [soWhat, setSoWhat] = useState(analysis.soWhat);
  const [recommendation, setRecommendation] = useState(analysis.recommendation);

  if (!axe || !axeCfg) return null;

  const axeIndex = AXES_V5.indexOf(axeCfg) + 1;
  const meteoConfig = METEO_CONFIG[axe.meteo];
  const todayStr = new Date().toISOString().split('T')[0];

  // Jalons for this axis (sorted by date)
  const axeJalons = useMemo(() =>
    data.allJalons
      .filter(j => j.axe === axeCfg.dbCode)
      .sort((a, b) => a.date_prevue.localeCompare(b.date_prevue)),
    [data.allJalons, axeCfg.dbCode]
  );

  // Actions prioritaires M et M+1 (mois de reporting + mois suivant), max 10
  const axeActions = useMemo(() => {
    const now = new Date();
    const moisM = now.getMonth();
    const anneeM = now.getFullYear();
    // Fin de M+1 = dernier jour du mois suivant
    const finM1 = new Date(anneeM, moisM + 2, 0); // jour 0 du mois+2 = dernier jour du mois+1
    const finM1Str = finM1.toISOString().split('T')[0];

    return data.allActions
      .filter(a => a.axe === axeCfg.dbCode && a.statut !== 'termine' && a.date_fin_prevue <= finM1Str)
      .sort((a, b) => (a.date_fin_prevue || '').localeCompare(b.date_fin_prevue || ''))
      .slice(0, 10);
  }, [data.allActions, axeCfg.dbCode]);

  // KPI computations
  const actionsPct = axe.actionsTotal > 0 ? Math.round((axe.actionsTerminees / axe.actionsTotal) * 100) : 0;
  const jalonsPct = axe.jalonsTotal > 0 ? Math.round((axe.jalonsAtteints / axe.jalonsTotal) * 100) : 0;
  const ecart = Math.round(axe.avancement - axe.prevu);

  const handleSave = () => {
    data.setAxeAnalysis(axeId, { soWhat, recommendation });
    setEditing(false);
  };

  return (
    <div>
      {/* ============ HEADER ============ */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Axe badge circle */}
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            backgroundColor: axe.color + '18',
            border: `2px solid ${axe.color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 600, color: axe.color,
          }}>
            {axeCfg.labelCourt}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, color: C.navy }}>
              {axe.label}
            </div>
            <div style={{ fontSize: 12, color: C.gray500 }}>
              Axe {axeIndex} — {axe.actionsTotal} actions, {axe.jalonsTotal} jalons
            </div>
          </div>
        </div>
        {/* Météo badge */}
        <span style={{
          padding: '5px 14px', borderRadius: 99,
          backgroundColor: meteoConfig.bgColor,
          color: meteoConfig.color,
          fontSize: 13, fontWeight: 600,
        }}>
          {meteoConfig.label}
        </span>
      </div>

      {/* ============ KPI ROW ============ */}
      <div style={{
        display: 'grid', gridTemplateColumns: '140px repeat(4, 1fr)',
        gap: 12, marginBottom: 20,
      }}>
        {/* Gauge */}
        <SlideCard style={{ textAlign: 'center', padding: '16px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Gauge value={axe.avancement} size={90} strokeWidth={6} color={axe.color} showValue />
          <div style={{
            fontSize: 11, marginTop: 6, fontWeight: 600,
            color: axe.tendance === 'up' ? C.green : axe.tendance === 'down' ? C.red : C.gray500,
          }}>
            {axe.tendance === 'up' ? '↑' : axe.tendance === 'down' ? '↓' : '→'}
            <span style={{ fontWeight: 400, color: C.gray400 }}> vs préc.</span>
          </div>
        </SlideCard>

        {/* Actions */}
        <KpiStatCard
          label="Actions"
          value={`${axe.actionsTerminees}/${axe.actionsTotal}`}
          sub={`${actionsPct}% terminées`}
        />

        {/* Jalons */}
        <KpiStatCard
          label="Jalons"
          value={`${axe.jalonsAtteints}/${axe.jalonsTotal}`}
          sub={`${jalonsPct}% atteints`}
        />

        {/* Écart vs Cible */}
        <KpiStatCard
          label="Écart vs Cible"
          value={`${ecart >= 0 ? '+' : ''}${ecart} pts`}
          sub={`Cible: ${Math.round(axe.prevu)}%`}
          valueColor={ecart >= 0 ? C.green : C.red}
        />

        {/* Risques Actifs */}
        <KpiStatCard
          label="Risques Actifs"
          value={`${axe.risquesActifs}`}
          sub={axe.risquesActifs > 0 ? `${axe.risquesCritiques} critique(s)` : 'Aucun risque'}
          valueColor={axe.risquesActifs > 0 ? C.red : C.green}
          subColor={axe.risquesActifs > 0 ? C.red : C.green}
        />
      </div>

      {/* ============ JALONS TIMELINE ============ */}
      {axeJalons.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 11, fontWeight: 600, color: C.gray400, textTransform: 'uppercase',
            letterSpacing: '0.05em', marginBottom: 14,
            borderBottom: `1px solid ${C.gray200}`, paddingBottom: 8,
          }}>
            Jalons
          </div>
          <div style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            position: 'relative', padding: '0 20px',
          }}>
            {/* Background line */}
            <div style={{
              position: 'absolute', top: 18, left: 50, right: 50,
              height: 3, backgroundColor: C.gray200, borderRadius: 2,
            }}>
              {/* Progress fill */}
              <div style={{
                height: '100%', borderRadius: 2,
                width: `${axeJalons.length > 1 ? (axe.jalonsAtteints / (axeJalons.length - 1)) * 100 : (axe.jalonsAtteints > 0 ? 100 : 0)}%`,
                backgroundColor: axe.color,
                transition: 'width 0.5s',
              }} />
            </div>

            {axeJalons.map((jalon, i) => {
              const isAtteint = jalon.statut === 'atteint';
              return (
                <div key={jalon.id_jalon} style={{ textAlign: 'center', zIndex: 1, flex: 1 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', margin: '0 auto 8px',
                    backgroundColor: isAtteint ? axe.color : C.white,
                    border: `2px solid ${isAtteint ? axe.color : C.gray300}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 600,
                    color: isAtteint ? C.white : C.gray500,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: 600, color: C.navy,
                    maxWidth: 150, margin: '0 auto', lineHeight: 1.3,
                  }}>
                    {jalon.titre}
                  </div>
                  <div style={{ fontSize: 10, color: C.gray400, marginTop: 3 }}>
                    {formatDate(jalon.date_prevue)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============ TABS ============ */}
      {!printMode && (
        <div style={{
          display: 'flex', gap: 0, borderBottom: `2px solid ${C.gray200}`, marginBottom: 16,
        }}>
          <TabButton
            label={`Actions prioritaires M / M+1 (${axeActions.length})`}
            active={activeTab === 'actions'}
            onClick={() => setActiveTab('actions')}
          />
          <TabButton
            label="Analyse & Recommandations"
            active={activeTab === 'analyse'}
            onClick={() => setActiveTab('analyse')}
          />
        </div>
      )}

      {/* ============ TAB CONTENT ============ */}
      {(printMode || activeTab === 'actions') && (
        <>
          {printMode && (
            <div style={{
              fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 10,
              borderBottom: `2px solid ${C.gray200}`, paddingBottom: 8,
            }}>
              Actions prioritaires M / M+1 ({axeActions.length})
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {axeActions.map((action, i) => {
              const badge = getStatutBadge(action.statut);
              const isLate = action.date_fin_prevue < todayStr && action.statut !== 'termine';
              return (
                <div
                  key={action.id_action}
                  style={{
                    padding: '14px 16px',
                    backgroundColor: C.white,
                    borderRadius: 10,
                    border: `1px solid ${C.gray200}`,
                  }}
                >
                  {/* Top: number + title + percentage */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                      backgroundColor: axe.color + '18',
                      color: axe.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 600,
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 600, color: C.navy,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {action.titre}
                      </div>
                      <div style={{ fontSize: 11, color: C.gray500, marginTop: 2 }}>
                        {action.responsable || '—'} · {formatDate(action.date_fin_prevue)}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: axe.color, flexShrink: 0 }}>
                      {action.avancement}%
                    </div>
                  </div>

                  {/* Progress bar + status badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                    <div style={{
                      flex: 1, height: 6, backgroundColor: C.gray200,
                      borderRadius: 3, overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%', width: `${action.avancement}%`,
                        backgroundColor: axe.color, borderRadius: 3,
                      }} />
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 600,
                      padding: '2px 8px', borderRadius: 4,
                      backgroundColor: isLate ? C.redBg : badge.bg,
                      color: isLate ? C.red : badge.color,
                      whiteSpace: 'nowrap',
                    }}>
                      {isLate ? 'En retard' : badge.label}
                    </span>
                  </div>
                </div>
              );
            })}
            {axeActions.length === 0 && (
              <div style={{
                gridColumn: '1 / -1', textAlign: 'center',
                padding: 30, color: C.gray400, fontSize: 13, fontStyle: 'italic',
              }}>
                Aucune action prioritaire sur M / M+1
              </div>
            )}
          </div>
        </>
      )}

      {(printMode || activeTab === 'analyse') && (
        /* ============ ANALYSE & RECOMMANDATIONS ============ */
        <SlideCard style={printMode ? { marginTop: 16 } : undefined}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 12,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.gold }}>
              Analyse & Recommandation
            </div>
            {!printMode && (
              <button
                onClick={() => editing ? handleSave() : setEditing(true)}
                style={{
                  border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: 12, color: C.gold, fontWeight: 600,
                }}
              >
                {editing ? 'Sauver' : 'Éditer'}
              </button>
            )}
          </div>
          {!printMode && editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: C.gray500, display: 'block', marginBottom: 4 }}>
                  So What?
                </label>
                <textarea
                  value={soWhat}
                  onChange={e => setSoWhat(e.target.value)}
                  placeholder="Analyse de la situation..."
                  style={{
                    width: '100%', minHeight: 80, padding: 10, borderRadius: 8,
                    border: `1px solid ${C.gray300}`, fontSize: 13,
                    fontFamily: '"Exo 2", Inter, sans-serif', resize: 'vertical',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: C.gray500, display: 'block', marginBottom: 4 }}>
                  Recommandation
                </label>
                <textarea
                  value={recommendation}
                  onChange={e => setRecommendation(e.target.value)}
                  placeholder="Actions recommandées..."
                  style={{
                    width: '100%', minHeight: 80, padding: 10, borderRadius: 8,
                    border: `1px solid ${C.gray300}`, fontSize: 13,
                    fontFamily: '"Exo 2", Inter, sans-serif', resize: 'vertical',
                  }}
                />
              </div>
            </div>
          ) : (
            <div>
              {analysis.soWhat ? (
                <>
                  <div style={{
                    fontSize: 13, color: C.gray700,
                    marginBottom: 10, lineHeight: 1.5,
                  }}>
                    <strong style={{ color: C.navy }}>So What: </strong>
                    {analysis.soWhat}
                  </div>
                  <div style={{ fontSize: 13, color: C.gray700, lineHeight: 1.5 }}>
                    <strong style={{ color: C.navy }}>Recommandation: </strong>
                    {analysis.recommendation}
                  </div>
                </>
              ) : (
                <div style={{
                  color: C.gray400, fontSize: 13, fontStyle: 'italic',
                  textAlign: 'center', padding: 20,
                }}>
                  {printMode ? 'Aucune analyse renseignée' : 'Cliquer sur Éditer pour ajouter votre analyse'}
                </div>
              )}
            </div>
          )}
        </SlideCard>
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function KpiStatCard({ label, value, sub, valueColor, subColor }: {
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
  subColor?: string;
}) {
  return (
    <SlideCard style={{ padding: '14px 16px' }}>
      <div style={{
        fontSize: 10, fontWeight: 600, color: C.gray400,
        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6,
      }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: valueColor || C.navy }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: subColor || C.gray500 }}>
        {sub}
      </div>
    </SlideCard>
  );
}

function TabButton({ label, active, onClick }: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 20px', border: 'none', cursor: 'pointer',
        backgroundColor: 'transparent',
        borderBottom: active ? `2px solid ${C.navy}` : '2px solid transparent',
        color: active ? C.navy : C.gray500,
        fontSize: 13, fontWeight: active ? 600 : 400,
        marginBottom: -2,
      }}
    >
      {label}
    </button>
  );
}
