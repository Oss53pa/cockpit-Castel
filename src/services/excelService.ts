// ============================================================================
// SERVICE EXCEL IMPORT/EXPORT (spécifications v2.0)
// ============================================================================

import * as XLSX from 'xlsx';
import type { Jalon, Action, Risque, SousTache, User } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

interface ExportColumn<T> {
  key: keyof T | string;
  header: string;
  width?: number;
  transform?: (value: unknown, row: T) => string | number;
}

interface ImportResult<T> {
  success: boolean;
  data: Partial<T>[];
  errors: { row: number; message: string }[];
  warnings: { row: number; message: string }[];
}

// ============================================================================
// UTILITAIRES
// ============================================================================

function formatDate(date: Date | string | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR');
}

function parseDate(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().split('T')[0];
  if (typeof value === 'number') {
    // Date Excel (nombre de jours depuis 1900)
    const date = new Date((value - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }
  if (typeof value === 'string') {
    // Tenter de parser une chaîne DD/MM/YYYY
    const parts = value.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed.toISOString().split('T')[0];
  }
  return null;
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Export générique vers Excel
 */
function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string,
  sheetName: string
): void {
  // Préparer les headers
  const headers = columns.map(col => col.header);

  // Préparer les lignes
  const rows = data.map(item => {
    return columns.map(col => {
      const value = col.key.includes('.')
        ? col.key.split('.').reduce((obj, key) => (obj as Record<string, unknown>)?.[key], item)
        : item[col.key as keyof T];

      if (col.transform) {
        return col.transform(value, item);
      }
      if (value instanceof Date) return formatDate(value);
      if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
      if (Array.isArray(value)) return value.join(', ');
      return value ?? '';
    });
  });

  // Créer le workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Appliquer les largeurs de colonnes
  ws['!cols'] = columns.map(col => ({ wch: col.width || 15 }));

  // Ajouter la feuille
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Télécharger
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Export des jalons vers Excel
 */
export function exportJalons(jalons: Jalon[]): void {
  const columns: ExportColumn<Jalon>[] = [
    { key: 'id_jalon', header: 'Code', width: 15 },
    { key: 'titre', header: 'Libellé', width: 45 },
    { key: 'axe', header: 'Axe', width: 20 },
    { key: 'date_debut_prevue', header: 'Date début', width: 12, transform: (v) => formatDate(v as string) },
    { key: 'date_prevue', header: 'Échéance', width: 12, transform: (v) => formatDate(v as string) },
    { key: 'responsable', header: 'Responsable', width: 20 },
    { key: 'statut', header: 'Statut', width: 12 },
    { key: 'avancement_prealables', header: '% Avancement', width: 12 },
    { key: 'description', header: 'Description', width: 40 },
  ];

  exportToExcel(jalons as unknown as Record<string, unknown>[], columns, 'jalons', 'Jalons');
}

/**
 * Export des actions vers Excel
 */
export function exportActions(actions: Action[]): void {
  const columns: ExportColumn<Action>[] = [
    { key: 'id_action', header: 'Code', width: 15 },
    { key: 'titre', header: 'Libellé', width: 45 },
    { key: 'axe', header: 'Axe', width: 20 },
    { key: 'date_debut_prevue', header: 'Date début', width: 12, transform: (v) => formatDate(v as string) },
    { key: 'date_fin_prevue', header: 'Échéance', width: 12, transform: (v) => formatDate(v as string) },
    { key: 'responsable', header: 'Responsable', width: 20 },
    { key: 'statut', header: 'Statut', width: 12 },
    { key: 'avancement', header: '% Avancement', width: 12 },
    { key: 'priorite', header: 'Priorité', width: 10 },
    { key: 'description', header: 'Description', width: 40 },
  ];

  exportToExcel(actions as unknown as Record<string, unknown>[], columns, 'actions', 'Actions');
}

/**
 * Export des risques vers Excel
 */
export function exportRisques(risques: Risque[]): void {
  const columns: ExportColumn<Risque>[] = [
    { key: 'id_risque', header: 'Code', width: 12 },
    { key: 'titre', header: 'Risque', width: 45 },
    { key: 'categorie', header: 'Catégorie', width: 15 },
    { key: 'probabilite_actuelle', header: 'Probabilité', width: 12 },
    { key: 'impact_actuel', header: 'Impact', width: 12 },
    { key: 'score_actuel', header: 'Criticité', width: 10 },
    { key: 'proprietaire', header: 'Responsable', width: 20 },
    { key: 'statut', header: 'Statut', width: 12 },
    { key: 'plan_mitigation', header: 'Mitigation', width: 40 },
  ];

  exportToExcel(risques as unknown as Record<string, unknown>[], columns, 'risques', 'Risques');
}

/**
 * Export des responsables (utilisateurs) vers Excel
 */
export function exportResponsables(users: User[]): void {
  const columns: ExportColumn<User>[] = [
    { key: 'id', header: 'ID', width: 8 },
    { key: 'nom', header: 'Nom', width: 25 },
    { key: 'prenom', header: 'Prénom', width: 20 },
    { key: 'email', header: 'Email', width: 35 },
    { key: 'role', header: 'Rôle', width: 15 },
  ];

  exportToExcel(users as unknown as Record<string, unknown>[], columns, 'responsables', 'Responsables');
}

/**
 * Export des sous-tâches vers Excel
 */
export function exportSousTaches(sousTaches: SousTache[]): void {
  const columns: ExportColumn<SousTache>[] = [
    { key: 'id', header: 'ID', width: 8 },
    { key: 'actionId', header: 'Code Action', width: 15 },
    { key: 'libelle', header: 'Libellé', width: 45 },
    { key: 'ordre', header: 'Ordre', width: 8 },
    { key: 'fait', header: 'Fait', width: 8, transform: (v) => (v ? 'Oui' : 'Non') },
    { key: 'createdAt', header: 'Date création', width: 12, transform: (v) => formatDate(v as string) },
  ];

  exportToExcel(sousTaches as unknown as Record<string, unknown>[], columns, 'sous_taches', 'Sous-tâches');
}

// ============================================================================
// IMPORT FUNCTIONS
// ============================================================================

/**
 * Import générique depuis Excel
 */
async function importFromExcel<T>(
  file: File,
  columnMapping: Record<string, keyof T>,
  validators?: Record<keyof T, (value: unknown) => boolean | string>
): Promise<ImportResult<T>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const [headers, ...rows] = jsonData as unknown[][];
        const result: ImportResult<T> = {
          success: true,
          data: [],
          errors: [],
          warnings: [],
        };

        // Mapper les headers vers les colonnes
        const headerMap = new Map<number, keyof T>();
        (headers as string[]).forEach((header, index) => {
          const normalizedHeader = header?.toString().toLowerCase().trim();
          for (const [excelHeader, fieldKey] of Object.entries(columnMapping)) {
            if (excelHeader.toLowerCase() === normalizedHeader) {
              headerMap.set(index, fieldKey as keyof T);
              break;
            }
          }
        });

        // Parser chaque ligne
        rows.forEach((row, rowIndex) => {
          const item: Partial<T> = {};
          let hasError = false;

          headerMap.forEach((fieldKey, colIndex) => {
            const rawValue = (row as unknown[])[colIndex];
            item[fieldKey] = rawValue as T[keyof T];

            // Validation si définie
            if (validators && validators[fieldKey]) {
              const validation = validators[fieldKey](rawValue);
              if (validation !== true) {
                result.errors.push({
                  row: rowIndex + 2,
                  message: typeof validation === 'string' ? validation : `Valeur invalide pour ${String(fieldKey)}`,
                });
                hasError = true;
              }
            }
          });

          if (!hasError) {
            result.data.push(item);
          }
        });

        result.success = result.errors.length === 0;
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Import des jalons depuis Excel
 */
export async function importJalons(file: File): Promise<ImportResult<Jalon>> {
  const columnMapping: Record<string, keyof Jalon> = {
    'code': 'id_jalon',
    'libellé': 'titre',
    'libelle': 'titre',
    'axe': 'axe',
    'axe_code': 'axe',
    'échéance': 'date_prevue',
    'echeance': 'date_prevue',
    'date_fin_prevue': 'date_prevue',
    'responsable': 'responsable',
    'responsable_id': 'responsable',
    'description': 'description',
  };

  const result = await importFromExcel<Jalon>(file, columnMapping);

  // Post-traitement : convertir les dates
  result.data = result.data.map(item => ({
    ...item,
    date_prevue: item.date_prevue ? parseDate(item.date_prevue) || undefined : undefined,
  })) as Partial<Jalon>[];

  return result;
}

/**
 * Import des actions depuis Excel
 */
export async function importActions(file: File): Promise<ImportResult<Action>> {
  const columnMapping: Record<string, keyof Action> = {
    'code': 'id_action',
    'libellé': 'titre',
    'libelle': 'titre',
    'jalon_code': 'jalonId',
    'jalon': 'jalonId',
    'date_debut': 'date_debut_prevue',
    'date_debut_prevue': 'date_debut_prevue',
    'échéance': 'date_fin_prevue',
    'echeance': 'date_fin_prevue',
    'date_fin_prevue': 'date_fin_prevue',
    'responsable': 'responsable',
    'responsable_id': 'responsable',
    'format_livrable': 'type_action',
    'priorité': 'priorite',
    'priorite': 'priorite',
    'description': 'description',
  };

  const result = await importFromExcel<Action>(file, columnMapping);

  // Post-traitement : convertir les dates
  result.data = result.data.map(item => ({
    ...item,
    date_debut_prevue: item.date_debut_prevue ? parseDate(item.date_debut_prevue) || undefined : undefined,
    date_fin_prevue: item.date_fin_prevue ? parseDate(item.date_fin_prevue) || undefined : undefined,
  })) as Partial<Action>[];

  return result;
}

/**
 * Import des risques depuis Excel
 */
export async function importRisques(file: File): Promise<ImportResult<Risque>> {
  const columnMapping: Record<string, keyof Risque> = {
    'code': 'id_risque',
    'risque': 'titre',
    'titre': 'titre',
    'catégorie': 'categorie',
    'categorie': 'categorie',
    'probabilité': 'probabilite_actuelle',
    'probabilite': 'probabilite_actuelle',
    'impact': 'impact_actuel',
    'mitigation': 'plan_mitigation',
    'responsable': 'proprietaire',
    'statut': 'statut',
  };

  return importFromExcel<Risque>(file, columnMapping);
}

/**
 * Import des responsables (utilisateurs) depuis Excel
 */
export async function importResponsables(file: File): Promise<ImportResult<User>> {
  const columnMapping: Record<string, keyof User> = {
    'nom': 'nom',
    'prenom': 'prenom',
    'prénom': 'prenom',
    'email': 'email',
    'role': 'role',
    'rôle': 'role',
  };

  return importFromExcel<User>(file, columnMapping);
}

/**
 * Import des sous-tâches depuis Excel
 */
export async function importSousTaches(file: File): Promise<ImportResult<SousTache>> {
  const columnMapping: Record<string, keyof SousTache> = {
    'action_id': 'actionId',
    'actionid': 'actionId',
    'code_action': 'actionId',
    'libelle': 'libelle',
    'libellé': 'libelle',
    'ordre': 'ordre',
    'fait': 'fait',
  };

  const result = await importFromExcel<SousTache>(file, columnMapping);

  // Post-traitement : convertir le champ "fait"
  result.data = result.data.map(item => ({
    ...item,
    fait: item.fait === true || item.fait === 'Oui' || item.fait === 'oui' || item.fait === '1',
    ordre: typeof item.ordre === 'number' ? item.ordre : parseInt(String(item.ordre)) || 1,
  })) as Partial<SousTache>[];

  return result;
}

// ============================================================================
// TEMPLATES
// ============================================================================

/**
 * Télécharger un template Excel
 */
export function downloadTemplate(type: 'jalons' | 'actions' | 'risques' | 'responsables' | 'sous_taches'): void {
  const templates = {
    jalons: {
      headers: ['code', 'libelle', 'axe_code', 'description', 'date_fin_prevue', 'responsable_id'],
      exemple: ['J-MKT-1', 'Phase 1 : Planification', 'MKT', 'Description du jalon', '15/02/2026', 'Marketing Mgr'],
      instructions: [
        'code : Format J-XXX-N (ex: J-MKT-1)',
        'axe_code : RH, COM, TECH, BUD, MKT, EXP, DIV, CON',
        'date_fin_prevue : Format JJ/MM/AAAA',
        'responsable_id : Nom ou ID du responsable',
      ],
    },
    actions: {
      headers: ['code', 'jalon_code', 'libelle', 'date_debut_prevue', 'date_fin_prevue', 'responsable_id', 'format_livrable', 'priorite'],
      exemple: ['A-MKT-1.1', 'J-MKT-1', 'Analyse de marché', '01/01/2026', '20/01/2026', 'Marketing Mgr', 'PPT', 'HAUTE'],
      instructions: [
        'code : Format A-XXX-N.N (ex: A-MKT-1.1)',
        'jalon_code : Code du jalon parent',
        'date : Format JJ/MM/AAAA',
        'priorite : HAUTE / MOYENNE / BASSE',
      ],
    },
    risques: {
      headers: ['code', 'titre', 'categorie', 'probabilite', 'impact', 'mitigation', 'responsable', 'statut'],
      exemple: ['R-001', 'Retard chantier CC', 'CONSTRUCTION', 'ELEVEE', 'CRITIQUE', 'Suivi hebdomadaire', 'DGA', 'OUVERT'],
      instructions: [
        'categorie : CONSTRUCTION, COMMERCIAL, RH, BUDGET, TECHNIQUE, EXTERNE',
        'probabilite : FAIBLE / MOYENNE / ELEVEE',
        'impact : FAIBLE / MOYEN / ELEVE / CRITIQUE',
        'statut : OUVERT / EN_TRAITEMENT / FERME / ACCEPTE',
      ],
    },
    responsables: {
      headers: ['nom', 'prenom', 'email', 'role'],
      exemple: ['Dupont', 'Jean', 'jean.dupont@cosmos-angre.ci', 'manager'],
      instructions: [
        'nom : Nom de famille',
        'prenom : Prénom',
        'email : Adresse email valide',
        'role : admin / manager / viewer',
      ],
    },
    sous_taches: {
      headers: ['action_id', 'libelle', 'ordre', 'fait'],
      exemple: ['A-MKT-1.1', 'Collecter données marché', '1', 'Non'],
      instructions: [
        'action_id : Code de l\'action parente (ex: A-MKT-1.1)',
        'libelle : Description de la sous-tâche',
        'ordre : Numéro d\'ordre (1, 2, 3...)',
        'fait : Oui / Non',
      ],
    },
  };

  const template = templates[type];
  const wb = XLSX.utils.book_new();

  // Feuille données
  const wsData = XLSX.utils.aoa_to_sheet([
    template.headers,
    template.exemple,
    [], // Ligne vide pour commencer à saisir
  ]);
  XLSX.utils.book_append_sheet(wb, wsData, 'Données');

  // Feuille instructions
  const wsInstructions = XLSX.utils.aoa_to_sheet([
    ['INSTRUCTIONS'],
    [],
    ...template.instructions.map(i => [i]),
  ]);
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  XLSX.writeFile(wb, `modele_${type}.xlsx`);
}

// ============================================================================
// SERVICE UNIFIÉ
// ============================================================================

export const excelService = {
  // Export
  exportJalons,
  exportActions,
  exportRisques,
  exportResponsables,
  exportSousTaches,

  // Import
  importJalons,
  importActions,
  importRisques,
  importResponsables,
  importSousTaches,

  // Templates
  downloadTemplate,
};

export default excelService;
