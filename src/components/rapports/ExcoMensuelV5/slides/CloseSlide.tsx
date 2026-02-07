import React from 'react';
import { C } from '../constants';
import type { ExcoV5Data } from '../hooks/useExcoV5Data';
import { PROJET_CONFIG } from '@/data/constants';

interface Props { data: ExcoV5Data }

export function CloseSlide({ data }: Props) {
  return (
    <div
      style={{
        minHeight: 500,
        background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyLight} 100%)`,
        borderRadius: 16,
        padding: '80px 48px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: C.white,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top gold line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 4,
        background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight}, ${C.gold})`,
      }} />

      <h1 style={{ fontSize: 42, fontWeight: 600, margin: '0 0 8px', lineHeight: 1.1 }}>
        {PROJET_CONFIG.nom}
      </h1>

      <div style={{ fontSize: 20, color: C.goldLight, marginTop: 16, fontWeight: 300 }}>
        Merci
      </div>

      <div style={{
        width: 60, height: 2, backgroundColor: C.gold,
        margin: '24px 0', borderRadius: 1,
      }} />

      <div style={{ fontSize: 14, color: C.gray400, maxWidth: 400, lineHeight: 1.6 }}>
        Prochaine session : à planifier
      </div>
      <div style={{ fontSize: 13, color: C.gray400, marginTop: 8 }}>
        {data.projectName} — J-{data.joursRestants}
      </div>

      {/* Bottom */}
      <div style={{
        position: 'absolute', bottom: 20, left: 0, right: 0,
        fontSize: 11, color: C.gray400, textAlign: 'center',
      }}>
        {PROJET_CONFIG.confidentialite}
      </div>
    </div>
  );
}
