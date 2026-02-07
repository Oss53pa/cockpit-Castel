import React from 'react';
import { C, SLIDES } from '../constants';
import { SectionHeader } from '../components';
import type { ExcoV5Data } from '../hooks/useExcoV5Data';

interface Props {
  data: ExcoV5Data;
  goToSlide: (n: number) => void;
  printMode?: boolean;
}

const SECTIONS = [
  { label: 'Ouverture', slides: [0, 1], duree: '5 min' },
  { label: 'Synthèse Stratégique', slides: [2, 3, 4], duree: '20 min' },
  { label: 'KPIs & Scorecard', slides: [5, 6], duree: '10 min' },
  { label: 'EXCO par Axe (×8)', slides: [7, 8, 9, 10, 11, 12, 13, 14], duree: '40 min' },
  { label: 'Transverse', slides: [15, 16], duree: '10 min' },
  { label: 'Décisions & Clôture', slides: [17, 18, 19], duree: '10 min' },
];

export function AgendaSlide({ data, goToSlide, printMode }: Props) {
  return (
    <div>
      <SectionHeader
        title="Agenda"
        subtitle="~1h35 — 20 slides"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {SECTIONS.map((section, sIdx) => (
          <div
            key={sIdx}
            style={{
              backgroundColor: C.white,
              borderRadius: 10,
              border: `1px solid ${C.gray200}`,
              overflow: 'hidden',
            }}
          >
            {/* Section header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 20px',
                backgroundColor: C.gray50,
                borderBottom: `1px solid ${C.gray200}`,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>
                {section.label}
              </span>
              <span style={{
                fontSize: 12, color: C.gray500,
                backgroundColor: C.gray100, padding: '2px 10px', borderRadius: 99,
              }}>
                {section.duree}
              </span>
            </div>

            {/* Slide items */}
            <div style={{ padding: '4px 8px' }}>
              {section.slides.map(slideIdx => {
                const slide = SLIDES[slideIdx];
                if (!slide) return null;
                const Tag = printMode ? 'div' : 'button';
                return (
                  <Tag
                    key={slide.id}
                    {...(!printMode ? {
                      onClick: () => goToSlide(slideIdx),
                      onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = C.goldBg),
                      onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = 'transparent'),
                    } : {})}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      width: '100%', textAlign: 'left' as const,
                      padding: '10px 12px', border: 'none', borderRadius: 8,
                      backgroundColor: 'transparent', cursor: printMode ? 'default' : 'pointer',
                      transition: 'background-color 0.15s',
                    }}
                  >
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: C.gold,
                      minWidth: 24, textAlign: 'center',
                      backgroundColor: C.goldBg, borderRadius: 4, padding: '2px 6px',
                    }}>
                      {String(slide.number).padStart(2, '0')}
                    </span>
                    <span style={{ fontSize: 13, color: C.gray700 }}>
                      {slide.title}
                    </span>
                  </Tag>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
