# Cahier des Charges — Sous-Module "Rapport Studio"

**Projet** : Cockpit COSMOS Angre
**Version** : 1.0
**Date** : 10 fevrier 2026
**Auteur** : Equipe Projet

---

## 1. Contexte & Objectifs

### 1.1 Contexte

Le Cockpit COSMOS Angre dispose de **11 onglets** dans la page Rapports :

| # | Onglet | Composant | Description |
|---|--------|-----------|-------------|
| 1 | EXCO | ExcoMensuelV5 | Presentation executive 20 slides |
| 2 | Flash Hebdo | WeeklyReportV2 | Rapport flash 1-2 pages |
| 3 | Rapport Mensuel | MonthlyReport | Revue mensuelle 5-10 pages |
| 4 | Rappel Actions | MonthlyReportPage | Email manager avec actions par axe |
| 5 | **Rapport Studio** | **ReportStudio** | **Editeur de rapports personnalises** |
| 6 | Exports PDF | EnhancedReportExport | Generateur PDF multi-sections |
| 7 | Catalogue | DataLibrary | Bibliotheque graphiques/tableaux/KPIs |
| 8 | Generation Auto | ReportGenerator | Planification automatique |
| 9 | Import IA | ImportIA | Ingestion documents via IA |
| 10 | Journal | Journal | Archive unifiee de tous les rapports |
| 11 | Liste | ExcoList | Historique EXCO avec CRUD |

Le **Rapport Studio** est le seul module qui permet de creer des rapports **entierement personnalises** avec un editeur visuel. Les autres rapports (EXCO, Hebdo, Mensuel, Rappel Actions) ont un format fixe alimente par les donnees live.

### 1.2 Objectif

Fournir un editeur de rapports professionnel permettant a l'equipe projet de :

- **Composer** des rapports libres avec des blocs de contenu heterogenes
- **Inserer** des donnees live du projet (KPIs, graphiques, tableaux) depuis la base de donnees
- **Styliser** le document avec un design system coherent (COSMOS brand)
- **Exporter** en PDF, HTML, PPTX, DOCX
- **Partager** par email ou lien public
- **Versionner** l'historique des modifications
- **Assister** la redaction via IA (generation de contenu, suggestions)

---

## 2. Architecture Technique

### 2.1 Stack

| Couche | Technologie |
|--------|-------------|
| UI | React 18 + TypeScript |
| State | Zustand (`useReportStudioStore`) |
| Donnees | Dexie.js (IndexedDB) via hooks (`useReports`) |
| Export PDF | jsPDF + jsPDF-autotable |
| Export PPTX | pptxgenjs (import dynamique) |
| Export HTML | CSS inline + template HTML |
| Graphiques | Recharts |
| IA | Claude API (via proxy) |
| Design | Inline styles + constantes `C` (design system COSMOS) |

### 2.2 Arborescence

```
src/components/rapports/ReportStudio/
  ReportStudio.tsx              # Composant principal
  NavigationPanel/              # Arbre de navigation des sections
  DocumentCanvas/               # Zone d'edition WYSIWYG
  Toolbar/
    FloatingToolbar.tsx         # Barre d'outils flottante
    FormattingToolbar.tsx       # Barre de mise en forme
  BlockRenderers/               # 12 types de blocs
    ParagraphBlock.tsx
    HeadingBlock.tsx
    ListBlock.tsx
    TableBlock.tsx
    ChartBlock.tsx              # Graphiques Recharts
    KPICardBlock.tsx            # Cartes KPI live
    ImageBlock.tsx
    CalloutBlock.tsx            # 4 variantes : info, warning, success, error
    QuoteBlock.tsx
    DividerBlock.tsx
    PageBreakBlock.tsx
  Modals/
    ExportModal.tsx             # Options d'export multi-format
    DataLibraryModal.tsx        # Insertion donnees live
    DesignSettingsModal.tsx      # Theme, polices, couleurs
    VersionHistoryModal.tsx     # Historique des versions
  ContextMenu/                  # Menu clic droit
  AIPanel/                      # Panneau d'assistance IA
  SlashCommandMenu/             # Menu "/" pour insertion rapide
```

### 2.3 Flux de donnees

```
RapportsPage.tsx (onglet "html_reports")
  |
  v
ReportStudio.tsx
  |
  +-- useReportStudioStore (Zustand)     --> Etat editeur (blocs, selection, undo/redo)
  +-- useReports()                        --> CRUD rapports (Dexie DB)
  +-- DataLibraryModal --> useActions(), useJalons(), useRisques(), useBudget()
  |
  v
BlockRenderers (12 types)
  |
  v
Export (PDF / HTML / PPTX / DOCX)
  |
  v
Journal (archive) + Email (partage)
```

---

## 3. Specifications Fonctionnelles

### 3.1 Editeur de blocs

L'editeur utilise un systeme de **blocs empilables** (similaire a Notion). Chaque bloc a un type, un contenu et des options de style.

#### 3.1.1 Types de blocs (12)

| Type | Description | Donnees live | Configurable |
|------|-------------|:------------:|:------------:|
| `paragraph` | Texte riche (gras, italique, liens) | Non | Police, taille, couleur |
| `heading` | Titre H1/H2/H3 | Non | Niveau, alignement |
| `list` | Liste a puces ou numerotee | Non | Type (ul/ol), imbrication |
| `table` | Tableau libre ou depuis donnees | Oui | Colonnes, tri, filtre |
| `chart` | Graphique Recharts | Oui | Type (bar/line/pie/radar), axes, couleurs |
| `kpi_card` | Carte KPI avec valeur + tendance | Oui | Couleur, icone, cible, evolution |
| `image` | Image importee ou URL | Non | Dimensions, alignement, legende |
| `callout` | Encart colore (info/warning/success/error) | Non | Variante, icone, titre |
| `quote` | Citation mise en forme | Non | Auteur, source |
| `divider` | Ligne de separation | Non | Style (trait, pointilles, espace) |
| `page_break` | Saut de page (export PDF) | Non | Non |

#### 3.1.2 Operations sur les blocs

| Operation | Declencheur | Description |
|-----------|-------------|-------------|
| Ajouter | Bouton "+" / Slash command "/" | Insere un nouveau bloc a la position |
| Deplacer | Drag & drop | Reordonne les blocs |
| Dupliquer | Menu contextuel | Copie le bloc en dessous |
| Supprimer | Menu contextuel / touche Suppr | Supprime le bloc |
| Convertir | Menu contextuel | Change le type (ex: paragraphe -> callout) |
| Undo/Redo | Ctrl+Z / Ctrl+Y | Historique d'actions (Zustand) |

#### 3.1.3 Slash Commands

L'utilisateur tape `/` dans un bloc vide pour afficher un menu d'insertion rapide :

```
/texte        -> Paragraphe
/titre        -> Heading
/liste        -> Liste
/tableau      -> Tableau
/graphique    -> Graphique (ouvre DataLibrary)
/kpi          -> KPI Card (ouvre DataLibrary)
/image        -> Image
/callout      -> Encart
/citation     -> Citation
/separateur   -> Divider
/saut         -> Page break
/donnees      -> DataLibraryModal
```

### 3.2 Insertion de donnees live (DataLibraryModal)

L'utilisateur peut inserer des donnees dynamiques depuis la base de donnees du projet.

#### 3.2.1 Sources de donnees disponibles

| Source | Hook | Donnees accessibles |
|--------|------|---------------------|
| Actions | `useActions()` | Liste, avancement par axe, statuts, retards |
| Jalons | `useJalons()` | Timeline, taux atteinte, prochaines echeances |
| Risques | `useRisques()` | Matrice, top 10, repartition par categorie |
| Budget | `useBudgetSynthese()` | EVM, consommation, ecarts, projections |
| Equipe | `useUsers()` | Charge de travail, repartition par axe |
| Alertes | `useAlertes()` | Alertes actives, historique |
| KPIs | `useDashboardKPIs()` | Avancement global, meteo, confiance |

#### 3.2.2 Types d'insertion

| Type | Rendu | Exemple |
|------|-------|---------|
| Graphique | ChartBlock (Recharts) | Camembert repartition actions par statut |
| Tableau | TableBlock | Top 10 risques avec score et responsable |
| KPI | KPICardBlock | Avancement global : 42% (cible 50%) |
| Valeur inline | Texte dynamique | "Il reste **{jours_avant_ouverture}** jours" |

### 3.3 Design & Theming (DesignSettingsModal)

#### 3.3.1 Parametres de design

| Parametre | Options | Defaut |
|-----------|---------|--------|
| Police principale | Exo 2, Inter, Arial, Roboto | Exo 2 |
| Couleur primaire | Selecteur couleur | `#263238` (navy) |
| Couleur accent | Selecteur couleur | `#B8953F` (gold) |
| En-tete | Logo + titre projet | COSMOS Angre |
| Pied de page | Date + numero de page | Automatique |
| Marges | Etroites / Normales / Larges | Normales |
| Orientation | Portrait / Paysage | Portrait |

#### 3.3.2 Design System COSMOS

Les rapports heritent du design system defini dans `ExcoMensuelV5/constants.ts` :

```typescript
const C = {
  navy: '#263238',      // Texte principal
  gold: '#B8953F',      // Accent brand
  white: '#FFFFFF',
  gray100: '#f5f7f9',   // Fond sections
  gray200: '#e8edf2',   // Bordures
  green: '#81c784',     // Succes
  blue: '#64b5f6',      // Info
  orange: '#ffb74d',    // Attention
  red: '#e57373',       // Critique
};
```

### 3.4 Export multi-format

#### 3.4.1 Formats supportes

| Format | Bibliotheque | Fidelite | Usage |
|--------|-------------|----------|-------|
| **PDF** | jsPDF + autotable | Haute | Impression, archivage |
| **HTML** | Template + CSS inline | Exacte | Partage par email, apercu web |
| **PPTX** | pptxgenjs | Moyenne | Presentations EXCO/COPIL |
| **DOCX** | docx | Moyenne | Edition collaborative Word |

#### 3.4.2 Options d'export (ExportModal)

| Option | Description | Defaut |
|--------|-------------|--------|
| Table des matieres | Genere automatiquement depuis les headings | Oui |
| Commentaires | Inclure les annotations | Non |
| Pieces jointes | Lister les documents lies | Non |
| Numerotation pages | Ajouter "Page X/Y" en pied | Oui |
| Filigrane | "BROUILLON" / "CONFIDENTIEL" / Aucun | Aucun |
| Qualite images | Basse / Moyenne / Haute | Moyenne |

### 3.5 Partage & Collaboration

#### 3.5.1 Modes de partage

| Mode | Mecanisme | Destinataire |
|------|-----------|-------------|
| Email | `emailService.sendReportShareEmail()` | Utilisateurs DB + emails libres |
| Lien public | `externalShareService.createShareToken()` | Toute personne avec le lien |
| Download | Export fichier local | Utilisateur courant |

#### 3.5.2 Permissions des liens partages

| Parametre | Options |
|-----------|---------|
| Expiration | 24h / 7j / 30j / Illimite |
| Acces | Lecture seule / Commentaires autorises |
| Protection | Mot de passe optionnel |
| Tracking | Compteur d'acces + date dernier acces |
| Revocation | Desactivation manuelle a tout moment |

### 3.6 Historique des versions (VersionHistoryModal)

| Fonctionnalite | Description |
|----------------|-------------|
| Sauvegarde auto | Toutes les 30 secondes si modifications |
| Versions nommees | L'utilisateur peut nommer une version ("v1 Brouillon") |
| Comparaison | Diff visuel entre 2 versions |
| Restauration | Revenir a une version anterieure |
| Retention | 50 dernieres versions par rapport |

### 3.7 Assistance IA (AIPanel)

#### 3.7.1 Fonctionnalites IA

| Fonction | Description | Entree | Sortie |
|----------|-------------|--------|--------|
| Rediger section | Generer un paragraphe depuis un brief | Titre + mots-cles | Paragraphe structure |
| Resumer | Condenser un texte long | Texte source | Resume 3-5 phrases |
| Reformuler | Ameliorer le style | Paragraphe existant | Version amelioree |
| Analyser donnees | Interpreter des KPIs | Donnees du projet | Commentaire analytique |
| Generer recommandations | Proposer des actions | Contexte projet | Liste de recommandations |
| Traduire | Francais <-> Anglais | Texte source | Texte traduit |

#### 3.7.2 Integration technique

- **API** : Claude via proxy (`/api/anthropic`)
- **Contexte** : Le panneau IA recoit les donnees du projet (actions, jalons, risques, budget) pour generer du contenu contextualise
- **Limites** : Max 4000 tokens par requete, rate limit 10 req/min

---

## 4. Specifications Techniques

### 4.1 Store Zustand (`useReportStudioStore`)

```typescript
interface ReportStudioState {
  // Document
  reportId: string | null;
  title: string;
  blocks: Block[];

  // Selection
  selectedBlockId: string | null;
  focusedBlockId: string | null;

  // Historique
  undoStack: Block[][];
  redoStack: Block[][];

  // UI
  viewMode: 'single' | 'columns' | 'preview';
  sidebarOpen: boolean;
  aiPanelOpen: boolean;

  // Design
  designSettings: DesignSettings;

  // Actions
  addBlock(type: BlockType, position: number): void;
  updateBlock(id: string, data: Partial<Block>): void;
  removeBlock(id: string): void;
  moveBlock(id: string, newPosition: number): void;
  duplicateBlock(id: string): void;
  undo(): void;
  redo(): void;
  save(): Promise<void>;
}
```

### 4.2 Interface Block

```typescript
interface Block {
  id: string;                    // UUID
  type: BlockType;               // 'paragraph' | 'heading' | ... (12 types)
  content: string;               // Contenu texte ou JSON serialise
  style?: BlockStyle;            // Overrides de style
  dataSource?: DataSourceConfig; // Config si bloc lie a des donnees live
  metadata?: {
    createdAt: string;
    updatedAt: string;
    locked?: boolean;            // Bloc verrouille (non editable)
  };
}

type BlockType =
  | 'paragraph' | 'heading' | 'list' | 'table'
  | 'chart' | 'kpi_card' | 'image' | 'callout'
  | 'quote' | 'divider' | 'page_break';

interface DataSourceConfig {
  hook: string;                  // 'useActions' | 'useJalons' | ...
  query?: Record<string, any>;   // Filtres (axe, statut, date)
  transform?: string;            // 'count' | 'sum' | 'average' | 'group_by'
  refreshInterval?: number;      // ms (0 = manuel)
}
```

### 4.3 Persistence (Dexie)

Les rapports Studio sont stockes dans la table `reports` :

```typescript
interface StudioReport {
  id?: number;
  titre: string;
  blocks: Block[];              // JSON serialise
  designSettings: DesignSettings;
  statut: 'brouillon' | 'valide' | 'archive';
  auteur: string;
  versions: ReportVersion[];    // Historique
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
```

### 4.4 Modes d'affichage (ViewMode)

| Mode | Description | Usage |
|------|-------------|-------|
| `single` | Edition pleine largeur, 1 bloc selectionne | Redaction |
| `columns` | Navigation a gauche + edition a droite | Organisation |
| `preview` | Rendu final lecture seule (style export) | Relecture avant export |

---

## 5. Parcours Utilisateur

### 5.1 Creer un rapport

```
1. Onglet "Rapport Studio" dans RapportsPage
2. Clic "Nouveau rapport"
3. Choix du template :
   a. Vide
   b. Rapport de suivi (pre-rempli avec sections standard)
   c. Note de synthese
   d. Compte-rendu reunion
4. L'editeur s'ouvre avec les blocs initiaux
5. L'utilisateur ajoute/modifie/supprime des blocs
6. Sauvegarde automatique toutes les 30s
```

### 5.2 Inserer des donnees projet

```
1. Slash command "/donnees" ou bouton "Donnees"
2. DataLibraryModal s'ouvre
3. 3 onglets : Graphiques | Tableaux | KPIs
4. L'utilisateur selectionne un element
5. Configuration (filtres, periode, axes)
6. Apercu en temps reel
7. Clic "Inserer" -> bloc ajoute au document
```

### 5.3 Exporter et partager

```
1. Clic "Exporter" dans la toolbar
2. ExportModal : choix du format (PDF/HTML/PPTX/DOCX)
3. Options : TOC, commentaires, filigrane
4. Apercu du resultat
5. Clic "Telecharger" ou "Envoyer par email"
6. Si email : selection des destinataires + message
7. Le rapport est archive dans le Journal
```

---

## 6. Contraintes & Regles

### 6.1 Performance

| Contrainte | Seuil |
|------------|-------|
| Nombre max de blocs par rapport | 200 |
| Taille max d'un rapport en DB | 5 Mo (images encodees base64) |
| Temps de chargement editeur | < 2 secondes |
| Temps d'export PDF | < 10 secondes (100 blocs) |
| Sauvegarde auto | Debounce 30 secondes |
| Import dynamique pptxgenjs | Charge uniquement si export PPTX demande |

### 6.2 Compatibilite

| Cible | Support |
|-------|---------|
| Chrome/Edge 90+ | Complet |
| Firefox 90+ | Complet |
| Safari 15+ | Complet |
| Mobile (responsive) | Lecture seule (preview mode) |
| Impression navigateur | Via export HTML + Ctrl+P |
| Mode offline (PWA) | Complet (IndexedDB + Service Worker) |

### 6.3 Securite

| Regle | Implementation |
|-------|----------------|
| Pas de donnees sensibles dans les exports | Filtrage budget confidentiel |
| Liens partages expirables | Token avec TTL + revocation |
| Sanitisation HTML | DOMPurify sur le contenu des blocs |
| Pas d'execution de scripts | CSP + sanitisation |
| Audit trail | Chaque sauvegarde est tracee (auditMiddleware) |

---

## 7. Integration avec les autres modules

### 7.1 Dependances entrantes (modules qui alimentent Studio)

| Module | Donnees fournies | Hook |
|--------|-----------------|------|
| Actions | Liste, statuts, avancement, retards | `useActions()` |
| Jalons | Timeline, taux atteinte | `useJalons()` |
| Risques | Matrice, top 10, categories | `useRisques()` |
| Budget | EVM, consommation, ecarts | `useBudgetSynthese()` |
| Dashboard | KPIs agreges, meteo, confiance | `useDashboardKPIs()` |
| Equipe | Utilisateurs, charge de travail | `useUsers()` |
| Alertes | Alertes actives | `useAlertes()` |

### 7.2 Dependances sortantes (modules alimentes par Studio)

| Module | Interaction |
|--------|------------|
| Journal | Archive automatique apres export/envoi |
| Email Service | Envoi par email avec tracking |
| External Share | Generation de liens publics |
| Catalogue (DataLibrary) | Reutilisation des templates de graphiques |

### 7.3 Design system partage

Le Rapport Studio reutilise les constantes definies dans `ExcoMensuelV5/constants.ts` :
- **`C`** : Palette de couleurs COSMOS
- **`AXES_V5`** : Configuration des 8 axes (codes, labels, couleurs)
- **`METEO_CONFIG`** : 4 niveaux meteo (bleu/vert/orange/rouge)

---

## 8. Livrables attendus

| # | Livrable | Format | Priorite |
|---|----------|--------|----------|
| 1 | Editeur de blocs fonctionnel (12 types) | Composant React | P0 |
| 2 | Slash commands + menu contextuel | UI interactive | P0 |
| 3 | Insertion donnees live (DataLibraryModal) | Modal + hooks | P0 |
| 4 | Export PDF fidele au rendu ecran | jsPDF | P0 |
| 5 | Export HTML autonome | Template + CSS inline | P0 |
| 6 | Sauvegarde auto + undo/redo | Zustand + Dexie | P0 |
| 7 | Mode preview (WYSIWYG) | ViewMode.preview | P1 |
| 8 | Theming (DesignSettingsModal) | Modal config | P1 |
| 9 | Export PPTX | pptxgenjs | P1 |
| 10 | Export DOCX | docx | P2 |
| 11 | Panneau IA (AIPanel) | Claude API | P1 |
| 12 | Historique versions | Modal + diff | P2 |
| 13 | Partage par lien public | Token + SharedReportPage | P1 |
| 14 | Envoi par email | emailService | P1 |
| 15 | Templates pre-definis | JSON configs | P2 |
| 16 | Archive dans Journal | Integration auto | P1 |

**Legende** : P0 = indispensable, P1 = important, P2 = souhaitable

---

## 9. Criteres d'acceptation

| # | Critere | Verification |
|---|---------|-------------|
| 1 | L'utilisateur peut creer un rapport avec 12 types de blocs | Test manuel |
| 2 | Les donnees live (actions, jalons, risques, budget) s'inserent correctement | Comparaison avec les donnees DB |
| 3 | L'export PDF reproduit fidelement le rendu ecran | Comparaison visuelle |
| 4 | L'export HTML s'ouvre correctement dans un navigateur externe (sans Tailwind) | Test dans nouvel onglet |
| 5 | Le undo/redo fonctionne sur toutes les operations | 20 operations consecutives |
| 6 | La sauvegarde auto ne perd pas de donnees | Fermeture brutale + reouverture |
| 7 | Les liens partages expirent correctement | Test avec TTL de 1 minute |
| 8 | Le panneau IA genere du contenu pertinent | Relecture humaine |
| 9 | Le mode offline fonctionne (PWA) | Test avion mode |
| 10 | Zero erreur TypeScript (`npx tsc --noEmit`) | CI/CD |
