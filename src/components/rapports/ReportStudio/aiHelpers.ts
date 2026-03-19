import { getClaudeConfig } from '@/services/claudeService';
import { API_ENDPOINTS } from '@/lib/apiEndpoints';
import { logger } from '@/lib/logger';
import type { Section, AIMessage } from '@/types/reportStudio';

/**
 * Build a text summary of the report sections for context injection.
 */
function buildReportContext(sections: Section[]): string {
  const lines: string[] = [];
  for (const section of sections) {
    lines.push(`## ${section.title}`);
    for (const block of section.blocks) {
      switch (block.type) {
        case 'paragraph':
          if (block.content) lines.push(block.content);
          break;
        case 'heading':
          lines.push(`${'#'.repeat(block.level)} ${block.content}`);
          break;
        case 'callout':
          lines.push(`[${block.variant}] ${block.content}`);
          break;
        case 'list':
          block.items.forEach((item, i) =>
            lines.push(block.listType === 'numbered' ? `${i + 1}. ${item}` : `- ${item}`)
          );
          break;
        case 'quote':
          lines.push(`> ${block.content}`);
          break;
        case 'chart':
          lines.push(`[Graphique: ${block.title || 'sans titre'}]`);
          break;
        case 'table':
          lines.push(`[Tableau: ${block.title || 'sans titre'}]`);
          break;
        case 'kpi_card':
          lines.push(`[KPI: ${block.data.label} = ${block.data.value}${block.data.unit || ''}]`);
          break;
        default:
          break;
      }
    }
    if (section.children?.length) {
      lines.push(buildReportContext(section.children));
    }
  }
  return lines.join('\n');
}

/**
 * Chat with Claude API using the project's existing config.
 * Falls back to a helpful message if API is not configured.
 */
export async function chatWithClaude(
  message: string,
  sections: Section[],
  history: AIMessage[]
): Promise<string> {
  const config = getClaudeConfig();

  if (!config) {
    return "L'API Claude n'est pas configurée. Allez dans Paramètres > IA pour configurer votre clé API Anthropic. En attendant, je ne peux pas répondre à vos questions.";
  }

  const reportContext = buildReportContext(sections);

  const systemPrompt = `Tu es un assistant d'édition de rapports professionnels intégré au Report Studio du Cockpit COSMOS Angré.
Tu aides l'utilisateur à rédiger, améliorer et analyser son rapport.

Contexte du rapport actuel :
${reportContext || '(Le rapport est vide pour le moment)'}

Règles :
- Réponds toujours en français
- Sois concis et professionnel
- Si on te demande de rédiger du contenu, fournis du texte prêt à copier-coller
- Si on te demande d'analyser, structure ta réponse avec des points clés`;

  // Build messages from history (skip system messages, only keep recent)
  const apiMessages = history
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content }));

  // Add current message
  apiMessages.push({ role: 'user' as const, content: message });

  try {
    const response = await fetch(API_ENDPOINTS.anthropic.messages, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(import.meta.env.PROD && { 'x-api-key': config.apiKey }),
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model || 'claude-sonnet-4-20250514',
        max_tokens: config.maxTokens || 2048,
        system: systemPrompt,
        messages: apiMessages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMsg = errorData?.error?.message || response.statusText;
      logger.error('Claude API error:', errorMsg);
      return `Erreur API Claude (${response.status}): ${errorMsg}`;
    }

    const data = await response.json();
    const textContent = data.content?.find(
      (c: { type: string }) => c.type === 'text'
    );
    return textContent?.text || 'Réponse vide de Claude.';
  } catch (error) {
    logger.error('Erreur appel Claude API:', error);
    return `Erreur de connexion à l'API Claude: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
  }
}
