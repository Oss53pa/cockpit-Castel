/**
 * External Share Service
 * Génère des pages HTML autonomes pour le partage externe d'actions, jalons et risques
 *
 * Architecture 100% Frontend:
 * - Génération de pages HTML avec formulaire intégré
 * - Tokens stockés en IndexedDB
 * - Synchronisation via API externe (Supabase/Firebase) configurable
 */

import { db } from '@/db';
import type { Action, Jalon, Risque, User } from '@/types';
import type { LigneBudgetExploitation } from '@/types/budgetExploitation.types';
import { PROJET_CONFIG } from '@/data/constants';

// ============================================================================
// TYPES
// ============================================================================

export type ShareableItemType = 'action' | 'jalon' | 'risque' | 'budget';

export interface ShareToken {
  id?: number;
  token: string;
  entityType: ShareableItemType;
  entityId: number;
  entityTitle: string;
  recipientEmail: string;
  recipientName: string;
  createdAt: string;
  expiresAt: string;
  usedCount: number;
  lastUsedAt?: string;
  isActive: boolean;
}

export interface ExternalUpdate {
  id?: number;
  token: string;
  entityType: ShareableItemType;
  entityId: number;
  submittedAt: string;
  submittedBy: {
    name?: string;
    email?: string;
    ip?: string;
    userAgent?: string;
  };
  changes: {
    status?: string;
    progress?: number;
    comment?: string;
    probability?: number;
    impact?: number;
    newDueDate?: string;
  };
  attachments: Array<{
    name: string;
    url?: string;
    size: number;
    data?: string;
  }>;
  isSynchronized: boolean;
  synchronizedAt?: string;
  isReviewed: boolean;
  reviewedAt?: string;
  reviewedBy?: number;
}

export interface ShareConfig {
  apiUrl?: string;
  companyLogo: string;
  companyName: string;
  projectName: string;
  expiryDays: number;
  primaryColor: string;
  accentColor: string;
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_CONFIG: ShareConfig = {
  apiUrl: undefined, // Mode offline par défaut
  companyLogo: '/logo-crmc.png',
  companyName: 'CRMC',
  projectName: PROJET_CONFIG.nom,
  expiryDays: 30,
  primaryColor: '#1C3163',
  accentColor: '#D4AF37',
};

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class ExternalShareService {
  private config: ShareConfig;

  constructor(config: Partial<ShareConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Génère un token unique sécurisé (48 caractères hex)
   */
  generateToken(): string {
    const array = new Uint8Array(24);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Calcule la date d'expiration
   */
  getExpiryDate(): Date {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + this.config.expiryDays);
    return expiry;
  }

  /**
   * Formate une date en français
   */
  formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  /**
   * Vérifie si une date est dépassée
   */
  isOverdue(date: string | Date): boolean {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d < new Date();
  }

  /**
   * Configuration par type d'entité
   */
  getTypeConfig(type: ShareableItemType) {
    const configs = {
      action: {
        label: 'Action',
        labelArticle: "l'action",
        color: '#3B82F6',
        bgColor: '#DBEAFE',
        textColor: '#1D4ED8',
        statuses: {
          a_faire: 'À faire',
          en_cours: 'En cours',
          termine: 'Terminée',
          valide: 'Validée',
          bloque: 'Bloquée',
          annule: 'Annulée',
        },
      },
      jalon: {
        label: 'Jalon',
        labelArticle: 'le jalon',
        color: '#8B5CF6',
        bgColor: '#EDE9FE',
        textColor: '#6D28D9',
        statuses: {
          a_venir: 'Prévu',
          en_cours: 'En cours',
          atteint: 'Atteint',
          en_danger: 'En danger',
          depasse: 'Dépassé',
          reporte: 'Reporté',
        },
      },
      risque: {
        label: 'Risque',
        labelArticle: 'le risque',
        color: '#EF4444',
        bgColor: '#FEE2E2',
        textColor: '#DC2626',
        statuses: {
          identifie: 'Identifié',
          en_traitement: 'En traitement',
          mitige: 'Mitigé',
          survenu: 'Survenu',
          clos: 'Clos',
        },
      },
      budget: {
        label: 'Budget',
        labelArticle: 'la ligne budgétaire',
        color: '#F59E0B',
        bgColor: '#FEF3C7',
        textColor: '#92400E',
        statuses: {},
      },
    };
    return configs[type];
  }

  /**
   * Génère la page HTML pour une action
   */
  generateActionPage(action: Action, responsible: User | null, token: string): string {
    const config = this.getTypeConfig('action');
    return this.generateBasePage({
      type: 'action',
      config,
      token,
      item: {
        id: action.id!,
        title: action.titre,
        description: action.description || '',
        status: action.statut,
        progress: action.avancement,
        dueDate: action.date_fin_prevue,
        responsible: responsible ? {
          name: `${responsible.prenom} ${responsible.nom}`,
          email: responsible.email || '',
        } : undefined,
        priority: action.priorite,
        axe: action.axe,
      },
      extraFields: this.getActionExtraFields(action),
      extraFormFields: '',
    });
  }

  /**
   * Génère la page HTML pour un jalon
   */
  generateJalonPage(jalon: Jalon, responsible: User | null, token: string): string {
    const config = this.getTypeConfig('jalon');
    return this.generateBasePage({
      type: 'jalon',
      config,
      token,
      item: {
        id: jalon.id!,
        title: jalon.titre,
        description: jalon.description || '',
        status: jalon.statut,
        progress: jalon.avancement || 0,
        dueDate: jalon.date_prevue,
        responsible: responsible ? {
          name: `${responsible.prenom} ${responsible.nom}`,
          email: responsible.email || '',
        } : undefined,
        livrables: jalon.livrables,
      },
      extraFields: this.getJalonExtraFields(jalon),
      extraFormFields: this.getJalonFormFields(),
    });
  }

  /**
   * Génère la page HTML pour un risque
   */
  generateRisquePage(risque: Risque, responsible: User | null, token: string): string {
    const config = this.getTypeConfig('risque');
    return this.generateBasePage({
      type: 'risque',
      config,
      token,
      item: {
        id: risque.id!,
        title: risque.titre,
        description: risque.description || '',
        status: risque.status,
        progress: 0,
        dueDate: risque.date_cible || '',
        responsible: responsible ? {
          name: `${responsible.prenom} ${responsible.nom}`,
          email: responsible.email || '',
        } : undefined,
        probability: risque.probabilite_actuelle || risque.probabilite,
        impact: risque.impact_actuel || risque.impact,
        score: risque.score_actuel || risque.score,
        mitigation: risque.plan_mitigation,
      },
      extraFields: this.getRisqueExtraFields(risque),
      extraFormFields: this.getRisqueFormFields(),
    });
  }

  /**
   * Génère la page HTML pour une ligne budgétaire
   */
  generateBudgetPage(ligne: LigneBudgetExploitation, token: string): string {
    return this.generateBudgetBasePage([ligne], ligne.poste, token);
  }

  /**
   * Génère la page HTML pour une catégorie budgétaire (plusieurs lignes)
   */
  generateBudgetCategoryPage(lignes: LigneBudgetExploitation[], categoryLabel: string, token: string): string {
    return this.generateBudgetBasePage(lignes, categoryLabel, token);
  }

  /**
   * Formate un montant en FCFA
   */
  private formatMontantHtml(montant: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(montant) + ' FCFA';
  }

  /**
   * Template de base pour les pages budget
   */
  private generateBudgetBasePage(lignes: LigneBudgetExploitation[], title: string, token: string): string {
    const config = this.getTypeConfig('budget');
    const apiUrl = this.config.apiUrl || 'https://your-api.supabase.co/functions/v1';
    const isSingle = lignes.length === 1;

    const budgetSections = lignes.map((ligne, index) => {
      const tauxEngage = ligne.montantPrevu > 0 ? ((ligne.montantEngage / ligne.montantPrevu) * 100).toFixed(1) : '0.0';
      const tauxConsomme = ligne.montantPrevu > 0 ? ((ligne.montantConsomme / ligne.montantPrevu) * 100).toFixed(1) : '0.0';
      const disponible = ligne.montantPrevu - ligne.montantConsomme;

      return `
        <div class="budget-item" ${!isSingle ? `data-item-index="${index}"` : ''}>
          ${!isSingle ? `<h3 class="budget-item-title">${ligne.poste}</h3>` : ''}
          <div class="budget-info-grid">
            <div class="budget-metric">
              <span class="metric-label">Montant Prévu</span>
              <span class="metric-value prevu">${this.formatMontantHtml(ligne.montantPrevu)}</span>
            </div>
            <div class="budget-metric">
              <span class="metric-label">Engagé</span>
              <span class="metric-value engage">${this.formatMontantHtml(ligne.montantEngage)} (${tauxEngage}%)</span>
            </div>
            <div class="budget-metric">
              <span class="metric-label">Consommé</span>
              <span class="metric-value consomme">${this.formatMontantHtml(ligne.montantConsomme)} (${tauxConsomme}%)</span>
            </div>
            <div class="budget-metric">
              <span class="metric-label">Disponible</span>
              <span class="metric-value disponible">${this.formatMontantHtml(disponible)}</span>
            </div>
          </div>
          ${ligne.description ? `<p class="budget-description">${ligne.description}</p>` : ''}

          <div class="budget-form-section">
            <input type="hidden" name="entityId_${index}" value="${ligne.id || 0}">
            <div class="form-row">
              <div class="form-group half">
                <label for="montantEngage_${index}">Montant Engagé (FCFA)</label>
                <input type="number" id="montantEngage_${index}" name="montantEngage_${index}"
                       value="${ligne.montantEngage}" min="0" step="1000">
              </div>
              <div class="form-group half">
                <label for="montantConsomme_${index}">Montant Consommé (FCFA)</label>
                <input type="number" id="montantConsomme_${index}" name="montantConsomme_${index}"
                       value="${ligne.montantConsomme}" min="0" step="1000">
              </div>
            </div>
            <div class="form-group">
              <label for="note_${index}">Note / Commentaire</label>
              <textarea id="note_${index}" name="note_${index}" rows="2"
                        placeholder="Précisions sur les montants...">${ligne.note || ''}</textarea>
            </div>
          </div>
        </div>
      `;
    }).join('<hr class="budget-separator">');

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Budget: ${title} | ${this.config.projectName}</title>
  <style>
    ${this.getStyles(config)}
    ${this.getExcoStyles()}
    ${this.getBudgetStyles()}
  </style>
</head>
<body>
  <div class="container">
    <header class="budget-header">
      <div class="header-left">
        <div class="logo-text">${this.config.companyName}</div>
        <div class="project-name">${this.config.projectName}</div>
      </div>
      <div class="badge badge-budget">Budget</div>
    </header>

    <main>
      <section class="info-card">
        <h1>${title}</h1>
        <div class="meta">
          <span class="budget-category">${isSingle ? `Catégorie: ${lignes[0].categorie}` : `${lignes.length} ligne(s) budgétaire(s)`}</span>
        </div>

        ${budgetSections}
      </section>

      ${this.getExcoSection()}

      <section class="update-form">
        <h2>Soumettre les montants mis à jour</h2>
        <form id="updateForm">
          <input type="hidden" name="token" value="${token}">
          <input type="hidden" name="entityType" value="budget">
          <input type="hidden" name="itemCount" value="${lignes.length}">

          <div class="form-group">
            <label for="attachments">Pièces jointes (optionnel)</label>
            <input type="file" id="attachments" name="attachments" multiple
                   accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif">
            <small>Formats: PDF, Word, Excel, Images (max 10 Mo/fichier)</small>
          </div>

          <div class="form-group">
            <label for="submitterName">Votre nom</label>
            <input type="text" id="submitterName" name="submitterName" placeholder="Prénom Nom">
          </div>

          <div class="form-group">
            <label for="submitterEmail">Votre email</label>
            <input type="email" id="submitterEmail" name="submitterEmail" placeholder="email@exemple.com">
          </div>

          <button type="submit" class="btn-submit">
            Envoyer la mise à jour budget
          </button>
        </form>
      </section>
    </main>

    <footer>
      <p>Cette page expire le <strong>${this.formatDate(this.getExpiryDate())}</strong>.</p>
      <p>En cas de problème, contactez le chef de projet.</p>
      <p class="powered-by">Propulsé par <strong>Cockpit ${this.config.projectName}</strong></p>
    </footer>
  </div>

  <div id="successModal" class="modal" style="display: none;">
    <div class="modal-content">
      <div class="success-icon"></div>
      <h2>Mise à jour envoyée !</h2>
      <p>Les montants budget ont été transmis avec succès.</p>
      <p>Le chef de projet sera notifié automatiquement.</p>
      <button onclick="location.reload()" class="btn-secondary">Fermer</button>
    </div>
  </div>

  <script>
    const API_URL = '${apiUrl}/external-updates';
    const OFFLINE_MODE = ${!this.config.apiUrl};
    const ITEM_COUNT = ${lignes.length};

    document.getElementById('updateForm').addEventListener('submit', async function(e) {
      e.preventDefault();

      const submitBtn = this.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Envoi en cours...';

      try {
        const formData = new FormData(this);

        const files = document.getElementById('attachments').files;
        const attachments = [];
        for (const file of files) {
          if (file.size > 10 * 1024 * 1024) {
            throw new Error('Fichier ' + file.name + ' trop volumineux (max 10 Mo)');
          }
          const base64 = await fileToBase64(file);
          attachments.push({ name: file.name, type: file.type, size: file.size, data: base64 });
        }

        const budgetItems = [];
        for (let i = 0; i < ITEM_COUNT; i++) {
          budgetItems.push({
            entityId: parseInt(formData.get('entityId_' + i) || '0'),
            montantEngage: parseFloat(formData.get('montantEngage_' + i) || '0'),
            montantConsomme: parseFloat(formData.get('montantConsomme_' + i) || '0'),
            commentaire: formData.get('note_' + i) || ''
          });
        }

        const payload = {
          token: formData.get('token'),
          entityType: 'budget',
          entityId: budgetItems[0]?.entityId || 0,
          submittedAt: new Date().toISOString(),
          submittedBy: {
            name: formData.get('submitterName'),
            email: formData.get('submitterEmail')
          },
          changes: {
            montantEngage: budgetItems[0]?.montantEngage,
            montantConsomme: budgetItems[0]?.montantConsomme,
            commentaireBudget: budgetItems[0]?.commentaire,
            budgetItems: ITEM_COUNT > 1 ? budgetItems : undefined
          },
          attachments: attachments
        };

        if (OFFLINE_MODE) {
          const updates = JSON.parse(localStorage.getItem('cockpit_external_updates') || '[]');
          updates.push(payload);
          localStorage.setItem('cockpit_external_updates', JSON.stringify(updates));
        } else {
          const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erreur serveur');
          }
        }

        document.getElementById('successModal').style.display = 'flex';
      } catch (error) {
        alert('Erreur: ' + error.message);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });

    function fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  </script>
</body>
</html>`;
  }

  /**
   * Styles spécifiques budget
   */
  private getBudgetStyles(): string {
    return `
    .budget-header {
      background: linear-gradient(135deg, #78350f 0%, #B45309 100%) !important;
    }

    .badge-budget {
      background: #FEF3C7;
      color: #92400E;
    }

    .budget-item {
      margin-bottom: 16px;
    }

    .budget-item-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #92400E;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #FEF3C7;
    }

    .budget-info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }

    .budget-metric {
      background: #FFFBEB;
      padding: 12px 16px;
      border-radius: 10px;
      border: 1px solid #FDE68A;
    }

    .budget-metric .metric-label {
      display: block;
      font-size: 12px;
      color: #92400E;
      margin-bottom: 4px;
    }

    .budget-metric .metric-value {
      font-size: 1rem;
      font-weight: 700;
    }

    .budget-metric .metric-value.prevu { color: #1F2937; }
    .budget-metric .metric-value.engage { color: #2563EB; }
    .budget-metric .metric-value.consomme { color: #059669; }
    .budget-metric .metric-value.disponible { color: #D97706; }

    .budget-description {
      color: #6B7280;
      font-size: 14px;
      margin-bottom: 16px;
      font-style: italic;
    }

    .budget-form-section {
      background: #F9FAFB;
      padding: 16px;
      border-radius: 10px;
      border: 1px solid #E5E7EB;
    }

    .budget-separator {
      border: none;
      border-top: 2px dashed #FDE68A;
      margin: 24px 0;
    }

    input[type="number"] {
      width: 100%;
      padding: 12px 14px;
      border: 2px solid #E5E7EB;
      border-radius: 10px;
      font-size: 16px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    input[type="number"]:focus {
      outline: none;
      border-color: #F59E0B;
      box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.12);
    }

    @media (max-width: 600px) {
      .budget-info-grid {
        grid-template-columns: 1fr;
      }
    }
    `;
  }

  private getActionExtraFields(action: Action): string {
    return `
      <div class="extra-info">
        <div class="info-row">
          <span class="info-label">Axe:</span>
          <span class="info-value">${action.axe.replace('axe', 'Axe ').replace('_', ' - ')}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Priorité:</span>
          <span class="priority-badge priority-${action.priorite}">${action.priorite}</span>
        </div>
        ${action.date_debut ? `
        <div class="info-row">
          <span class="info-label">Début:</span>
          <span class="info-value">${this.formatDate(action.date_debut)}</span>
        </div>
        ` : ''}
      </div>
    `;
  }

  private getJalonExtraFields(jalon: Jalon): string {
    return `
      <div class="extra-info">
        ${jalon.livrables ? `
        <div class="deliverables">
          <h4>Livrables attendus</h4>
          <p>${jalon.livrables}</p>
        </div>
        ` : ''}
        ${jalon.criteres_succes ? `
        <div class="criteria">
          <h4>Critères de succès</h4>
          <p>${jalon.criteres_succes}</p>
        </div>
        ` : ''}
      </div>
    `;
  }

  private getJalonFormFields(): string {
    return `
      <div class="form-group">
        <label for="newDueDate">Proposer nouvelle date (si report)</label>
        <input type="date" id="newDueDate" name="newDueDate">
      </div>
    `;
  }

  private getRisqueExtraFields(risque: Risque): string {
    const prob = risque.probabilite_actuelle || risque.probabilite || 1;
    const imp = risque.impact_actuel || risque.impact || 1;
    const score = risque.score_actuel || risque.score || (prob * imp);
    const scoreClass = score >= 12 ? 'critical' : score >= 8 ? 'high' : score >= 4 ? 'medium' : 'low';

    return `
      <div class="risk-details">
        <div class="risk-metrics">
          <div class="risk-metric">
            <span class="metric-label">Probabilité</span>
            <span class="metric-value level-${prob}">${prob}/4</span>
          </div>
          <div class="risk-metric">
            <span class="metric-label">Impact</span>
            <span class="metric-value level-${imp}">${imp}/4</span>
          </div>
          <div class="risk-metric">
            <span class="metric-label">Criticité</span>
            <span class="metric-value score-${scoreClass}">${score}</span>
          </div>
        </div>
        ${risque.plan_mitigation ? `
        <div class="mitigation">
          <h4>Plan de mitigation</h4>
          <p>${risque.plan_mitigation}</p>
        </div>
        ` : ''}
        ${risque.plan_contingence ? `
        <div class="contingency">
          <h4>Plan de contingence</h4>
          <p>${risque.plan_contingence}</p>
        </div>
        ` : ''}
      </div>
    `;
  }

  private getRisqueFormFields(): string {
    return `
      <div class="form-row">
        <div class="form-group half">
          <label for="probability">Probabilité (1-4)</label>
          <select id="probability" name="probability">
            <option value="">Ne pas modifier</option>
            <option value="1">1 - Très faible</option>
            <option value="2">2 - Faible</option>
            <option value="3">3 - Moyenne</option>
            <option value="4">4 - Élevée</option>
          </select>
        </div>
        <div class="form-group half">
          <label for="impact">Impact (1-4)</label>
          <select id="impact" name="impact">
            <option value="">Ne pas modifier</option>
            <option value="1">1 - Mineur</option>
            <option value="2">2 - Modéré</option>
            <option value="3">3 - Majeur</option>
            <option value="4">4 - Critique</option>
          </select>
        </div>
      </div>
    `;
  }

  /**
   * Génère la section méthodologie EXCO (simplifiée et visuelle)
   */
  private getExcoSection(): string {
    return `
      <section class="exco-section">
        <h3>Comment mettre à jour ?</h3>

        <div class="steps-flow">
          <div class="step">
            <div class="step-icon">1</div>
            <div class="step-content">
              <strong>Lisez</strong>
              <span>les informations ci-dessus</span>
            </div>
          </div>

          <div class="step-arrow">></div>

          <div class="step">
            <div class="step-icon">2</div>
            <div class="step-content">
              <strong>Mettez à jour</strong>
              <span>statut et avancement</span>
            </div>
          </div>

          <div class="step-arrow">></div>

          <div class="step">
            <div class="step-icon">3</div>
            <div class="step-content">
              <strong>Commentez</strong>
              <span>difficultés ou besoins</span>
            </div>
          </div>

          <div class="step-arrow">></div>

          <div class="step">
            <div class="step-icon">4</div>
            <div class="step-content">
              <strong>Envoyez</strong>
              <span>en un clic</span>
            </div>
          </div>
        </div>

        <div class="info-box">
          <strong>Pourquoi c'est important ?</strong>
          <p>Votre mise à jour sera intégrée au tableau de bord projet et présentée en réunion de pilotage.</p>
        </div>
      </section>
    `;
  }

  /**
   * Styles pour la section EXCO
   */
  private getExcoStyles(): string {
    return `
    .exco-section {
      background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%);
      border: 2px solid #0EA5E9;
      border-radius: 16px;
      padding: 24px;
      margin: 24px 0;
    }

    .exco-section h3 {
      color: #0369A1;
      margin-bottom: 20px;
      text-align: center;
      font-size: 1.1rem;
    }

    .steps-flow {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 20px;
    }

    .step {
      display: flex;
      align-items: center;
      gap: 10px;
      background: white;
      padding: 12px 16px;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .step-icon {
      width: 32px;
      height: 32px;
      background: #0EA5E9;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
    }

    .step-content {
      display: flex;
      flex-direction: column;
    }

    .step-content strong {
      color: #0369A1;
      font-size: 14px;
    }

    .step-content span {
      color: #64748B;
      font-size: 12px;
    }

    .step-arrow {
      color: #0EA5E9;
      font-size: 20px;
      font-weight: bold;
    }

    .info-box {
      background: white;
      border-left: 4px solid #0EA5E9;
      padding: 12px 16px;
      border-radius: 0 8px 8px 0;
    }

    .info-box strong {
      color: #0369A1;
      display: block;
      margin-bottom: 4px;
      font-size: 13px;
    }

    .info-box p {
      color: #64748B;
      font-size: 13px;
      margin: 0;
    }

    @media (max-width: 600px) {
      .steps-flow {
        flex-direction: column;
      }

      .step-arrow {
        transform: rotate(90deg);
      }

      .step {
        width: 100%;
      }
    }
    `;
  }

  /**
   * Template de base pour toutes les pages
   */
  private generateBasePage(params: {
    type: ShareableItemType;
    config: ReturnType<typeof this.getTypeConfig>;
    token: string;
    item: {
      id: number;
      title: string;
      description: string;
      status: string;
      progress: number;
      dueDate: string;
      responsible?: { name: string; email: string };
      [key: string]: unknown;
    };
    extraFields: string;
    extraFormFields: string;
  }): string {
    const { type, config, token, item, extraFields, extraFormFields } = params;
    const apiUrl = this.config.apiUrl || 'https://your-api.supabase.co/functions/v1';

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.label}: ${item.title} | ${this.config.projectName}</title>
  <style>
    ${this.getStyles(config)}
    ${this.getExcoStyles()}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="header-left">
        <div class="logo-text">${this.config.companyName}</div>
        <div class="project-name">${this.config.projectName}</div>
      </div>
      <div class="badge badge-${type}">${config.label}</div>
    </header>

    <main>
      <section class="info-card">
        <h1>${item.title}</h1>

        <div class="meta">
          ${item.responsible ? `<span class="responsible">${item.responsible.name}</span>` : ''}
          <span class="due-date ${this.isOverdue(item.dueDate) ? 'overdue' : ''}">
            Echeance: ${this.formatDate(item.dueDate)}
          </span>
        </div>

        ${item.description ? `
        <div class="description">
          <h3>Description</h3>
          <p>${item.description}</p>
        </div>
        ` : ''}

        <div class="current-status">
          <h3>État actuel</h3>
          <div class="status-row">
            <span class="status-badge status-${item.status}">
              ${config.statuses[item.status as keyof typeof config.statuses] || item.status}
            </span>
            ${type !== 'risque' ? `
            <div class="progress-container">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${item.progress}%"></div>
              </div>
              <span class="progress-text">${item.progress}%</span>
            </div>
            ` : ''}
          </div>
        </div>

        ${extraFields}
      </section>

      ${this.getExcoSection()}

      <section class="update-form">
        <h2>Mettre a jour</h2>
        <form id="updateForm">
          <input type="hidden" name="token" value="${token}">
          <input type="hidden" name="entityId" value="${item.id}">
          <input type="hidden" name="entityType" value="${type}">

          <div class="form-group">
            <label for="status">Nouveau statut</label>
            <select id="status" name="status" required>
              ${Object.entries(config.statuses).map(([key, label]) =>
                `<option value="${key}" ${item.status === key ? 'selected' : ''}>${label}</option>`
              ).join('')}
            </select>
          </div>

          ${type !== 'risque' ? `
          <div class="form-group">
            <label for="progress">Progression</label>
            <div class="progress-input">
              <input type="range" id="progress" name="progress"
                     min="0" max="100" value="${item.progress}" step="5">
              <output id="progressOutput">${item.progress}%</output>
            </div>
          </div>
          ` : ''}

          <div class="form-group">
            <label for="comment">Commentaire / Mise à jour</label>
            <textarea id="comment" name="comment" rows="4"
                      placeholder="Décrivez l'avancement, les difficultés rencontrées, les prochaines étapes..."></textarea>
          </div>

          <div class="form-group">
            <label for="attachments">Pièces jointes (optionnel)</label>
            <input type="file" id="attachments" name="attachments" multiple
                   accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif">
            <small>Formats: PDF, Word, Excel, Images (max 10 Mo/fichier)</small>
          </div>

          ${extraFormFields}

          <div class="form-group">
            <label for="submitterName">Votre nom</label>
            <input type="text" id="submitterName" name="submitterName"
                   placeholder="Prénom Nom" value="${item.responsible?.name || ''}">
          </div>

          <div class="form-group">
            <label for="submitterEmail">Votre email</label>
            <input type="email" id="submitterEmail" name="submitterEmail"
                   placeholder="email@exemple.com" value="${item.responsible?.email || ''}">
          </div>

          <button type="submit" class="btn-submit">
            Envoyer la mise a jour
          </button>
        </form>
      </section>
    </main>

    <footer>
      <p>Cette page expire le <strong>${this.formatDate(this.getExpiryDate())}</strong>.</p>
      <p>En cas de problème, contactez le chef de projet.</p>
      <p class="powered-by">Propulsé par <strong>Cockpit ${this.config.projectName}</strong></p>
    </footer>
  </div>

  <div id="successModal" class="modal" style="display: none;">
    <div class="modal-content">
      <div class="success-icon"></div>
      <h2>Mise à jour envoyée !</h2>
      <p>Votre mise à jour a été transmise avec succès.</p>
      <p>Le chef de projet sera notifié automatiquement.</p>
      <button onclick="location.reload()" class="btn-secondary">Fermer</button>
    </div>
  </div>

  <script>
    const API_URL = '${apiUrl}/external-updates';
    const OFFLINE_MODE = ${!this.config.apiUrl};

    // Slider de progression
    const progressInput = document.getElementById('progress');
    if (progressInput) {
      progressInput.addEventListener('input', function() {
        document.getElementById('progressOutput').textContent = this.value + '%';
      });
    }

    // Soumission du formulaire
    document.getElementById('updateForm').addEventListener('submit', async function(e) {
      e.preventDefault();

      const submitBtn = this.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ Envoi en cours...';

      try {
        const formData = new FormData(this);

        // Préparer les fichiers
        const files = document.getElementById('attachments').files;
        const attachments = [];

        for (const file of files) {
          if (file.size > 10 * 1024 * 1024) {
            throw new Error('Fichier ' + file.name + ' trop volumineux (max 10 Mo)');
          }
          const base64 = await fileToBase64(file);
          attachments.push({
            name: file.name,
            type: file.type,
            size: file.size,
            data: base64
          });
        }

        const payload = {
          token: formData.get('token'),
          entityId: parseInt(formData.get('entityId')),
          entityType: formData.get('entityType'),
          submittedAt: new Date().toISOString(),
          submittedBy: {
            name: formData.get('submitterName'),
            email: formData.get('submitterEmail')
          },
          changes: {
            status: formData.get('status'),
            progress: parseInt(formData.get('progress') || '0'),
            comment: formData.get('comment'),
            probability: formData.get('probability') ? parseInt(formData.get('probability')) : undefined,
            impact: formData.get('impact') ? parseInt(formData.get('impact')) : undefined,
            newDueDate: formData.get('newDueDate') || undefined
          },
          attachments: attachments
        };

        if (OFFLINE_MODE) {
          // Mode offline: stocker en localStorage pour import manuel
          const updates = JSON.parse(localStorage.getItem('cockpit_external_updates') || '[]');
          updates.push(payload);
          localStorage.setItem('cockpit_external_updates', JSON.stringify(updates));
        } else {
          // Mode online: envoyer à l'API
          const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erreur serveur');
          }
        }

        // Afficher le modal de succès
        document.getElementById('successModal').style.display = 'flex';

      } catch (error) {
        alert('Erreur: ' + error.message);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });

    function fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  </script>
</body>
</html>`;
  }

  /**
   * Styles CSS
   */
  private getStyles(typeConfig: ReturnType<typeof this.getTypeConfig>): string {
    return `
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
      color: #1F2937;
      line-height: 1.6;
      min-height: 100vh;
    }

    .container {
      max-width: 700px;
      margin: 0 auto;
      padding: 20px;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding: 16px 20px;
      background: ${this.config.primaryColor};
      border-radius: 12px;
      color: white;
    }

    .header-left {
      display: flex;
      flex-direction: column;
    }

    .logo-text {
      font-size: 1.5rem;
      font-weight: 700;
      color: ${this.config.accentColor};
    }

    .project-name {
      font-size: 0.85rem;
      opacity: 0.9;
    }

    .badge {
      padding: 8px 20px;
      border-radius: 25px;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 0.5px;
    }

    .badge-action { background: ${typeConfig.bgColor}; color: ${typeConfig.textColor}; }
    .badge-jalon { background: #EDE9FE; color: #6D28D9; }
    .badge-risque { background: #FEE2E2; color: #DC2626; }

    .info-card, .update-form {
      background: white;
      border-radius: 16px;
      padding: 28px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 16px;
      color: ${this.config.primaryColor};
    }

    h2 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 20px;
      color: ${this.config.primaryColor};
    }

    h3 {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 8px;
      color: #374151;
    }

    h4 {
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 6px;
      color: #4B5563;
    }

    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      color: #6B7280;
      font-size: 14px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #E5E7EB;
    }

    .meta span {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .overdue {
      color: #DC2626;
      font-weight: 600;
    }

    .description {
      margin-bottom: 20px;
      padding: 16px;
      background: #F9FAFB;
      border-radius: 8px;
    }

    .description p {
      color: #4B5563;
    }

    .current-status {
      margin-bottom: 20px;
    }

    .status-row {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .status-badge {
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
    }

    .status-a_faire, .status-a_venir, .status-identifie { background: #E5E7EB; color: #374151; }
    .status-en_cours, .status-en_traitement { background: #DBEAFE; color: #1D4ED8; }
    .status-termine, .status-atteint, .status-mitige { background: #D1FAE5; color: #065F46; }
    .status-valide, .status-clos { background: #A7F3D0; color: #047857; }
    .status-bloque, .status-survenu { background: #FEE2E2; color: #DC2626; }
    .status-annule, .status-reporte { background: #FEF3C7; color: #92400E; }
    .status-en_danger, .status-depasse { background: #FECACA; color: #B91C1C; }

    .progress-container {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }

    .progress-bar {
      background: #E5E7EB;
      border-radius: 10px;
      height: 20px;
      flex: 1;
      overflow: hidden;
    }

    .progress-fill {
      background: linear-gradient(90deg, ${typeConfig.color}, ${typeConfig.color}dd);
      height: 100%;
      border-radius: 10px;
      transition: width 0.3s ease;
    }

    .progress-text {
      font-weight: 700;
      font-size: 14px;
      color: ${this.config.primaryColor};
      min-width: 45px;
    }

    /* Extra fields */
    .extra-info {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #E5E7EB;
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .info-label {
      font-weight: 500;
      color: #6B7280;
    }

    .priority-badge {
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .priority-critique { background: #FEE2E2; color: #DC2626; }
    .priority-haute { background: #FED7AA; color: #C2410C; }
    .priority-moyenne { background: #FEF3C7; color: #92400E; }
    .priority-basse { background: #D1FAE5; color: #065F46; }

    /* Risk specific */
    .risk-metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }

    .risk-metric {
      text-align: center;
      padding: 12px;
      background: #F9FAFB;
      border-radius: 8px;
    }

    .metric-label {
      display: block;
      font-size: 12px;
      color: #6B7280;
      margin-bottom: 4px;
    }

    .metric-value {
      font-size: 1.25rem;
      font-weight: 700;
    }

    .level-1 { color: #22C55E; }
    .level-2 { color: #84CC16; }
    .level-3 { color: #EAB308; }
    .level-4 { color: #EF4444; }

    .score-low { color: #22C55E; }
    .score-medium { color: #EAB308; }
    .score-high { color: #F97316; }
    .score-critical { color: #EF4444; }

    .mitigation, .contingency, .deliverables, .criteria {
      margin-top: 12px;
      padding: 12px;
      background: #F9FAFB;
      border-radius: 8px;
    }

    /* Form */
    .form-group {
      margin-bottom: 20px;
    }

    .form-row {
      display: flex;
      gap: 16px;
    }

    .form-group.half {
      flex: 1;
    }

    label {
      display: block;
      font-weight: 500;
      margin-bottom: 8px;
      color: #374151;
    }

    input[type="text"],
    input[type="email"],
    input[type="date"],
    select,
    textarea {
      width: 100%;
      padding: 12px 14px;
      border: 2px solid #E5E7EB;
      border-radius: 10px;
      font-size: 16px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: ${typeConfig.color};
      box-shadow: 0 0 0 3px ${typeConfig.color}20;
    }

    textarea {
      resize: vertical;
      min-height: 100px;
    }

    input[type="file"] {
      padding: 10px;
      border: 2px dashed #D1D5DB;
      border-radius: 10px;
      width: 100%;
      cursor: pointer;
    }

    input[type="file"]:hover {
      border-color: ${typeConfig.color};
    }

    small {
      display: block;
      margin-top: 6px;
      color: #9CA3AF;
      font-size: 12px;
    }

    .progress-input {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    input[type="range"] {
      flex: 1;
      height: 8px;
      -webkit-appearance: none;
      background: #E5E7EB;
      border-radius: 4px;
      outline: none;
    }

    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 24px;
      height: 24px;
      background: ${typeConfig.color};
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    output {
      font-weight: 700;
      font-size: 1.1rem;
      color: ${typeConfig.color};
      min-width: 50px;
    }

    .btn-submit {
      width: 100%;
      padding: 16px 24px;
      background: linear-gradient(135deg, #059669, #10B981);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .btn-submit:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4);
    }

    .btn-submit:disabled {
      background: #9CA3AF;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .btn-secondary {
      padding: 12px 24px;
      background: white;
      color: ${this.config.primaryColor};
      border: 2px solid ${this.config.primaryColor};
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-secondary:hover {
      background: ${this.config.primaryColor};
      color: white;
    }

    /* Modal */
    .modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      padding: 40px;
      border-radius: 20px;
      text-align: center;
      max-width: 400px;
      margin: 20px;
    }

    .success-icon {
      font-size: 4rem;
      margin-bottom: 16px;
    }

    .modal-content h2 {
      color: #059669;
      margin-bottom: 12px;
    }

    .modal-content p {
      color: #6B7280;
      margin-bottom: 8px;
    }

    .modal-content button {
      margin-top: 20px;
    }

    /* Footer */
    footer {
      text-align: center;
      color: #9CA3AF;
      font-size: 13px;
      padding: 24px;
    }

    footer p {
      margin-bottom: 6px;
    }

    .powered-by {
      margin-top: 12px;
      color: #6B7280;
    }

    /* Responsive */
    @media (max-width: 600px) {
      .container {
        padding: 12px;
      }

      header {
        flex-direction: column;
        gap: 12px;
        text-align: center;
      }

      .meta {
        flex-direction: column;
        gap: 8px;
      }

      .status-row {
        flex-direction: column;
        align-items: flex-start;
      }

      .progress-container {
        width: 100%;
      }

      .form-row {
        flex-direction: column;
      }

      .risk-metrics {
        grid-template-columns: 1fr;
      }
    }
    `;
  }

  /**
   * Sauvegarde le token en base de données
   */
  async saveToken(
    entityType: ShareableItemType,
    entityId: number,
    entityTitle: string,
    recipientEmail: string,
    recipientName: string
  ): Promise<string> {
    const token = this.generateToken();
    const now = new Date().toISOString();
    const expiry = this.getExpiryDate().toISOString();

    const shareToken: ShareToken = {
      token,
      entityType,
      entityId,
      entityTitle,
      recipientEmail,
      recipientName,
      createdAt: now,
      expiresAt: expiry,
      usedCount: 0,
      isActive: true,
    };

    await db.table('shareTokens').add(shareToken);
    return token;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const externalShareService = new ExternalShareService();

export default ExternalShareService;
