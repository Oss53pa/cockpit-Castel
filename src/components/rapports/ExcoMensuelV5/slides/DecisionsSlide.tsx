import React, { useState, useMemo } from 'react';
import { C, AXES_V5 } from '../constants';
import { SectionHeader, SlideCard } from '../components';
import type { ExcoV5Data } from '../hooks/useExcoV5Data';

interface Props { data: ExcoV5Data; printMode?: boolean }

interface DecisionFull {
  id: string;
  sujet: string;
  dateCreation: string;
  transmis: boolean;
  actionTitre: string;
  actionId: string;
  actionDateFin: string;
  axe: string;
  responsable: string;
}

function getUrgency(dateCreation: string): { label: string; color: string; bg: string } {
  const days = Math.floor((Date.now() - new Date(dateCreation).getTime()) / (1000 * 60 * 60 * 24));
  if (days > 30) return { label: 'Critique', color: C.red, bg: C.redBg };
  if (days > 14) return { label: 'Haute', color: C.orange, bg: C.orangeBg };
  return { label: 'Moyenne', color: C.blue, bg: C.blueBg };
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

export function DecisionsSlide({ data, printMode }: Props) {
  const [activeTab, setActiveTab] = useState<'pending' | 'recent'>('pending');

  // Extract ALL decisions from actions (pending + transmitted)
  const { pending, recent, transmisCount } = useMemo(() => {
    const allPending: DecisionFull[] = [];
    const allRecent: DecisionFull[] = [];
    let transmis = 0;

    for (const action of data.allActions) {
      const da = (action as Record<string, unknown>).decisions_attendues as
        Array<{ id: string; sujet: string; dateCreation: string; transmis?: boolean }> | undefined;
      if (!da) continue;
      for (const d of da) {
        const item: DecisionFull = {
          id: d.id,
          sujet: d.sujet,
          dateCreation: d.dateCreation,
          transmis: !!d.transmis,
          actionTitre: action.titre,
          actionId: action.id_action,
          actionDateFin: action.date_fin_prevue,
          axe: action.axe,
          responsable: action.responsable,
        };
        if (d.transmis) {
          transmis++;
          allRecent.push(item);
        } else {
          allPending.push(item);
        }
      }
    }

    return {
      pending: allPending.sort((a, b) => a.dateCreation.localeCompare(b.dateCreation)),
      recent: allRecent.sort((a, b) => b.dateCreation.localeCompare(a.dateCreation)).slice(0, 5),
      transmisCount: transmis,
    };
  }, [data.allActions]);

  const totalDecisions = transmisCount + pending.length;
  const tauxApprobation = totalDecisions > 0 ? Math.round((transmisCount / totalDecisions) * 100) : 100;
  const hasNoPending = pending.length === 0;

  // Délai moyen en jours (âge moyen des décisions en attente)
  const delaiMoyen = useMemo(() => {
    if (pending.length === 0) return null;
    const totalDays = pending.reduce((s, d) => {
      return s + Math.max(0, (Date.now() - new Date(d.dateCreation).getTime()) / (1000 * 60 * 60 * 24));
    }, 0);
    return (totalDays / pending.length).toFixed(1);
  }, [pending]);

  const displayDecisions = activeTab === 'pending' ? pending : recent;

  const renderDecisionList = (decisions: DecisionFull[], emptyMessage: string) => {
    if (decisions.length === 0) {
      return (
        <div style={{
          textAlign: 'center', padding: 30, color: C.gray400,
          fontSize: 13, fontStyle: 'italic',
        }}>
          {emptyMessage}
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {decisions.map(dec => {
          const urgency = getUrgency(dec.dateCreation);
          const axeCfg = AXES_V5.find(a => a.dbCode === dec.axe);
          const axeLabel = axeCfg?.label.split(' & ')[0] ?? dec.axe;

          return (
            <div
              key={dec.id}
              style={{
                padding: '16px 20px',
                backgroundColor: C.white,
                borderRadius: 10,
                border: `1px solid ${C.gray200}`,
              }}
            >
              {/* Header: badges left + date right */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 8,
              }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 4,
                    backgroundColor: C.blueBg, color: C.blue,
                    fontSize: 10, fontWeight: 600,
                  }}>
                    {axeLabel}
                  </span>
                  <span style={{
                    padding: '2px 8px', borderRadius: 4,
                    backgroundColor: urgency.bg, color: urgency.color,
                    fontSize: 10, fontWeight: 600,
                  }}>
                    {urgency.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: C.gray500 }}>
                    Prévu {formatDateShort(dec.actionDateFin)}
                  </span>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    backgroundColor: dec.transmis ? C.greenBg : C.gray100,
                    border: `1.5px solid ${dec.transmis ? C.green : C.gray300}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 600,
                    color: dec.transmis ? C.green : C.gray400,
                  }}>
                    {dec.transmis ? '✓' : '?'}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 4 }}>
                {dec.sujet}
              </div>

              {/* Description = action title */}
              <div style={{ fontSize: 12, color: C.gray500, lineHeight: 1.4 }}>
                {dec.actionTitre}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <SectionHeader
        title="Décisions EXCO Requises"
        subtitle={`${pending.length} décision${pending.length !== 1 ? 's' : ''} en attente de transmission`}
      />

      {/* ============ 4 KPI CARDS ============ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {/* Status */}
        <SlideCard style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', margin: '0 auto 8px',
            backgroundColor: hasNoPending ? C.greenBg : C.orangeBg,
            border: `2px solid ${hasNoPending ? C.green : C.orange}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, color: hasNoPending ? C.green : C.orange, fontWeight: 600,
          }}>
            {hasNoPending ? '✓' : '!'}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: hasNoPending ? C.green : C.orange }}>
            {hasNoPending ? 'Tout à jour' : `${pending.length} en attente`}
          </div>
          <div style={{ fontSize: 11, color: C.gray500 }}>
            {hasNoPending ? 'Aucune décision bloquante' : 'Décision(s) requise(s)'}
          </div>
        </SlideCard>

        {/* Décisions prises */}
        <SlideCard style={{ padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.navy }}>{transmisCount}</div>
          <div style={{ fontSize: 12, color: C.gray500 }}>Décisions prises</div>
        </SlideCard>

        {/* Délai moyen */}
        <SlideCard style={{ padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: delaiMoyen ? C.orange : C.green }}>
            {delaiMoyen ? `${delaiMoyen}j` : '—'}
          </div>
          <div style={{ fontSize: 12, color: C.gray500 }}>Délai moyen réponse</div>
        </SlideCard>

        {/* Taux approbation */}
        <SlideCard style={{ padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: tauxApprobation >= 80 ? C.green : C.orange }}>
            {tauxApprobation}%
          </div>
          <div style={{ fontSize: 12, color: C.gray500 }}>Taux approbation</div>
        </SlideCard>
      </div>

      {printMode ? (
        /* Print mode: show both sections stacked */
        <>
          <div style={{
            fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 10,
            borderBottom: `2px solid ${C.gray200}`, paddingBottom: 8,
          }}>
            Prochaines décisions ({pending.length})
          </div>
          {renderDecisionList(pending, 'Aucune décision en attente')}

          <div style={{
            fontSize: 13, fontWeight: 600, color: C.navy, marginTop: 20, marginBottom: 10,
            borderBottom: `2px solid ${C.gray200}`, paddingBottom: 8,
          }}>
            Décisions récentes ({recent.length})
          </div>
          {renderDecisionList(recent, 'Aucune décision récente')}
        </>
      ) : (
        <>
          {/* ============ TABS ============ */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <TabPill
              label={`Prochaines décisions (${pending.length})`}
              active={activeTab === 'pending'}
              onClick={() => setActiveTab('pending')}
            />
            <TabPill
              label={`Décisions récentes (${recent.length})`}
              active={activeTab === 'recent'}
              onClick={() => setActiveTab('recent')}
            />
          </div>

          {/* ============ DECISION CARDS ============ */}
          {renderDecisionList(displayDecisions, activeTab === 'pending' ? 'Aucune décision en attente' : 'Aucune décision récente')}
        </>
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function TabPill({ label, active, onClick }: {
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
