import React, { useState } from 'react';
import { C } from '../constants';
import { SectionHeader, SlideCard } from '../components';
import type { DeepDiveV5Data, HighlightsData } from '../hooks/useDeepDiveV5Data';

interface Props { data: DeepDiveV5Data }

const CATEGORIES: Array<{
  key: keyof HighlightsData;
  label: string;
  icon: string;
  color: string;
  bg: string;
  placeholder: string;
}> = [
  { key: 'realisations', label: 'Réalisations', icon: '✅', color: C.green, bg: C.greenBg, placeholder: 'Ex: Signature bail locataire ancre…' },
  { key: 'blocages', label: 'Blocages', icon: '🚧', color: C.orange, bg: C.orangeBg, placeholder: 'Ex: Retard livraison CFA 2 semaines…' },
  { key: 'alertes', label: 'Alertes', icon: '⚠️', color: C.red, bg: C.redBg, placeholder: 'Ex: Budget dépassé sur lot électricité…' },
];

export function HighlightsSlide({ data }: Props) {
  const { highlights, setHighlights } = data;
  const [editingCategory, setEditingCategory] = useState<keyof HighlightsData | null>(null);
  const [newItem, setNewItem] = useState('');

  const handleAdd = (cat: keyof HighlightsData) => {
    if (!newItem.trim()) return;
    setHighlights({
      ...highlights,
      [cat]: [...highlights[cat], newItem.trim()],
    });
    setNewItem('');
  };

  const handleRemove = (cat: keyof HighlightsData, index: number) => {
    setHighlights({
      ...highlights,
      [cat]: highlights[cat].filter((_, i) => i !== index),
    });
  };

  const totalItems = highlights.realisations.length + highlights.blocages.length + highlights.alertes.length;

  return (
    <div>
      <SectionHeader
        title="Faits Marquants du Mois"
        subtitle={`${totalItems} élément${totalItems > 1 ? 's' : ''} — Réalisations, blocages et alertes`}
        icon="📌"
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {CATEGORIES.map(cat => {
          const items = highlights[cat.key];
          const isEditing = editingCategory === cat.key;

          return (
            <SlideCard key={cat.key} accentColor={cat.color} accentPosition="top">
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    backgroundColor: cat.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                  }}>
                    {cat.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{cat.label}</div>
                    <div style={{ fontSize: 11, color: C.gray400 }}>{items.length} élément{items.length > 1 ? 's' : ''}</div>
                  </div>
                </div>
                <button
                  onClick={() => { setEditingCategory(isEditing ? null : cat.key); setNewItem(''); }}
                  style={{
                    background: 'none', border: `1px solid ${C.gray200}`, borderRadius: 6,
                    padding: '4px 10px', fontSize: 11, color: C.gray500, cursor: 'pointer',
                  }}
                >
                  {isEditing ? 'Fermer' : '✏️ Éditer'}
                </button>
              </div>

              {/* Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 120 }}>
                {items.length === 0 && !isEditing && (
                  <div style={{ textAlign: 'center', padding: 24, color: C.gray300, fontSize: 13 }}>
                    Aucun élément
                  </div>
                )}
                {items.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 8,
                      padding: '10px 12px',
                      backgroundColor: cat.bg,
                      borderRadius: 8,
                      fontSize: 13,
                      color: C.gray700,
                      lineHeight: 1.5,
                    }}
                  >
                    <span style={{ color: cat.color, flexShrink: 0, marginTop: 1 }}>●</span>
                    <span style={{ flex: 1 }}>{item}</span>
                    {isEditing && (
                      <button
                        onClick={() => handleRemove(cat.key, i)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: C.red, fontSize: 14, padding: '0 2px', flexShrink: 0,
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add form */}
              {isEditing && (
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <input
                    value={newItem}
                    onChange={e => setNewItem(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd(cat.key)}
                    placeholder={cat.placeholder}
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: 8,
                      border: `1px solid ${C.gray200}`, fontSize: 12,
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => handleAdd(cat.key)}
                    disabled={!newItem.trim()}
                    style={{
                      padding: '8px 14px', borderRadius: 8, border: 'none',
                      backgroundColor: newItem.trim() ? cat.color : C.gray200,
                      color: C.white, fontSize: 12, fontWeight: 600,
                      cursor: newItem.trim() ? 'pointer' : 'default',
                    }}
                  >
                    +
                  </button>
                </div>
              )}
            </SlideCard>
          );
        })}
      </div>
    </div>
  );
}
