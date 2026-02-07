// ============================================================================
// PARAMÈTRES MÉTIER SETTINGS — Directive CRMC Règle 1
// UI Admin pour modifier les seuils et paramètres métier stockés en DB
// ============================================================================

import { useState, useCallback } from 'react';
import { Save, RotateCcw, ChevronDown, ChevronRight, Download, Upload } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import {
  useParametreMetier,
  saveParametreMetier,
  resetParametreMetier,
  getParametreDefaults,
} from '@/hooks/useParametresMetier';
import type { ParametreMetierCategory, ParametresMetierCategories } from '@/types/parametresMetier';

// ============================================================================
// CONFIGURATION DES GROUPES
// ============================================================================

interface ParamGroup {
  key: ParametreMetierCategory;
  label: string;
  description: string;
}

const GROUPS: ParamGroup[] = [
  { key: 'seuils_risques', label: 'Seuils Risques', description: 'Niveaux critique/majeur/modéré par score' },
  { key: 'seuils_chemin_critique', label: 'Chemin Critique', description: 'Marges et seuils du chemin critique' },
  { key: 'seuils_sante_axe', label: 'Santé Axe', description: 'Poids, pénalités, seuils météo par axe' },
  { key: 'seuils_meteo_dashboard', label: 'Météo Dashboard', description: 'Seuils alertes pour météo dashboard' },
  { key: 'seuils_meteo_report', label: 'Météo Report V5', description: 'Seuils pour deriveAxeMeteo & deriveGlobalMeteo' },
  { key: 'seuils_meteo_copil', label: 'Météo COPIL', description: 'Seuils météo globale COPIL' },
  { key: 'seuils_meteo_axe_dashboard', label: 'Météo Axe Dashboard', description: 'Seuils écart météo par axe' },
  { key: 'seuils_sync_report', label: 'Sync Report', description: 'Seuils synchronisation construction/mobilisation' },
  { key: 'seuils_kpi_report', label: 'KPI Report', description: 'Seuils KPI dashboard et EXCO' },
  { key: 'seuils_confidence', label: 'Score Confiance', description: 'Pénalités risques sur le score de confiance' },
  { key: 'seuils_ui', label: 'Interface UI', description: 'Seuils d\'affichage (compte à rebours, top N)' },
  { key: 'axes_config', label: 'Axes Stratégiques', description: 'Poids, couleurs, labels des axes' },
  { key: 'projet_config', label: 'Configuration Projet', description: 'Dates, surfaces, coûts, paramètres généraux' },
  { key: 'meteo_styles', label: 'Styles Météo', description: 'Labels, emojis, couleurs CSS des météos' },
];

// ============================================================================
// COMPOSANT ÉDITEUR POUR UN GROUPE
// ============================================================================

function GroupEditor({ group }: { group: ParamGroup }) {
  const currentValue = useParametreMetier(group.key);
  const defaults = getParametreDefaults(group.key);
  const [editValue, setEditValue] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEditing = useCallback(() => {
    setEditValue(JSON.stringify(currentValue, null, 2));
    setIsEditing(true);
    setError(null);
  }, [currentValue]);

  const handleSave = useCallback(async () => {
    try {
      const parsed = JSON.parse(editValue);
      setSaving(true);
      setError(null);
      await saveParametreMetier(group.key, parsed);
      setIsEditing(false);
    } catch (e) {
      setError(e instanceof SyntaxError ? 'JSON invalide' : String(e));
    } finally {
      setSaving(false);
    }
  }, [editValue, group.key]);

  const handleReset = useCallback(async () => {
    if (!window.confirm(`Réinitialiser "${group.label}" aux valeurs par défaut ?`)) return;
    await resetParametreMetier(group.key);
    setIsEditing(false);
  }, [group.key, group.label]);

  const isCustomized = JSON.stringify(currentValue) !== JSON.stringify(defaults);

  return (
    <div className="border border-primary-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-primary-900">{group.label}</h4>
          {isCustomized && <Badge variant="info">personnalisé</Badge>}
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button size="sm" variant="secondary" onClick={startEditing}>
              Modifier
            </Button>
          ) : (
            <>
              <Button size="sm" variant="secondary" onClick={() => setIsEditing(false)}>
                Annuler
              </Button>
              <Button size="sm" variant="secondary" onClick={handleReset}>
                <RotateCcw className="h-3 w-3 mr-1" />
                Défaut
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-3 w-3 mr-1" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </>
          )}
        </div>
      </div>
      <p className="text-xs text-primary-500 mb-2">{group.description}</p>

      {isEditing ? (
        <div>
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full h-64 font-mono text-xs border border-primary-200 rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            spellCheck={false}
          />
          {error && <p className="text-error-600 text-xs mt-1">{error}</p>}
        </div>
      ) : (
        <pre className="text-xs text-primary-600 bg-primary-50 rounded p-2 max-h-32 overflow-auto font-mono">
          {JSON.stringify(currentValue, null, 2)}
        </pre>
      )}
    </div>
  );
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function ParametresMetierSettings() {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleExportAll = useCallback(async () => {
    const allParams: Record<string, unknown> = {};
    for (const group of GROUPS) {
      const { getParametreMetier } = await import('@/hooks/useParametresMetier');
      allParams[group.key] = await getParametreMetier(group.key);
    }
    const json = JSON.stringify(allParams, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parametres-metier-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleImportAll = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text) as Record<string, unknown>;
        for (const [key, value] of Object.entries(data)) {
          if (GROUPS.some(g => g.key === key)) {
            await saveParametreMetier(
              key as ParametreMetierCategory,
              value as Partial<ParametresMetierCategories[ParametreMetierCategory]>
            );
          }
        }
        window.alert('Import réussi ! Les paramètres ont été mis à jour.');
      } catch {
        window.alert('Erreur lors de l\'import. Vérifiez le format JSON.');
      }
    };
    input.click();
  }, []);

  return (
    <div className="space-y-4">
      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-primary-900">Paramètres métier</h3>
            <p className="text-sm text-primary-500">
              Seuils, poids et labels modifiables sans toucher au code (Directive CRMC - Règle 1)
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={handleExportAll}>
              <Download className="h-4 w-4 mr-1" />
              Exporter
            </Button>
            <Button size="sm" variant="secondary" onClick={handleImportAll}>
              <Upload className="h-4 w-4 mr-1" />
              Importer
            </Button>
          </div>
        </div>
      </Card>

      {GROUPS.map((group) => {
        const isExpanded = expandedGroups.has(group.key);
        return (
          <Card key={group.key} padding="sm">
            <button
              onClick={() => toggleGroup(group.key)}
              className="w-full flex items-center justify-between p-2 hover:bg-primary-50 rounded"
            >
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-primary-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-primary-400" />
                )}
                <span className="font-medium text-primary-900">{group.label}</span>
                <span className="text-xs text-primary-400">{group.description}</span>
              </div>
            </button>
            {isExpanded && (
              <div className="mt-2">
                <GroupEditor group={group} />
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
