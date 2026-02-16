import { useState, useRef } from 'react';
import {
  Download,
  Upload,
  FileSpreadsheet,
  RefreshCw,
  ChevronDown,
  FileJson,
  FileDown,
  Database,
} from 'lucide-react';
import { Button, useToast } from '@/components/ui';
import { db } from '@/db';
import { useSeedData } from '@/hooks/useSeedData';
import type { BudgetItem } from '@/types';
import { PROJET_CONFIG } from '@/data/constants';
import { logger } from '@/lib/logger';

interface BudgetImportExportProps {
  budgetType: 'mobilisation' | 'operationnel' | 'estimatif';
}

// Template structure for budget import
const BUDGET_TEMPLATE = {
  version: '1.0',
  type: 'budget',
  description: `Template d'import budget ${PROJET_CONFIG.nom}`,
  colonnes: [
    'libelle (obligatoire)',
    'categorie (obligatoire)',
    'axe (rh/commercialisation/technique/budget/marketing/exploitation/general)',
    'projectPhase (pre_ouverture/soft_opening/inauguration/exploitation)',
    'montantPrevu (nombre)',
    'montantEngage (nombre)',
    'montantRealise (nombre)',
    'commentaire (optionnel)',
  ],
  exemple: [
    {
      libelle: 'Frais de recrutement',
      categorie: 'RH',
      axe: 'rh',
      projectPhase: 'pre_ouverture',
      montantPrevu: 25000000,
      montantEngage: 20000000,
      montantRealise: 15000000,
      commentaire: 'Cabinet RH selectionne',
    },
    {
      libelle: 'Formation initiale',
      categorie: 'Formation',
      axe: 'rh',
      projectPhase: 'pre_ouverture',
      montantPrevu: 15000000,
      montantEngage: 12000000,
      montantRealise: 8000000,
      commentaire: 'Programme 3 semaines',
    },
  ],
  data: [],
};

export function BudgetImportExport({ budgetType }: BudgetImportExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { seedBudget, isSeeding } = useSeedData();
  const toast = useToast();

  // Download template JSON
  const handleDownloadTemplate = () => {
    setShowDropdown(false);
    const blob = new Blob([JSON.stringify(BUDGET_TEMPLATE, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-budget-${budgetType}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export budget data to JSON
  const handleExportJSON = async () => {
    setIsExporting(true);
    setShowDropdown(false);
    try {
      const budgetData = await db.budget.toArray();
      // Filter by budget type if needed
      const filteredData = budgetType === 'mobilisation'
        ? budgetData.filter(b => b.projectPhase === 'pre_ouverture' || b.projectPhase === 'soft_opening' || b.projectPhase === 'inauguration')
        : budgetType === 'operationnel'
          ? budgetData.filter(b => b.projectPhase === 'exploitation')
          : budgetData;

      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        type: 'budget',
        budgetType,
        count: filteredData.length,
        totalPrevu: filteredData.reduce((sum, b) => sum + b.montantPrevu, 0),
        totalEngage: filteredData.reduce((sum, b) => sum + b.montantEngage, 0),
        totalRealise: filteredData.reduce((sum, b) => sum + b.montantRealise, 0),
        data: filteredData,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `budget-${budgetType}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      logger.error('Export error:', err);
      toast.error('Erreur', 'Erreur lors de l\'export JSON');
    } finally {
      setIsExporting(false);
    }
  };

  // Export budget data to CSV
  const handleExportCSV = async () => {
    setIsExporting(true);
    setShowDropdown(false);
    try {
      const budgetData = await db.budget.toArray();
      const filteredData = budgetType === 'mobilisation'
        ? budgetData.filter(b => b.projectPhase === 'pre_ouverture' || b.projectPhase === 'soft_opening' || b.projectPhase === 'inauguration')
        : budgetType === 'operationnel'
          ? budgetData.filter(b => b.projectPhase === 'exploitation')
          : budgetData;

      const headers = ['ID', 'Libelle', 'Categorie', 'Axe', 'Phase', 'Montant Prevu', 'Montant Engage', 'Montant Realise', 'Commentaire'];
      const rows = filteredData.map(b => [
        b.id || '',
        `"${b.libelle.replace(/"/g, '""')}"`,
        b.categorie,
        b.axe,
        b.projectPhase || '',
        b.montantPrevu,
        b.montantEngage,
        b.montantRealise,
        `"${(b.commentaire || '').replace(/"/g, '""')}"`,
      ]);
      const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `budget-${budgetType}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      logger.error('Export CSV error:', err);
      toast.error('Erreur', 'Erreur lors de l\'export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  // Import budget data from JSON
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      if (!importData.data || !Array.isArray(importData.data)) {
        throw new Error('Format de fichier invalide. Utilisez le template fourni.');
      }

      let importedCount = 0;
      await db.transaction('rw', [db.budget], async () => {
        for (const item of importData.data) {
          if (!item.libelle || !item.categorie) {
            continue; // Skip invalid items
          }
          const budgetItem: Omit<BudgetItem, 'id'> = {
            libelle: item.libelle,
            categorie: item.categorie,
            axe: item.axe || 'general',
            projectPhase: item.projectPhase || 'pre_ouverture',
            montantPrevu: item.montantPrevu || 0,
            montantEngage: item.montantEngage || 0,
            montantRealise: item.montantRealise || 0,
            commentaire: item.commentaire,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await db.budget.add(budgetItem as BudgetItem);
          importedCount++;
        }
      });

      toast.success('Import reussi', `${importedCount} poste(s) budgetaire(s) importe(s)`);

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      logger.error('Import error:', err);
      toast.error('Erreur d\'import', err instanceof Error ? err.message : 'Erreur lors de l\'import');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Load default budget data
  const handleLoadDefaultBudget = async () => {
    setShowDropdown(false);
    if (confirm(`Cette action va ajouter les donnees d'exploitation ${PROJET_CONFIG.nom}.\n\nContinuer ?`)) {
      try {
        await seedBudget();
        toast.success('Donnees chargees', `Les donnees ${PROJET_CONFIG.nom} ont ete ajoutees`);
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        toast.error('Erreur', `Echec du chargement des donnees ${PROJET_CONFIG.nom}`);
      }
    }
  };

  // Close dropdown when clicking outside
  const handleClickOutside = () => {
    if (showDropdown) setShowDropdown(false);
  };

  return (
    <div onClick={handleClickOutside}>
      {/* Toolbar Import/Export */}
      <div className="flex items-center justify-end gap-2 mb-4">
        {/* Input fichier cache */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />

        {/* Bouton Template */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownloadTemplate}
          title="Telecharger le template d'import"
        >
          <FileDown className="h-4 w-4 mr-2" />
          Template
        </Button>

        {/* Bouton Import */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
        >
          {isImporting ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          Importer
        </Button>

        {/* Dropdown Export */}
        <div className="relative">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
            disabled={isExporting}
          >
            {isExporting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Exporter
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>

          {showDropdown && (
            <div
              className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-primary-200 py-1 z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleExportJSON}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-primary-700 hover:bg-primary-50"
              >
                <FileJson className="h-4 w-4" />
                Export JSON
              </button>
              <button
                onClick={handleExportCSV}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-primary-700 hover:bg-primary-50"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export CSV (Excel)
              </button>
              <div className="border-t border-primary-100 my-1" />
              <button
                onClick={handleLoadDefaultBudget}
                disabled={isSeeding}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-primary-700 hover:bg-primary-50 disabled:opacity-50"
              >
                {isSeeding ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Database className="h-4 w-4" />
                )}
                {`Charger donnees ${PROJET_CONFIG.nom}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
