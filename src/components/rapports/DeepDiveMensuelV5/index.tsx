/**
 * Deep Dive Mensuel V5 — Main Component
 * Layout, navigation (sidebar, keyboard, pagination dots), sticky header
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { C, SLIDES } from './constants';
import { MetBadge } from './components';
import { useDeepDiveV5Data } from './hooks/useDeepDiveV5Data';
import type { DeepDiveV5Data } from './hooks/useDeepDiveV5Data';

// Slide imports
import { CoverSlide } from './slides/CoverSlide';
import { AgendaSlide } from './slides/AgendaSlide';
import { ExecSummarySlide } from './slides/ExecSummarySlide';
import { TrajectorySlide } from './slides/TrajectorySlide';
import { CriticalPathSlide } from './slides/CriticalPathSlide';
import { DashboardSlide } from './slides/DashboardSlide';
import { ScorecardSlide } from './slides/ScorecardSlide';
import { HighlightsSlide } from './slides/HighlightsSlide';
import { AxeSlide } from './slides/AxeSlide';
import { SyncSlide } from './slides/SyncSlide';
import { RisksSlide } from './slides/RisksSlide';
import { ScenariosSlide } from './slides/ScenariosSlide';
import { DecisionsSlide } from './slides/DecisionsSlide';
import { CloseSlide } from './slides/CloseSlide';

const TOTAL_SLIDES = SLIDES.length;

// ============================================================================
// SLIDE RENDERER
// ============================================================================

function renderSlide(index: number, data: DeepDiveV5Data, goToSlide: (n: number) => void): React.ReactNode {
  const slide = SLIDES[index];
  if (!slide) return null;

  switch (slide.id) {
    case 'cover':         return <CoverSlide data={data} />;
    case 'agenda':        return <AgendaSlide data={data} goToSlide={goToSlide} />;
    case 'exec-summary':  return <ExecSummarySlide data={data} />;
    case 'trajectory':    return <TrajectorySlide data={data} />;
    case 'critical-path': return <CriticalPathSlide data={data} />;
    case 'dashboard':     return <DashboardSlide data={data} />;
    case 'scorecard':     return <ScorecardSlide data={data} />;
    case 'highlights':    return <HighlightsSlide data={data} />;
    case 'axe-rh':        return <AxeSlide data={data} axeId="rh" />;
    case 'axe-commercial':return <AxeSlide data={data} axeId="commercial" />;
    case 'axe-technique': return <AxeSlide data={data} axeId="technique" />;
    case 'axe-construction': return <AxeSlide data={data} axeId="construction" />;
    case 'axe-budget':    return <AxeSlide data={data} axeId="budget" />;
    case 'axe-marketing': return <AxeSlide data={data} axeId="marketing" />;
    case 'axe-exploitation': return <AxeSlide data={data} axeId="exploitation" />;
    case 'axe-divers':    return <AxeSlide data={data} axeId="divers" />;
    case 'sync':          return <SyncSlide data={data} />;
    case 'risks':         return <RisksSlide data={data} />;
    case 'scenarios':     return <ScenariosSlide data={data} />;
    case 'decisions':     return <DecisionsSlide data={data} />;
    case 'close':         return <CloseSlide data={data} />;
    default:              return null;
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DeepDiveMensuelV5() {
  const data = useDeepDiveV5Data();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);

  // Navigation
  const goToSlide = useCallback((n: number) => {
    setCurrentSlide(Math.max(0, Math.min(TOTAL_SLIDES - 1, n)));
    slideRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const prev = useCallback(() => goToSlide(currentSlide - 1), [currentSlide, goToSlide]);
  const next = useCallback(() => goToSlide(currentSlide + 1), [currentSlide, goToSlide]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft') { prev(); e.preventDefault(); }
      if (e.key === 'ArrowRight') { next(); e.preventDefault(); }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prev, next]);

  const slideConfig = SLIDES[currentSlide];

  // Loading
  if (data.isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: C.gray500 }}>
        <div className="animate-spin h-8 w-8 border-4 border-gray-300 rounded-full" style={{ borderTopColor: C.gold }} />
        <span className="ml-3">Chargement des données...</span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* ============ STICKY HEADER ============ */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px',
          backgroundColor: C.navy,
          color: C.white,
          borderBottom: `2px solid ${C.gold}`,
        }}
      >
        {/* Left: hamburger + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'none', border: 'none', color: C.white, cursor: 'pointer',
              fontSize: 20, padding: '4px 8px', borderRadius: 6,
            }}
            title="Menu des slides"
          >
            ☰
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>
            COSM<span style={{ color: C.gold }}>●</span>S ANGRÉ
          </span>
          <span style={{ fontSize: 13, color: C.gray400, marginLeft: 8 }}>
            Deep Dive Mensuel — {data.moisCourant}
          </span>
        </div>

        {/* Right: météo, J-X, slide counter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <MetBadge level={data.meteoGlobale} size="sm" />
          <span style={{ fontSize: 14, fontWeight: 600, color: C.gold }}>
            J-{data.joursRestants}
          </span>
          <span style={{ fontSize: 13, color: C.gray400 }}>
            {currentSlide + 1}/{TOTAL_SLIDES}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', position: 'relative' }}>
        {/* ============ SIDEBAR ============ */}
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setSidebarOpen(false)}
              style={{
                position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)',
                zIndex: 40,
              }}
            />
            <div
              style={{
                position: 'fixed', left: 0, top: 0, bottom: 0,
                width: 300, backgroundColor: C.white, zIndex: 45,
                boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
                overflowY: 'auto',
                paddingTop: 60,
              }}
            >
              <div style={{ padding: '0 12px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.gray400, textTransform: 'uppercase', letterSpacing: 1, padding: '12px 8px 8px' }}>
                  Slides
                </div>
                {SLIDES.map((slide, idx) => {
                  const isActive = idx === currentSlide;
                  return (
                    <button
                      key={slide.id}
                      onClick={() => { goToSlide(idx); setSidebarOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        width: '100%', textAlign: 'left',
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: isActive ? C.goldBg : 'transparent',
                        borderLeft: isActive ? `3px solid ${C.gold}` : '3px solid transparent',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{
                        fontSize: 11, fontWeight: 600, color: isActive ? C.gold : C.gray400,
                        minWidth: 22, textAlign: 'center',
                      }}>
                        {String(slide.number).padStart(2, '0')}
                      </span>
                      <span style={{
                        fontSize: 13, fontWeight: isActive ? 600 : 400,
                        color: isActive ? C.navy : C.gray600,
                      }}>
                        {slide.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ============ MAIN SLIDE AREA ============ */}
        <div
          ref={slideRef}
          style={{
            flex: 1,
            minHeight: 'calc(100vh - 52px)',
            backgroundColor: C.offWhite,
            overflow: 'auto',
          }}
        >
          {/* Slide content */}
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 80px' }}>
            {renderSlide(currentSlide, data, goToSlide)}
          </div>

          {/* ============ BOTTOM NAVIGATION ============ */}
          <div
            style={{
              position: 'fixed',
              bottom: 0, left: 0, right: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              padding: '12px 20px',
              backgroundColor: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(8px)',
              borderTop: `1px solid ${C.gray200}`,
              zIndex: 30,
            }}
          >
            {/* Prev */}
            <button
              onClick={prev}
              disabled={currentSlide === 0}
              style={{
                padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.gray200}`,
                backgroundColor: C.white, cursor: currentSlide === 0 ? 'default' : 'pointer',
                opacity: currentSlide === 0 ? 0.4 : 1,
                fontSize: 13, fontWeight: 500, color: C.gray700,
              }}
            >
              ← Précédent
            </button>

            {/* Pagination dots */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToSlide(idx)}
                  style={{
                    width: idx === currentSlide ? 16 : 5,
                    height: 5,
                    borderRadius: 3,
                    border: 'none',
                    backgroundColor: idx === currentSlide ? C.gold : C.gray300,
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'all 0.2s ease',
                  }}
                  title={SLIDES[idx].title}
                />
              ))}
            </div>

            {/* Next */}
            <button
              onClick={next}
              disabled={currentSlide === TOTAL_SLIDES - 1}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none',
                backgroundColor: currentSlide === TOTAL_SLIDES - 1 ? C.gray300 : C.navy,
                cursor: currentSlide === TOTAL_SLIDES - 1 ? 'default' : 'pointer',
                fontSize: 13, fontWeight: 500, color: C.white,
              }}
            >
              Suivant →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeepDiveMensuelV5;
