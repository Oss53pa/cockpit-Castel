import React, { useState, useMemo } from 'react';
import { C } from '../constants';
import { SectionHeader, SlideCard } from '../components';
import type { ExcoV5Data } from '../hooks/useExcoV5Data';
import {
  generateScenariosV2,
  HORIZONS_REPORT,
  type ScenariosOutput,
  type ImpactAxe,
  type ImpactRiskLevel,
  type ScenarioRiskLevel,
  type ScenarioSynthese,
} from '../hooks/useExcoV5Data';

interface Props { data: ExcoV5Data; printMode?: boolean }

const RISK_LEVEL_CONFIG: Record<ImpactRiskLevel, { color: string; bg: string; label: string }> = {
  critique: { color: C.red, bg: C.redBg, label: 'CRITIQUE' },
  'élevé': { color: C.orange, bg: C.orangeBg, label: 'ÉLEVÉ' },
  moyen: { color: C.yellow, bg: C.yellowBg, label: 'MOYEN' },
  faible: { color: C.green, bg: C.greenBg, label: 'FAIBLE' },
};

const SCORE_COLORS: Record<ScenarioRiskLevel, { color: string; bg: string }> = {
  vert: { color: C.green, bg: C.greenBg },
  orange: { color: C.orange, bg: C.orangeBg },
  rouge: { color: C.red, bg: C.redBg },
};

function fmtFCFA(v: number): string {
  if (v >= 1e9) return `${Math.round(v / 1e9)}Md`;
  if (v >= 1e6) return `${Math.round(v / 1e6)}M`;
  if (v >= 1e3) return `${Math.round(v / 1e3)}k`;
  return `${Math.round(v)}`;
}

type TabId = 'axes' | 'synthese';

export function ScenariosSlide({ data, printMode }: Props) {
  const [moisReport, setMoisReport] = useState(1);
  const [activeTab, setActiveTab] = useState<TabId>('axes');

  // Recalcul dynamique à chaque changement d'horizon
  const result: ScenariosOutput = useMemo(
    () => generateScenariosV2(data.scenariosInputs, moisReport),
    [data.scenariosInputs, moisReport]
  );

  const scoreStyle = SCORE_COLORS[result.scoreRisque.level];

  return (
    <div>
      <SectionHeader
        title="Scénarios d'Impact"
        subtitle="Agir maintenant vs attendre — analyse par axe"
      />

      {/* ============ Horizon Selector ============ */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.gray500 }}>Horizon de report :</span>
          {!printMode && (result.horizonsDisponibles || HORIZONS_REPORT).map(h => {
            const active = moisReport === h;
            return (
              <button
                key={h}
                onClick={() => setMoisReport(h)}
                style={{
                  padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600,
                  backgroundColor: active ? C.navy : C.white,
                  color: active ? C.white : C.gray600,
                  boxShadow: active ? 'none' : `inset 0 0 0 1px ${C.gray200}`,
                  transition: 'all 0.2s',
                }}
              >
                {h} mois
              </button>
            );
          })}
          {printMode && (
            <span style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{moisReport} mois</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
            backgroundColor: scoreStyle.bg, color: scoreStyle.color,
          }}>
            Score {result.scoreRisque.score}/100 — {result.scoreRisque.label}
          </span>
        </div>
      </div>

      {/* ============ Summary Banner ============ */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
        marginBottom: 12,
      }}>
        <SummaryCard
          label="Coût total report"
          value={`+${fmtFCFA(result.coutTotalReport)}`}
          sub="FCFA (portage + manque à gagner)"
          color={C.red}
        />
        <SummaryCard
          label="Semaines perdues"
          value={`−${result.semainesPerduesTotal}`}
          sub="sur chemin critique (max)"
          color={C.orange}
        />
        <SummaryCard
          label="Axes critiques"
          value={`${result.axesCritiques}`}
          sub={`sur ${result.impactsParAxe.length} axes analysés`}
          color={result.axesCritiques > 0 ? C.red : C.green}
        />
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
        marginBottom: 20,
      }}>
        <SummaryCard
          label="Actions en retard"
          value={`+${result.totaux_operationnels.actions_en_retard_total}`}
          sub="nouvelles actions impactées"
          color={result.totaux_operationnels.actions_en_retard_total > 0 ? C.orange : C.green}
        />
        <SummaryCard
          label="Jalons inatteignables"
          value={`${result.totaux_operationnels.jalons_inatteignables_total}`}
          sub="dépassent le soft opening"
          color={result.totaux_operationnels.jalons_inatteignables_total > 0 ? C.red : C.green}
        />
        <SummaryCard
          label="Complétion projetée"
          value={`${result.totaux_operationnels.taux_completion_global}%`}
          sub={`Horizon ${moisReport} mois`}
          color={result.totaux_operationnels.taux_completion_global >= 80 ? C.green : C.orange}
        />
      </div>

      {/* ============ Tabs ============ */}
      {!printMode && <TabSelector activeTab={activeTab} onTabChange={setActiveTab} />}

      {(printMode || activeTab === 'axes') && (
        <>
          {printMode && (
            <div style={{
              fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 10,
              borderBottom: `2px solid ${C.gray200}`, paddingBottom: 8,
            }}>
              Impacts par axe
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {result.impactsParAxe.map(axe => (
              <AxeImpactCard key={axe.axe} axe={axe} moisReport={moisReport} />
            ))}
          </div>
        </>
      )}

      {(printMode || activeTab === 'synthese') && (
        <>
          {printMode && (
            <div style={{
              fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 10,
              borderBottom: `2px solid ${C.gray200}`, paddingBottom: 8,
            }}>
              Synthèse transversale
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            <SyntheseCard synthese={result.syntheseBudget} moisReport={moisReport} />
            <SyntheseCard synthese={result.synthesePlanningMOE} moisReport={moisReport} />
            <SyntheseCard synthese={result.syntheseGOCommercial} moisReport={moisReport} />
          </div>
        </>
      )}

      {/* ============ Risk Score Gauge ============ */}
      <SlideCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Gauge circle */}
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            border: `4px solid ${scoreStyle.color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, backgroundColor: scoreStyle.bg,
          }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: scoreStyle.color }}>
              {result.scoreRisque.score}
            </span>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: C.navy }}>
                Indice de risque global
              </span>
              <span style={{
                padding: '3px 10px', borderRadius: 99,
                backgroundColor: scoreStyle.bg, color: scoreStyle.color,
                fontSize: 11, fontWeight: 600,
              }}>
                {result.scoreRisque.label}
              </span>
            </div>

            {/* Progress bar */}
            <div style={{
              height: 8, borderRadius: 4, backgroundColor: C.gray200,
              marginBottom: 10, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 4,
                width: `${result.scoreRisque.score}%`,
                backgroundColor: scoreStyle.color,
                transition: 'width 0.4s ease',
              }} />
            </div>

            {/* Factors */}
            {result.scoreRisque.facteurs.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {result.scoreRisque.facteurs.map((f, i) => (
                  <span key={i} style={{
                    fontSize: 10, color: C.gray600,
                    padding: '2px 8px', borderRadius: 6,
                    backgroundColor: C.gray100,
                  }}>
                    {f.text} <span style={{ fontWeight: 600, color: C.red }}>+{f.points}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </SlideCard>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const TABS: { id: TabId; label: string }[] = [
  { id: 'axes', label: 'Impacts par axe' },
  { id: 'synthese', label: 'Synthèse transversale' },
];

function TabSelector({ activeTab, onTabChange }: { activeTab: TabId; onTabChange: (t: TabId) => void }) {
  return (
    <div style={{
      display: 'flex', gap: 4, marginBottom: 16,
      padding: 3, backgroundColor: C.gray100, borderRadius: 8,
      width: 'fit-content',
    }}>
      {TABS.map(tab => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              padding: '7px 20px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: active ? 600 : 400,
              backgroundColor: active ? C.white : 'transparent',
              color: active ? C.navy : C.gray500,
              boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function SummaryCard({ label, value, sub, color }: {
  label: string; value: string; sub: string; color: string;
}) {
  return (
    <div style={{
      padding: '14px 16px', backgroundColor: C.white, borderRadius: 10,
      border: `1px solid ${C.gray200}`,
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: C.gray400, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 10, color: C.gray500, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function AxeImpactCard({ axe, moisReport }: { axe: ImpactAxe; moisReport: number }) {
  const riskCfg = RISK_LEVEL_CONFIG[axe.siReport.risqueLevel];

  return (
    <div style={{
      backgroundColor: C.white, borderRadius: 10, overflow: 'hidden',
      border: `1px solid ${C.gray200}`,
    }}>
      {/* Header: code + label + risk badge */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        borderBottom: `1px solid ${C.gray100}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: C.gray400 }}>●</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{axe.code}</span>
          <span style={{ fontSize: 11, color: C.gray500 }}>{axe.label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {axe.siReport.coutFinancier > 0 && (
            <span style={{ fontSize: 10, fontWeight: 600, color: C.red }}>
              +{fmtFCFA(axe.siReport.coutFinancier)}
            </span>
          )}
          <span style={{
            fontSize: 9, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
            backgroundColor: riskCfg.bg, color: riskCfg.color,
          }}>
            {riskCfg.label}
          </span>
        </div>
      </div>

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        {/* Si maintenant */}
        <div style={{
          padding: '12px 14px',
          borderRight: `1px solid ${C.gray100}`,
          backgroundColor: 'rgba(34, 197, 94, 0.03)',
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, color: C.green,
            textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
          }}>
            Si maintenant
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.navy, marginBottom: 6 }}>
            {axe.siMaintenant.headline}
          </div>
          {axe.siMaintenant.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 3 }}>
              <span style={{ color: C.green, fontSize: 11, marginTop: 1, flexShrink: 0 }}>→</span>
              <span style={{ fontSize: 11, color: C.gray600, lineHeight: 1.4 }}>
                {item.text}
                {item.chiffre && <span style={{ fontWeight: 600, color: C.navy }}> ({item.chiffre})</span>}
              </span>
            </div>
          ))}
          <div style={{ fontSize: 10, color: C.gray500, fontStyle: 'italic', marginTop: 6 }}>
            {axe.siMaintenant.impact}
          </div>
        </div>

        {/* Si report */}
        <div style={{
          padding: '12px 14px',
          backgroundColor: 'rgba(239, 68, 68, 0.03)',
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, color: C.red,
            textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
          }}>
            Si report {moisReport} mois
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.navy, marginBottom: 6 }}>
            {axe.siReport.headline}
          </div>
          {axe.siReport.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 3 }}>
              <span style={{ color: C.red, fontSize: 11, marginTop: 1, flexShrink: 0 }}>→</span>
              <span style={{ fontSize: 11, color: C.gray600, lineHeight: 1.4 }}>
                {item.text}
                {item.chiffre && <span style={{ fontWeight: 600, color: C.red }}> ({item.chiffre})</span>}
              </span>
            </div>
          ))}
          <div style={{ fontSize: 10, color: C.gray500, fontStyle: 'italic', marginTop: 6 }}>
            {axe.siReport.impact}
          </div>
        </div>
      </div>

      {/* ---- Impact opérationnel ---- */}
      {axe.operationnel && (
        <div style={{
          padding: '8px 14px',
          borderTop: `1px solid ${C.gray100}`,
          backgroundColor: 'rgba(59, 130, 246, 0.03)',
        }}>
          <div style={{
            fontSize: 9, fontWeight: 600, color: C.blue,
            textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
          }}>
            Impact opérationnel
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            <OpMetric label="Retard" value={`+${axe.operationnel.actions.actions_nouvellement_en_retard}`} color={axe.operationnel.actions.actions_nouvellement_en_retard > 0 ? C.red : C.green} />
            <OpMetric label="Jalons KO" value={`${axe.operationnel.jalons.jalons_inatteignables}`} color={axe.operationnel.jalons.jalons_inatteignables > 0 ? C.red : C.green} />
            <OpMetric label="Vélocité" value={`x${axe.operationnel.actions.ratio_acceleration}`} color={axe.operationnel.actions.ratio_acceleration > 3 ? C.red : axe.operationnel.actions.ratio_acceleration > 1.5 ? C.orange : C.green} />
            <OpMetric label="Complétion" value={`${axe.operationnel.actions.taux_completion_projete}%`} color={axe.operationnel.actions.taux_completion_projete >= 80 ? C.green : C.orange} />
          </div>
        </div>
      )}

      {/* ---- Top actions à débloquer ---- */}
      {axe.recommandation && axe.recommandation.actions_prioritaires.length > 0 && (
        <div style={{
          padding: '6px 14px 8px',
          borderTop: `1px solid ${C.gray100}`,
        }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: C.gray400, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
            Actions à débloquer
          </div>
          {axe.recommandation.actions_prioritaires.map((a, i) => (
            <div key={i} style={{ fontSize: 10, color: C.gray600, marginBottom: 2 }}>
              <span style={{ color: C.orange, marginRight: 4 }}>●</span>
              {a.titre}
            </div>
          ))}
        </div>
      )}

      {/* ---- Résumé explicatif algorithmique ---- */}
      {axe.resumeExplicatif && (
        <div style={{
          padding: '10px 14px',
          borderTop: `1px solid ${C.gray100}`,
          backgroundColor: riskCfg.bg,
        }}>
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <span style={{
              fontSize: 14,
              marginTop: 1,
              flexShrink: 0,
            }}>
              💡
            </span>
            <div>
              <div style={{
                fontSize: 9, fontWeight: 600, color: riskCfg.color,
                textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
              }}>
                Analyse Proph3t
              </div>
              <div style={{
                fontSize: 11, color: C.gray700, lineHeight: 1.5,
                fontStyle: 'italic',
              }}>
                {axe.resumeExplicatif}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OpMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 8, color: C.gray400, textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

function SyntheseCard({ synthese, moisReport }: { synthese: ScenarioSynthese; moisReport: number }) {
  return (
    <div style={{
      backgroundColor: C.white, borderRadius: 10, overflow: 'hidden',
      border: `1px solid ${C.gray200}`,
    }}>
      <div style={{
        padding: '12px 20px', fontSize: 14, fontWeight: 600, color: C.navy,
        borderBottom: `1px solid ${C.gray200}`,
      }}>
        {synthese.titre}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        <div style={{
          padding: '14px 20px', borderRight: `1px solid ${C.gray200}`,
          backgroundColor: 'rgba(34, 197, 94, 0.04)',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 600, color: C.green,
            marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5,
          }}>
            Si maintenant
          </div>
          {synthese.siMaintenant.filter(b => b.trim()).map((bullet, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
              <span style={{ color: C.green, fontWeight: 600, fontSize: 12, flexShrink: 0 }}>→</span>
              <span style={{ fontSize: 12, color: C.gray700, lineHeight: 1.5 }}>{bullet}</span>
            </div>
          ))}
        </div>
        <div style={{
          padding: '14px 20px',
          backgroundColor: 'rgba(239, 68, 68, 0.04)',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 600, color: C.red,
            marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5,
          }}>
            Si report {moisReport} mois
          </div>
          {synthese.siReport.filter(b => b.trim()).map((bullet, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
              <span style={{ color: C.red, fontWeight: 600, fontSize: 12, flexShrink: 0 }}>→</span>
              <span style={{ fontSize: 12, color: C.gray700, lineHeight: 1.5 }}>{bullet}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
