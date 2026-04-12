/**
 * ReportConfigPanel — Panneau de configuration réutilisable pour tous les rapports
 * Permet de choisir la période de reporting et les sections/sous-sections visibles
 */

import { useState } from 'react';
import { Settings2, Eye, EyeOff, ChevronDown, ChevronUp, Calendar } from 'lucide-react';

export interface ReportSection {
  id: string;
  title: string;
  icon: string;
  visible: boolean;
  children?: ReportSection[];
}

export interface ReportPeriodConfig {
  month: number;   // 0-11
  year: number;
}

interface ReportConfigPanelProps {
  sections: ReportSection[];
  onToggleSection: (sectionId: string) => void;
  period: ReportPeriodConfig;
  onPeriodChange: (period: ReportPeriodConfig) => void;
  accentColor?: string;
  defaultOpen?: boolean;
}

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

/** Count all visible items (sections + sub-sections) */
function countVisible(sections: ReportSection[]): { visible: number; total: number } {
  let visible = 0;
  let total = 0;
  for (const s of sections) {
    total++;
    if (s.visible) visible++;
    if (s.children) {
      for (const c of s.children) {
        total++;
        if (c.visible) visible++;
      }
    }
  }
  return { visible, total };
}

function SectionRow({
  section,
  onToggle,
  accentColor,
  indent = false,
}: {
  section: ReportSection;
  onToggle: (id: string) => void;
  accentColor: string;
  indent?: boolean;
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: indent ? '4px 10px 4px 28px' : '6px 10px',
        borderRadius: 6,
        cursor: 'pointer',
        transition: 'background 0.15s',
        background: section.visible ? 'transparent' : '#f9fafb',
        opacity: section.visible ? 1 : 0.5,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f3f4f6'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = section.visible ? 'transparent' : '#f9fafb'; }}
    >
      <input
        type="checkbox"
        checked={section.visible}
        onChange={() => onToggle(section.id)}
        style={{ accentColor, width: indent ? 12 : 14, height: indent ? 12 : 14, cursor: 'pointer' }}
      />
      {section.visible ? (
        <Eye size={indent ? 10 : 12} color="#6b7280" />
      ) : (
        <EyeOff size={indent ? 10 : 12} color="#d1d5db" />
      )}
      <span style={{
        fontSize: indent ? 11 : 12,
        fontWeight: indent ? 400 : 500,
        color: section.visible ? (indent ? '#6b7280' : '#374151') : '#9ca3af',
        textDecoration: section.visible ? 'none' : 'line-through',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {section.icon} {section.title}
      </span>
    </label>
  );
}

export function ReportConfigPanel({
  sections,
  onToggleSection,
  period,
  onPeriodChange,
  accentColor = '#1C3163',
  defaultOpen = false,
}: ReportConfigPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  const { visible: visibleCount, total: totalCount } = countVisible(sections);

  return (
    <div style={{ margin: '0 0 16px 0' }}>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: isOpen ? `${accentColor}10` : 'white',
          border: `1px solid ${isOpen ? accentColor : '#e5e7eb'}`,
          borderRadius: isOpen ? '10px 10px 0 0' : 10,
          padding: '10px 16px',
          cursor: 'pointer',
          width: '100%',
          transition: 'all 0.2s',
          color: accentColor,
        }}
      >
        <Settings2 size={16} />
        <span style={{ fontWeight: 600, fontSize: 13, flex: 1, textAlign: 'left' }}>
          Configuration du rapport
        </span>
        <span style={{ fontSize: 11, color: '#9ca3af', marginRight: 8 }}>
          {MONTHS_FR[period.month]} {period.year} · {visibleCount}/{totalCount} sections
        </span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* Panel content */}
      {isOpen && (
        <div style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          borderTop: 'none',
          borderRadius: '0 0 10px 10px',
          padding: 20,
          display: 'flex',
          gap: 24,
        }}>
          {/* Période */}
          <div style={{ minWidth: 240 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Calendar size={14} color={accentColor} />
              <span style={{ fontWeight: 700, fontSize: 12, color: accentColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Période de reporting
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <select
                value={period.month}
                onChange={(e) => onPeriodChange({ ...period, month: Number(e.target.value) })}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid #d1d5db',
                  fontSize: 13,
                  color: '#374151',
                  cursor: 'pointer',
                  background: 'white',
                }}
              >
                {MONTHS_FR.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
              <select
                value={period.year}
                onChange={(e) => onPeriodChange({ ...period, year: Number(e.target.value) })}
                style={{
                  width: 90,
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid #d1d5db',
                  fontSize: 13,
                  color: '#374151',
                  cursor: 'pointer',
                  background: 'white',
                }}
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Quick shortcuts */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[
                { label: 'Ce mois', m: new Date().getMonth(), y: currentYear },
                { label: 'Mois dernier', m: new Date().getMonth() === 0 ? 11 : new Date().getMonth() - 1, y: new Date().getMonth() === 0 ? currentYear - 1 : currentYear },
                { label: 'Il y a 2 mois', m: (new Date().getMonth() - 2 + 12) % 12, y: new Date().getMonth() < 2 ? currentYear - 1 : currentYear },
              ].map((shortcut) => (
                <button
                  key={shortcut.label}
                  onClick={() => onPeriodChange({ month: shortcut.m, year: shortcut.y })}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    background: period.month === shortcut.m && period.year === shortcut.y ? `${accentColor}15` : '#f9fafb',
                    fontSize: 11,
                    color: period.month === shortcut.m && period.year === shortcut.y ? accentColor : '#6b7280',
                    cursor: 'pointer',
                    fontWeight: period.month === shortcut.m && period.year === shortcut.y ? 600 : 400,
                  }}
                >
                  {shortcut.label}
                </button>
              ))}
            </div>
          </div>

          {/* Séparateur */}
          <div style={{ width: 1, background: '#e5e7eb' }} />

          {/* Sections visibles */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Eye size={14} color={accentColor} />
                <span style={{ fontWeight: 700, fontSize: 12, color: accentColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Sections visibles
                </span>
              </div>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>
                {visibleCount}/{totalCount} affichées
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 2,
              maxHeight: 300,
              overflowY: 'auto',
            }}>
              {sections.map((section) => (
                <div key={section.id}>
                  <SectionRow section={section} onToggle={onToggleSection} accentColor={accentColor} />
                  {section.children && section.visible && section.children.map((child) => (
                    <SectionRow key={child.id} section={child} onToggle={onToggleSection} accentColor={accentColor} indent />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportConfigPanel;
