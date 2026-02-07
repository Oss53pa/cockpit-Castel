import React, { useState, useMemo } from 'react';
import { C } from '../constants';
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

interface PointAttentionFull {
  id: string;
  sujet: string;
  dateCreation: string;
  transmis: boolean;
  responsableNom: string;
  actionTitre: string;
  actionId: string;
  axe: string;
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

type TabKey = 'attention' | 'pending' | 'recent';

export function DecisionsSlide({ data, printMode }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('attention');

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

  // Extract ALL unchecked points d'attention from actions
  const pointsAttention = useMemo(() => {
    const all: PointAttentionFull[] = [];

    for (const action of data.allActions) {
      const pa = (action as Record<string, unknown>).points_attention as
        Array<{ id: string; sujet: string; dateCreation: string; transmis?: boolean; responsableNom?: string }> | undefined;
      if (!pa) continue;
      for (const p of pa) {
        if (p.transmis) continue; // Only show unchecked/non-transmitted
        all.push({
          id: p.id,
          sujet: p.sujet,
          dateCreation: p.dateCreation,
          transmis: false,
          responsableNom: p.responsableNom || '',
          actionTitre: action.titre,
          actionId: action.id_action,
          axe: action.axe,
        });
      }
    }

    return all.sort((a, b) => a.dateCreation.localeCompare(b.dateCreation));
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
      <div style={{
        display: 'grid',
        gridTemplateColumns: decisions.length >= 3 ? 'repeat(3, 1fr)' : decisions.length === 2 ? 'repeat(2, 1fr)' : '1fr',
        gap: 10,
      }}>
        {decisions.map(dec => (
          <div
            key={dec.id}
            style={{
              padding: '12px 16px',
              backgroundColor: C.white,
              borderRadius: 8,
              border: `1px solid ${C.gray200}`,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 4 }}>
              {dec.sujet}
            </div>
            <div style={{ fontSize: 11, color: C.gray500, marginBottom: 4 }}>
              {dec.actionTitre}
            </div>
            <div style={{ fontSize: 10, color: C.gray400 }}>
              {dec.transmis ? '✓ Transmise' : `En attente · ${formatDateShort(dec.dateCreation)}`}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPointsAttentionList = (points: PointAttentionFull[]) => {
    if (points.length === 0) {
      return (
        <div style={{
          textAlign: 'center', padding: 30, color: C.gray400,
          fontSize: 13, fontStyle: 'italic',
        }}>
          Aucun point d'attention en attente
        </div>
      );
    }
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: points.length >= 3 ? 'repeat(3, 1fr)' : points.length === 2 ? 'repeat(2, 1fr)' : '1fr',
        gap: 10,
      }}>
        {points.map(pa => (
          <div
            key={pa.id}
            style={{
              padding: '12px 16px',
              backgroundColor: C.white,
              borderRadius: 8,
              border: `1px solid ${C.gray200}`,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 4 }}>
              {pa.sujet}
            </div>
            <div style={{ fontSize: 11, color: C.gray500, marginBottom: 4 }}>
              {pa.actionTitre}
            </div>
            <div style={{ fontSize: 10, color: C.gray400 }}>
              {pa.responsableNom ? `${pa.responsableNom} · ` : ''}{formatDateShort(pa.dateCreation)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <SectionHeader
        title="Décisions EXCO Requises"
        subtitle={`${pointsAttention.length} point${pointsAttention.length !== 1 ? 's' : ''} d'attention · ${pending.length} décision${pending.length !== 1 ? 's' : ''} en attente`}
      />

      {/* ============ 4 KPI CARDS ============ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {/* Points d'attention */}
        <SlideCard style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', margin: '0 auto 8px',
            backgroundColor: pointsAttention.length === 0 ? C.greenBg : C.orangeBg,
            border: `2px solid ${pointsAttention.length === 0 ? C.green : C.orange}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, color: pointsAttention.length === 0 ? C.green : C.orange, fontWeight: 600,
          }}>
            {pointsAttention.length === 0 ? '✓' : pointsAttention.length}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: pointsAttention.length === 0 ? C.green : C.orange }}>
            {pointsAttention.length === 0 ? 'RAS' : `${pointsAttention.length} point${pointsAttention.length !== 1 ? 's' : ''}`}
          </div>
          <div style={{ fontSize: 11, color: C.gray500 }}>Points d'attention</div>
        </SlideCard>

        {/* Status décisions */}
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
        /* Print mode: show all sections stacked */
        <>
          <div style={{
            fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 10,
            borderBottom: `2px solid ${C.gray200}`, paddingBottom: 8,
          }}>
            Points d'attention ({pointsAttention.length})
          </div>
          {renderPointsAttentionList(pointsAttention)}

          <div style={{
            fontSize: 13, fontWeight: 600, color: C.navy, marginTop: 20, marginBottom: 10,
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
          {/* ============ 3 TABS ============ */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <TabPill
              label={`Points d'attention (${pointsAttention.length})`}
              active={activeTab === 'attention'}
              onClick={() => setActiveTab('attention')}
              accentColor={pointsAttention.length > 0 ? C.orange : undefined}
            />
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

          {/* ============ TAB CONTENT ============ */}
          {activeTab === 'attention' && renderPointsAttentionList(pointsAttention)}
          {activeTab === 'pending' && renderDecisionList(pending, 'Aucune décision en attente')}
          {activeTab === 'recent' && renderDecisionList(recent, 'Aucune décision récente')}
        </>
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function TabPill({ label, active, onClick, accentColor }: {
  label: string;
  active: boolean;
  onClick: () => void;
  accentColor?: string;
}) {
  const activeBg = accentColor || C.navy;
  const activeBorder = accentColor || C.navy;
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 16px', borderRadius: 99,
        border: `1px solid ${active ? activeBorder : C.gray300}`,
        backgroundColor: active ? activeBg : C.white,
        color: active ? C.white : C.gray600,
        fontSize: 12, fontWeight: active ? 600 : 400,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}
