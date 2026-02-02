// ============================================================================
// TEMPLATE EMAIL HTML - Rappel Actions & Jalons Mensuel
// ============================================================================

import React from 'react';
import { useMonthlyReport, MOIS_FR } from './hooks/useMonthlyReport';

interface EmailTemplateProps {
  mois?: number;
  annee?: number;
  baseUrl?: string;
}

/**
 * Template email HTML pour le rappel mensuel des actions et jalons
 * Design responsive, sobre et professionnel
 */
export function EmailTemplate({ mois, annee, baseUrl = 'https://cockpit.app' }: EmailTemplateProps) {
  const data = useMonthlyReport(mois, annee);

  const reportUrl = `${baseUrl}/rapport/mensuel/${data.annee}-${String(data.mois + 1).padStart(2, '0')}`;

  // Format période
  const debutMoisFormate = `1er ${MOIS_FR[data.mois].toLowerCase()}`;
  const finMoisFormate = `${data.finMois.getDate()} ${MOIS_FR[data.mois].toLowerCase()}`;

  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Rappel Actions & Jalons - {data.periodeLabel}</title>
      </head>
      <body style={{
        margin: 0,
        padding: 0,
        backgroundColor: '#f5f5f5',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        lineHeight: 1.6,
      }}>
        {/* Container principal */}
        <table
          role="presentation"
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: '#f5f5f5',
            padding: '20px 0',
          }}
        >
          <tr>
            <td align="center">
              {/* Email container */}
              <table
                role="presentation"
                style={{
                  width: '100%',
                  maxWidth: '600px',
                  borderCollapse: 'collapse',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                }}
              >
                {/* Header */}
                <tr>
                  <td style={{
                    backgroundColor: '#18181b',
                    color: '#ffffff',
                    padding: '24px 32px',
                    textAlign: 'center',
                  }}>
                    <p style={{
                      margin: 0,
                      fontSize: '14px',
                      fontWeight: 600,
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      color: '#a1a1aa',
                    }}>
                      COCKPIT Project Management
                    </p>
                    <div style={{
                      width: '60px',
                      height: '2px',
                      backgroundColor: '#3b82f6',
                      margin: '16px auto',
                    }} />
                    <h1 style={{
                      margin: 0,
                      fontSize: '24px',
                      fontWeight: 700,
                      color: '#ffffff',
                    }}>
                      RAPPEL ACTIONS & JALONS
                    </h1>
                    <p style={{
                      margin: '8px 0 0 0',
                      fontSize: '18px',
                      color: '#e4e4e7',
                    }}>
                      {data.periodeLabel}
                    </p>
                  </td>
                </tr>

                {/* Project Info */}
                <tr>
                  <td style={{
                    padding: '24px 32px',
                    backgroundColor: '#fafafa',
                    borderBottom: '1px solid #e4e4e7',
                  }}>
                    <table role="presentation" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tr>
                        <td>
                          <p style={{
                            margin: 0,
                            fontSize: '16px',
                            fontWeight: 600,
                            color: '#18181b',
                          }}>
                            Projet : {data.projectName}
                          </p>
                          <p style={{
                            margin: '4px 0 0 0',
                            fontSize: '14px',
                            color: '#71717a',
                          }}>
                            <strong style={{ color: '#3b82f6' }}>J-{data.joursRestants}</strong> avant ouverture
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Résumé du mois */}
                <tr>
                  <td style={{ padding: '32px' }}>
                    <h2 style={{
                      margin: '0 0 20px 0',
                      fontSize: '18px',
                      fontWeight: 600,
                      color: '#18181b',
                      borderBottom: '2px solid #e4e4e7',
                      paddingBottom: '8px',
                    }}>
                      RÉSUMÉ DU MOIS
                    </h2>

                    <table role="presentation" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tr>
                        <td style={{ padding: '8px 0', color: '#52525b', fontSize: '14px' }}>
                          Période
                        </td>
                        <td style={{ padding: '8px 0', color: '#18181b', fontSize: '14px', fontWeight: 500, textAlign: 'right' }}>
                          {debutMoisFormate} → {finMoisFormate} {data.annee}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 0', color: '#52525b', fontSize: '14px' }}>
                          Actions
                        </td>
                        <td style={{ padding: '8px 0', color: '#18181b', fontSize: '14px', fontWeight: 500, textAlign: 'right' }}>
                          <strong>{data.stats.totalActions}</strong> actions à réaliser
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 0', color: '#52525b', fontSize: '14px' }}>
                          Jalons
                        </td>
                        <td style={{ padding: '8px 0', color: '#18181b', fontSize: '14px', fontWeight: 500, textAlign: 'right' }}>
                          <strong>{data.stats.totalJalons}</strong> jalons à atteindre
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Points d'attention */}
                {(data.stats.actionsEnRetard > 0 || data.stats.jalonsEnDanger > 0) && (
                  <tr>
                    <td style={{ padding: '0 32px 32px 32px' }}>
                      <div style={{
                        backgroundColor: '#fef3c7',
                        border: '1px solid #f59e0b',
                        borderRadius: '8px',
                        padding: '16px 20px',
                      }}>
                        <h3 style={{
                          margin: '0 0 12px 0',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#92400e',
                          textTransform: 'uppercase',
                        }}>
                          Points d'attention
                        </h3>
                        <ul style={{
                          margin: 0,
                          padding: '0 0 0 20px',
                          color: '#78350f',
                          fontSize: '14px',
                        }}>
                          {data.stats.actionsEnRetard > 0 && (
                            <li style={{ marginBottom: '4px' }}>
                              <strong>{data.stats.actionsEnRetard}</strong> action{data.stats.actionsEnRetard > 1 ? 's' : ''} en retard
                            </li>
                          )}
                          {data.stats.jalonsEnDanger > 0 && (
                            <li>
                              <strong>{data.stats.jalonsEnDanger}</strong> jalon{data.stats.jalonsEnDanger > 1 ? 's' : ''} à risque de dépassement
                            </li>
                          )}
                        </ul>
                      </div>
                    </td>
                  </tr>
                )}

                {/* CTA Button */}
                <tr>
                  <td style={{ padding: '0 32px 40px 32px', textAlign: 'center' }}>
                    <table role="presentation" style={{ margin: '0 auto', borderCollapse: 'collapse' }}>
                      <tr>
                        <td>
                          <a
                            href={reportUrl}
                            style={{
                              display: 'inline-block',
                              backgroundColor: '#3b82f6',
                              color: '#ffffff',
                              padding: '16px 32px',
                              fontSize: '16px',
                              fontWeight: 600,
                              textDecoration: 'none',
                              borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                            }}
                          >
                            VOIR TOUTES LES ACTIONS DU MOIS
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td style={{
                    backgroundColor: '#fafafa',
                    padding: '20px 32px',
                    textAlign: 'center',
                    borderTop: '1px solid #e4e4e7',
                  }}>
                    <p style={{
                      margin: 0,
                      fontSize: '12px',
                      color: '#71717a',
                    }}>
                      COCKPIT Project Management
                    </p>
                    <p style={{
                      margin: '4px 0 0 0',
                      fontSize: '11px',
                      color: '#a1a1aa',
                    }}>
                      Rapport généré automatiquement le {new Date().toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
}

/**
 * Génère le HTML brut de l'email pour l'envoi
 */
export function generateEmailHtml(data: {
  periodeLabel: string;
  projectName: string;
  joursRestants: number;
  stats: {
    totalActions: number;
    totalJalons: number;
    actionsEnRetard: number;
    jalonsEnDanger: number;
  };
  mois: number;
  annee: number;
  finMois: Date;
  baseUrl?: string;
}): string {
  const { periodeLabel, projectName, joursRestants, stats, mois, annee, finMois, baseUrl = 'https://cockpit.app' } = data;

  const reportUrl = `${baseUrl}/rapport/mensuel/${annee}-${String(mois + 1).padStart(2, '0')}`;
  const debutMoisFormate = `1er ${MOIS_FR[mois].toLowerCase()}`;
  const finMoisFormate = `${finMois.getDate()} ${MOIS_FR[mois].toLowerCase()}`;
  const dateGeneration = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const pointsAttentionHtml = (stats.actionsEnRetard > 0 || stats.jalonsEnDanger > 0) ? `
    <tr>
      <td style="padding: 0 32px 32px 32px;">
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px 20px;">
          <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #92400e; text-transform: uppercase;">
            Points d'attention
          </h3>
          <ul style="margin: 0; padding: 0 0 0 20px; color: #78350f; font-size: 14px;">
            ${stats.actionsEnRetard > 0 ? `<li style="margin-bottom: 4px;"><strong>${stats.actionsEnRetard}</strong> action${stats.actionsEnRetard > 1 ? 's' : ''} en retard</li>` : ''}
            ${stats.jalonsEnDanger > 0 ? `<li><strong>${stats.jalonsEnDanger}</strong> jalon${stats.jalonsEnDanger > 1 ? 's' : ''} à risque de dépassement</li>` : ''}
          </ul>
        </div>
      </td>
    </tr>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rappel Actions & Jalons - ${periodeLabel}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #18181b; color: #ffffff; padding: 24px 32px; text-align: center;">
              <p style="margin: 0; font-size: 14px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: #a1a1aa;">
                COCKPIT Project Management
              </p>
              <div style="width: 60px; height: 2px; background-color: #3b82f6; margin: 16px auto;"></div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">
                RAPPEL ACTIONS & JALONS
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 18px; color: #e4e4e7;">
                ${periodeLabel}
              </p>
            </td>
          </tr>

          <!-- Project Info -->
          <tr>
            <td style="padding: 24px 32px; background-color: #fafafa; border-bottom: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 16px; font-weight: 600; color: #18181b;">
                Projet : ${projectName}
              </p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #71717a;">
                <strong style="color: #3b82f6;">J-${joursRestants}</strong> avant ouverture
              </p>
            </td>
          </tr>

          <!-- Résumé -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #18181b; border-bottom: 2px solid #e4e4e7; padding-bottom: 8px;">
                RÉSUMÉ DU MOIS
              </h2>
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #52525b; font-size: 14px;">Période</td>
                  <td style="padding: 8px 0; color: #18181b; font-size: 14px; font-weight: 500; text-align: right;">
                    ${debutMoisFormate} → ${finMoisFormate} ${annee}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #52525b; font-size: 14px;">Actions</td>
                  <td style="padding: 8px 0; color: #18181b; font-size: 14px; font-weight: 500; text-align: right;">
                    <strong>${stats.totalActions}</strong> actions à réaliser
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #52525b; font-size: 14px;">Jalons</td>
                  <td style="padding: 8px 0; color: #18181b; font-size: 14px; font-weight: 500; text-align: right;">
                    <strong>${stats.totalJalons}</strong> jalons à atteindre
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${pointsAttentionHtml}

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 32px 40px 32px; text-align: center;">
              <a href="${reportUrl}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 16px 32px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);">
                VOIR TOUTES LES ACTIONS DU MOIS
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 20px 32px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 12px; color: #71717a;">
                COCKPIT Project Management
              </p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #a1a1aa;">
                Rapport généré automatiquement le ${dateGeneration}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export default EmailTemplate;
