import React, { useState, useMemo } from 'react';
import { C } from '../constants';
import { SectionHeader, SlideCard, Gauge, ProgressBar } from '../components';
import type { ExcoV5Data } from '../hooks/useExcoV5Data';

interface Props { data: ExcoV5Data; printMode?: boolean }

const HIGHLIGHT_CATEGORIES = [
  { key: 'realisations' as const, label: 'Réalisations', color: C.green, bg: C.greenBg },
  { key: 'blocages' as const, label: 'Blocages', color: C.red, bg: C.redBg },
  { key: 'alertes' as const, label: 'Alertes', color: C.orange, bg: C.orangeBg },
];

function getScoreColor(score: number | undefined): string {
  if (score === undefined) return C.gray400;
  if (score >= 80) return C.green;
  if (score >= 50) return C.orange;
  return C.red;
}

function getStatutBadge(statut: string): { label: string; color: string; bg: string } {
  switch (statut) {
    case 'en_cours': return { label: 'En cours', color: C.blue, bg: '#EFF6FF' };
    case 'termine': return { label: 'Terminé', color: C.green, bg: C.greenBg };
    case 'a_faire':
    case 'planifie':
    case 'a_planifier': return { label: 'À faire', color: C.gray500, bg: C.gray100 };
    default: return { label: 'En retard', color: C.red, bg: C.redBg };
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  } catch {
    return dateStr;
  }
}

export function ExecSummarySlide({ data, printMode }: Props) {
  const score = data.confidenceScore?.score;
  const scoreColor = getScoreColor(score);
  const avancement = Math.round(data.avancementGlobal);
  const tempsConsomme = Math.round(data.pourcentageTempsEcoule);
  const retard = tempsConsomme - avancement;

  // Top 3 actions prioritaires (non terminées, triées par date la plus proche)
  const top3Actions = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return [...data.allActions]
      .filter(a => a.statut !== 'termine')
      .map(a => ({
        ...a,
        isLate: a.date_fin_prevue < todayStr && a.statut !== 'termine',
      }))
      .sort((a, b) => {
        // En retard d'abord, puis par date
        if (a.isLate !== b.isLate) return a.isLate ? -1 : 1;
        return a.date_fin_prevue.localeCompare(b.date_fin_prevue);
      })
      .slice(0, 3);
  }, [data.allActions]);

  // Highlights editing
  const [activeTab, setActiveTab] = useState<'realisations' | 'blocages' | 'alertes'>('realisations');
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');

  const handleStartEdit = () => {
    setEditText((data.highlights[activeTab] || []).join('\n'));
    setEditing(true);
  };

  const handleSaveEdit = () => {
    const lines = editText.split('\n').map(l => l.trim()).filter(Boolean);
    data.setHighlights({ ...data.highlights, [activeTab]: lines });
    setEditing(false);
  };

  return (
    <div>
      <SectionHeader
        title="Synthèse Exécutive"
        subtitle="Vue d'ensemble du projet"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
        {/* ============ COLONNE GAUCHE : SCORE SANTÉ ============ */}
        <SlideCard style={{ textAlign: 'center', padding: '24px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: C.gray500, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            Score Santé Projet
          </div>

          <Gauge
            value={score ?? 0}
            size={160}
            strokeWidth={6}
            color={scoreColor}
            showValue
          />

          <div style={{ fontSize: 11, color: C.gray400, marginTop: 4 }}>/100</div>

          <div style={{
            marginTop: 8, fontSize: 13, fontWeight: 600, color: scoreColor,
          }}>
            {score !== undefined
              ? score >= 80 ? 'Zone maîtrisée' : score >= 50 ? 'Vigilance requise' : 'Zone critique'
              : 'Non disponible'}
          </div>

          {/* Separator */}
          <div style={{ height: 1, backgroundColor: C.gray200, margin: '16px 0' }} />

          {/* Mini KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: C.gray500, marginBottom: 2 }}>Occupation</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.blue }}>{data.kpis.tauxOccupation}%</div>
              {(data.kpis.sousTachesOccupation ?? []).length > 0 && (
                <div style={{ fontSize: 9, color: C.gray500, marginTop: 2 }}>
                  {(data.kpis.sousTachesOccupation ?? []).map(st => `dont ${Math.round(st.avancement)}% ${st.libelle}`).join(' · ')}
                </div>
              )}
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.gray500, marginBottom: 2 }}>Budget engagé</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.purple }}>{Math.round(data.budgetSynthese.tauxEngagement)}%</div>
            </div>
          </div>
        </SlideCard>

        {/* ============ COLONNE DROITE ============ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* --- Avancement vs Temps Consommé --- */}
          <SlideCard>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 14 }}>
              Avancement vs Temps Consommé
            </div>

            {/* Avancement réel */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: C.gray600 }}>Avancement réel</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: avancement >= tempsConsomme ? C.green : C.orange }}>
                  {avancement}%
                </span>
              </div>
              <ProgressBar value={avancement} color={avancement >= tempsConsomme ? C.green : C.orange} height={6} showLabel={false} />
            </div>

            {/* Temps consommé */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: C.gray600 }}>Temps consommé</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.blue }}>
                  {tempsConsomme}%
                </span>
              </div>
              <ProgressBar value={tempsConsomme} color={C.blue} height={6} showLabel={false} />
            </div>

            {/* Alerte retard */}
            {retard > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: 8,
                backgroundColor: C.orangeBg, border: `1px solid ${C.orange}30`,
              }}>
                <span style={{ fontSize: 14, color: C.orange, fontWeight: 600 }}>!</span>
                <span style={{ fontSize: 12, color: C.gray700 }}>
                  L'avancement devrait être à ~{tempsConsomme}% pour être dans les temps. Retard de <strong>{retard} points</strong>.
                </span>
              </div>
            )}
          </SlideCard>

          {/* --- Top 3 Actions Prioritaires --- */}
          <SlideCard>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 12 }}>
              Top 3 Actions Prioritaires
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {top3Actions.map((action, i) => {
                const badge = action.isLate
                  ? { label: 'En retard', color: C.red, bg: C.redBg }
                  : getStatutBadge(action.statut);
                return (
                  <div
                    key={action.id_action}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 8,
                      backgroundColor: C.gray50,
                    }}
                  >
                    {/* Numéro */}
                    <span style={{ fontSize: 16, fontWeight: 600, color: C.gray300, width: 20, textAlign: 'center', flexShrink: 0 }}>
                      {i + 1}
                    </span>
                    {/* Dot */}
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      backgroundColor: action.isLate ? C.red : i === 0 ? C.red : C.gray400,
                    }} />
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {action.titre}
                      </div>
                      <div style={{ fontSize: 11, color: C.gray500, marginTop: 1 }}>
                        {action.responsable || '—'} · Échéance : {formatDate(action.date_fin_prevue)}
                      </div>
                    </div>
                    {/* Badge statut */}
                    <span style={{
                      padding: '3px 10px', borderRadius: 6, flexShrink: 0,
                      backgroundColor: badge.bg, color: badge.color,
                      fontSize: 11, fontWeight: 600,
                    }}>
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </SlideCard>
        </div>
      </div>

      {/* ============ FAITS MARQUANTS DU MOIS ============ */}
      <div style={{ marginTop: 20 }}>
        <SlideCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>Faits Marquants du Mois</span>
            </div>
            {!printMode && (
              <button
                onClick={() => editing ? handleSaveEdit() : handleStartEdit()}
                style={{
                  border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: 11, color: C.gold, fontWeight: 600,
                }}
              >
                {editing ? 'Sauver' : 'Éditer'}
              </button>
            )}
          </div>

          {printMode ? (
            /* Print mode: all 3 categories stacked */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {HIGHLIGHT_CATEGORIES.map(cat => {
                const items = data.highlights[cat.key] || [];
                return (
                  <div key={cat.key}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6,
                    }}>
                      <span style={{
                        display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                        backgroundColor: cat.color, flexShrink: 0,
                      }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: cat.color }}>
                        {cat.label} ({items.length})
                      </span>
                    </div>
                    {items.length === 0 ? (
                      <div style={{ color: C.gray400, fontSize: 12, fontStyle: 'italic', paddingLeft: 14 }}>
                        Aucun élément
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {items.map((item, i) => (
                          <div
                            key={i}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '8px 14px', borderRadius: 8,
                              backgroundColor: cat.bg,
                            }}
                          >
                            <span style={{ fontSize: 13, color: C.gray700 }}>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {HIGHLIGHT_CATEGORIES.map(cat => {
                  const count = (data.highlights[cat.key] || []).length;
                  const isActive = activeTab === cat.key;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => { setActiveTab(cat.key); setEditing(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '5px 14px', borderRadius: 99, border: 'none', cursor: 'pointer',
                        backgroundColor: isActive ? cat.bg : C.gray50,
                        color: isActive ? cat.color : C.gray500,
                        fontSize: 12, fontWeight: isActive ? 600 : 400,
                        transition: 'all 0.15s',
                      }}
                    >
                      {cat.label} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Content */}
              {editing ? (
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  placeholder="Un élément par ligne..."
                  style={{
                    width: '100%', minHeight: 100, padding: 10, borderRadius: 8,
                    border: `1px solid ${C.gray300}`, fontSize: 13, resize: 'vertical',
                    fontFamily: '"Exo 2", Inter, sans-serif',
                  }}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {(data.highlights[activeTab] || []).length === 0 ? (
                    <div style={{ color: C.gray400, fontSize: 12, fontStyle: 'italic', textAlign: 'center', padding: 16 }}>
                      Cliquer Éditer pour ajouter
                    </div>
                  ) : (
                    (data.highlights[activeTab] || []).map((item, i) => {
                      const cat = HIGHLIGHT_CATEGORIES.find(c => c.key === activeTab)!;
                      return (
                        <div
                          key={i}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 14px', borderRadius: 8,
                            backgroundColor: C.gray50,
                          }}
                        >
                          <span style={{ fontSize: 13, color: C.gray700 }}>{item}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}
        </SlideCard>
      </div>
    </div>
  );
}
