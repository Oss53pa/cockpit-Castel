import React from 'react';
import { C } from '../constants';
import { MetBadge } from '../components';
import type { ExcoV5Data } from '../hooks/useExcoV5Data';
import { PROJET_CONFIG } from '@/data/constants';

interface Props { data: ExcoV5Data }

export function CoverSlide({ data }: Props) {
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div
      style={{
        minHeight: 600,
        background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyLight} 100%)`,
        borderRadius: 16,
        padding: '60px 48px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: C.white,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative gold line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 4,
        background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight}, ${C.gold})`,
      }} />

      {/* Top section */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: C.gray400, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
          EXCO Mensuel
        </div>
        <h1 style={{ fontSize: 42, fontWeight: 600, margin: '0 0 8px', lineHeight: 1.1 }}>
          {PROJET_CONFIG.nom}
        </h1>
        <div style={{ fontSize: 18, color: C.goldLight, fontWeight: 500 }}>
          {data.moisCourant.charAt(0).toUpperCase() + data.moisCourant.slice(1)}
        </div>
        <div style={{ fontSize: 13, color: C.gray400, marginTop: 4 }}>
          {dateStr}
        </div>
      </div>

      {/* KPI encarts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 40 }}>
        <KpiEncart
          label="Ouverture"
          value={`J-${data.joursRestants}`}
          sub={new Date(data.openingDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        />
        <KpiEncart
          label="Avancement Global"
          value={`${Math.round(data.avancementGlobal)}%`}
          sub={`Cible ${Math.round(data.pourcentageTempsEcoule)}%`}
        />
        <KpiEncart
          label="Taux d'Occupation"
          value={`${Math.round(data.kpis.tauxOccupation)}%`}
          sub={`Cible ${PROJET_CONFIG.occupationCible}%${(data.kpis.sousTachesOccupation ?? []).length > 0 ? ' · ' + (data.kpis.sousTachesOccupation ?? []).map(st => `dont ${Math.round(st.avancement)}% ${st.libelle}`).join(' · ') : ''}`}
        />
        <KpiEncart
          label="Score Santé"
          value={data.confidenceScore ? `${data.confidenceScore.score}/100` : '—'}
          sub={<MetBadge level={data.meteoGlobale} size="sm" />}
        />
      </div>

      {/* Bottom */}
      <div style={{ marginTop: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ fontSize: 12, color: C.gray400 }}>
          {PROJET_CONFIG.confidentialite}
        </div>
        <div style={{ fontSize: 12, color: C.gray400 }}>
          {data.projectName}
        </div>
      </div>
    </div>
  );
}

function KpiEncart({ label, value, sub }: { label: string; value: string; sub: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: 'rgba(255,255,255,0.06)',
        border: `1px solid rgba(255,255,255,0.1)`,
        borderRadius: 12,
        padding: '20px 24px',
      }}
    >
      <div style={{ fontSize: 11, color: C.gray400, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: C.gold, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ marginTop: 8, fontSize: 13, color: C.gray400 }}>
        {sub}
      </div>
    </div>
  );
}
