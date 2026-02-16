/**
 * SendReportModal — Generate a read-only sharing link for the EXCO Mensuel report.
 * Connects to the email service for sending via EmailJS / simulation.
 * Multi-recipient picker from users database + manual email entry.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Copy, Check, Loader2, X, Mail, UserPlus, ChevronDown, Send, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui';
import { useUsers, getUserFullName } from '@/hooks/useUsers';
import { sendReportShareEmail, openEmailClientForReport, getReportShareTemplate } from '@/services/emailService';
import { storeReportInFirebase } from '@/services/firebaseRealtimeSync';
import { generateExcoPptx } from './exportPptx';
import { PROJET_CONFIG } from '@/data/constants';
import type { User } from '@/types';
import type { ExcoV5Data } from './hooks/useExcoV5Data';
import { C } from './constants';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

interface SendReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  presentationDate: string;
  /** Generates the full HTML string for the current presentation */
  generateHtml: () => string;
  /** Get aggregated data for email stats */
  getData?: () => ExcoV5Data | undefined;
}

type ExpiryOption = { label: string; hours: number };

const EXPIRY_OPTIONS: ExpiryOption[] = [
  { label: '1 heure', hours: 1 },
  { label: '24 heures', hours: 24 },
  { label: '48 heures', hours: 48 },
  { label: '7 jours', hours: 168 },
  { label: '30 jours', hours: 720 },
];

type FormatChoice = 'html' | 'pptx' | 'pdf';

// ============================================================================
// TOKEN HELPER (standalone — no ExternalShareService dependency)
// ============================================================================

function generateToken(): string {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SendReportModal({ isOpen, onClose, presentationDate, generateHtml, getData }: SendReportModalProps) {
  const users = useUsers();
  const [step, setStep] = useState<'config' | 'success'>('config');
  const [format, setFormat] = useState<FormatChoice>('html');
  const [expiryIdx, setExpiryIdx] = useState(1); // default 24h
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [manualEmail, setManualEmail] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [emailsSentCount, setEmailsSentCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  // Reset on open/close
  useEffect(() => {
    if (!isOpen) {
      setStep('config');
      setGeneratedLink('');
      setCopied(false);
      setSelectedEmails([]);
      setManualEmail('');
      setDropdownOpen(false);
      setSearchFilter('');
      setFormat('html');
      setExpiryIdx(1);
      setEmailsSentCount(0);
      setShowPreview(false);
      setPreviewHtml('');
    }
  }, [isOpen]);

  const toggleEmail = useCallback((email: string) => {
    setSelectedEmails(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  }, []);

  const addManualEmail = useCallback(() => {
    const trimmed = manualEmail.trim();
    if (trimmed && trimmed.includes('@') && !selectedEmails.includes(trimmed)) {
      setSelectedEmails(prev => [...prev, trimmed]);
      setManualEmail('');
    }
  }, [manualEmail, selectedEmails]);

  const generateEmailPreview = useCallback(async () => {
    const template = await getReportShareTemplate();
    if (!template) {
      setPreviewHtml('<p style="padding:20px;color:#666;">Aucun template de rapport disponible</p>');
      return;
    }

    let html = template.bodyHtml;
    const data = getData?.();
    const senderName = PROJET_CONFIG.presentateur.nom;
    const reportPeriod = data?.moisCourant || presentationDate;

    // Use first selected recipient name, or placeholder
    const firstEmail = selectedEmails[0];
    const firstUser = firstEmail ? users.find((u: User) => u.email === firstEmail) : undefined;
    const recipientName = firstUser ? getUserFullName(firstUser) : (firstEmail?.split('@')[0] || '[Destinataire]');

    const replacements: Record<string, string> = {
      recipient_name: recipientName,
      sender_name: senderName,
      rapport_periode: reportPeriod,
      report_link: '#apercu',
      total_actions: String(data?.kpis?.totalActions || data?.allActions?.length || 0),
      total_jalons: String(data?.kpis?.jalonsTotal || data?.allJalons?.length || 0),
      total_risques: String(data?.kpis?.totalRisques || data?.allRisques?.length || 0),
      avancement_global: String(Math.round(data?.avancementGlobal || 0)),
    };

    for (const [key, value] of Object.entries(replacements)) {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    setPreviewHtml(html);
  }, [getData, presentationDate, selectedEmails, users]);

  const handleTogglePreview = useCallback(async () => {
    if (!showPreview) {
      await generateEmailPreview();
    }
    setShowPreview(prev => !prev);
  }, [showPreview, generateEmailPreview]);

  const filteredUsers = users.filter((u: User) => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return u.email.toLowerCase().includes(q) || getUserFullName(u).toLowerCase().includes(q);
  });

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const token = generateToken();
      const expiry = EXPIRY_OPTIONS[expiryIdx];
      const expiresAt = new Date(Date.now() + expiry.hours * 3600_000).toISOString();

      // Generate HTML and store in Firebase for external access
      const html = generateHtml();
      const data = getData?.();
      const senderName = PROJET_CONFIG.presentateur.nom;
      const reportPeriod = data?.moisCourant || presentationDate;

      const link = `${window.location.origin}/report-view/${token}`;

      // Store in Firebase so recipients can access it
      const stored = await storeReportInFirebase(token, html, {
        title: `EXCO Mensuel — ${reportPeriod}`,
        period: reportPeriod,
        senderName,
        expiresAt,
      });

      // Always store locally as fallback for same-browser access
      try {
        const localReports = JSON.parse(localStorage.getItem('shared_reports') || '{}');
        localReports[token] = {
          html,
          title: `EXCO Mensuel — ${reportPeriod}`,
          period: reportPeriod,
          expiresAt,
        };
        // Keep only last 5 reports to avoid localStorage bloat
        const keys = Object.keys(localReports);
        if (keys.length > 5) {
          delete localReports[keys[0]];
        }
        localStorage.setItem('shared_reports', JSON.stringify(localReports));
      } catch {
        // localStorage might be full — non-blocking
      }

      if (!stored) {
        logger.warn('Firebase storage failed — rapport accessible en local uniquement');
      }

      // Send emails to selected recipients via the email service
      let sentCount = 0;
      if (selectedEmails.length > 0) {
        const stats = {
          totalActions: data?.kpis?.totalActions || data?.allActions?.length || 0,
          totalJalons: data?.kpis?.jalonsTotal || data?.allJalons?.length || 0,
          totalRisques: data?.kpis?.totalRisques || data?.allRisques?.length || 0,
          avancementGlobal: Math.round(data?.avancementGlobal || 0),
        };

        for (const recipient of selectedEmails) {
          // Find user name if available
          const user = users.find((u: User) => u.email === recipient);
          const recipientName = user ? getUserFullName(user) : recipient.split('@')[0];

          const emailParams = {
            recipientEmail: recipient,
            recipientName,
            senderName,
            reportLink: link,
            reportPeriod,
            stats,
          };

          const result = await sendReportShareEmail(emailParams);
          if (result.success) {
            sentCount++;
          } else {
            // Fallback: ouvrir le client email local
            openEmailClientForReport(emailParams);
          }
        }
      }

      setEmailsSentCount(sentCount);
      setGeneratedLink(link);
      setStep('success');

      // Format-specific local download for the sender
      if (format === 'pptx' && data) {
        try {
          await generateExcoPptx(data, presentationDate);
        } catch (e) {
          logger.error('Erreur export PPTX:', e);
        }
      } else if (format === 'pdf') {
        // Open in print dialog for PDF save
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.onload = () => setTimeout(() => { try { printWindow.print(); } catch {} }, 500);
        }
      } else {
        // HTML: open preview in new tab
        window.open(link, '_blank');
      }
    } catch (err) {
      logger.error('Erreur génération lien:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [expiryIdx, format, presentationDate, selectedEmails, generateHtml, getData, users]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = generatedLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [generatedLink]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: 540, maxHeight: '90vh',
          backgroundColor: C.white, borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          padding: 0,
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', borderBottom: `2px solid ${C.gold}`,
            background: C.navy,
            borderRadius: '12px 12px 0 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Send size={18} color={C.gold} />
            <span style={{ fontSize: 16, fontWeight: 600, color: C.white }}>
              Envoyer le rapport
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: C.gray300 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {step === 'config' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Format */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 8, display: 'block' }}>
                  Format d'export
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['html', 'pdf', 'pptx'] as FormatChoice[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      style={{
                        flex: 1, padding: '10px 16px', borderRadius: 8,
                        border: `2px solid ${format === f ? C.gold : C.gray200}`,
                        backgroundColor: format === f ? C.goldBg : C.white,
                        cursor: 'pointer',
                        fontSize: 13, fontWeight: format === f ? 600 : 400,
                        color: format === f ? C.navy : C.gray600,
                        transition: 'all 0.15s',
                      }}
                    >
                      {f === 'html' ? '🌐 HTML' : f === 'pdf' ? '📄 PDF' : '📊 PPTX'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expiry */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 8, display: 'block' }}>
                  Durée du lien
                </label>
                <select
                  value={expiryIdx}
                  onChange={(e) => setExpiryIdx(Number(e.target.value))}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8,
                    border: `1px solid ${C.gray200}`, fontSize: 13,
                    color: C.navy, backgroundColor: C.white,
                  }}
                >
                  {EXPIRY_OPTIONS.map((opt, i) => (
                    <option key={i} value={i}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Destinataires */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={14} color={C.gray500} />
                  Destinataires (optionnel)
                </label>

                {/* Selected emails chips */}
                {selectedEmails.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {selectedEmails.map(em => (
                      <span
                        key={em}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '4px 10px', borderRadius: 16,
                          backgroundColor: C.goldBg, border: `1px solid ${C.goldBorder}`,
                          fontSize: 12, color: C.navy,
                        }}
                      >
                        {em}
                        <button
                          onClick={() => toggleEmail(em)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: 0, lineHeight: 1, color: C.gray500, fontSize: 14,
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* User dropdown picker */}
                <div ref={dropdownRef} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => { setDropdownOpen(!dropdownOpen); setSearchFilter(''); }}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: 8,
                      border: `1px solid ${dropdownOpen ? C.gold : C.gray200}`, fontSize: 13,
                      color: C.gray500, backgroundColor: C.white,
                      cursor: 'pointer', textAlign: 'left',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      transition: 'border-color 0.15s',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <UserPlus size={14} />
                      Ajouter des destinataires...
                    </span>
                    <ChevronDown size={14} style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                  </button>

                  {dropdownOpen && (
                    <div
                      style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        marginTop: 4, borderRadius: 8,
                        border: `1px solid ${C.gray200}`, backgroundColor: C.white,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        zIndex: 200, maxHeight: 280,
                        display: 'flex', flexDirection: 'column',
                      }}
                    >
                      {/* Search filter — sticky */}
                      <div style={{ padding: '8px 10px', borderBottom: `1px solid ${C.gray200}`, flexShrink: 0 }}>
                        <input
                          type="text"
                          value={searchFilter}
                          onChange={e => setSearchFilter(e.target.value)}
                          placeholder="Rechercher par nom ou email..."
                          autoFocus
                          style={{
                            width: '100%', padding: '6px 8px', borderRadius: 6,
                            border: `1px solid ${C.gray200}`, fontSize: 12,
                            color: C.navy, boxSizing: 'border-box', outline: 'none',
                          }}
                          onFocus={e => { e.currentTarget.style.borderColor = C.gold; }}
                          onBlur={e => { e.currentTarget.style.borderColor = C.gray200; }}
                        />
                      </div>

                      {/* User list — scrollable */}
                      <div style={{ overflowY: 'auto', flex: 1 }}>
                        {filteredUsers.length === 0 ? (
                          <div style={{ padding: '12px 14px', fontSize: 12, color: C.gray400, textAlign: 'center' }}>
                            Aucun utilisateur trouvé
                          </div>
                        ) : (
                          filteredUsers.map((u: User) => {
                            const isSelected = selectedEmails.includes(u.email);
                            return (
                              <button
                                key={u.id ?? u.email}
                                onClick={() => { toggleEmail(u.email); }}
                                style={{
                                  width: '100%', padding: '8px 14px', border: 'none',
                                  backgroundColor: isSelected ? C.goldBg : 'transparent',
                                  cursor: 'pointer', textAlign: 'left',
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  transition: 'background-color 0.1s',
                                }}
                                onMouseEnter={e => { if (!isSelected) (e.currentTarget.style.backgroundColor = C.gray100); }}
                                onMouseLeave={e => { (e.currentTarget.style.backgroundColor = isSelected ? C.goldBg : 'transparent'); }}
                              >
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 500, color: C.navy }}>
                                    {getUserFullName(u)}
                                  </div>
                                  <div style={{ fontSize: 11, color: C.gray500 }}>{u.email}</div>
                                </div>
                                {isSelected && <Check size={14} color={C.gold} />}
                              </button>
                            );
                          })
                        )}
                      </div>

                      {/* Manual email entry — sticky bottom */}
                      <div style={{ padding: '8px 10px', borderTop: `1px solid ${C.gray200}`, display: 'flex', gap: 6, flexShrink: 0 }}>
                        <input
                          type="email"
                          value={manualEmail}
                          onChange={e => setManualEmail(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addManualEmail(); } }}
                          placeholder="Email externe..."
                          style={{
                            flex: 1, padding: '6px 8px', borderRadius: 6,
                            border: `1px solid ${C.gray200}`, fontSize: 12,
                            color: C.navy, boxSizing: 'border-box', outline: 'none',
                          }}
                        />
                        <button
                          onClick={addManualEmail}
                          disabled={!manualEmail.trim() || !manualEmail.includes('@')}
                          style={{
                            padding: '6px 10px', borderRadius: 6, border: 'none',
                            backgroundColor: C.navy, color: C.white, fontSize: 11,
                            fontWeight: 600, cursor: 'pointer',
                            opacity: (!manualEmail.trim() || !manualEmail.includes('@')) ? 0.4 : 1,
                          }}
                        >
                          Ajouter
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Email preview toggle */}
              <div>
                <button
                  onClick={handleTogglePreview}
                  style={{
                    width: '100%', padding: '10px 16px', borderRadius: 8,
                    border: `1px solid ${C.gray200}`,
                    backgroundColor: showPreview ? C.gray100 : C.white,
                    cursor: 'pointer', fontSize: 13, fontWeight: 500,
                    color: C.navy, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 8,
                    transition: 'all 0.15s',
                  }}
                >
                  {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showPreview ? 'Masquer l\'aperçu email' : 'Aperçu de l\'email'}
                </button>
              </div>

              {/* Email preview panel */}
              {showPreview && (
                <div style={{
                  border: `1px solid ${C.gray200}`, borderRadius: 8,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    backgroundColor: C.gray100, padding: '8px 12px',
                    borderBottom: `1px solid ${C.gray200}`,
                    fontSize: 11, fontWeight: 600, color: C.gray500,
                    textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>
                    Aperçu de l'email
                  </div>
                  <div style={{ backgroundColor: C.white, maxHeight: 320, overflow: 'auto' }}>
                    <iframe
                      srcDoc={previewHtml}
                      title="Aperçu email rapport"
                      style={{ width: '100%', height: 320, border: 'none' }}
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>
              )}

              {/* Generate button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full"
                style={{
                  padding: '12px', borderRadius: 8,
                  backgroundColor: C.navy, color: C.white,
                  fontSize: 14, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    {selectedEmails.length > 0
                      ? `Générer et envoyer (${selectedEmails.length})`
                      : 'Générer le lien'}
                  </>
                )}
              </Button>
            </div>
          )}

          {step === 'success' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center' }}>
              <div
                style={{
                  width: 48, height: 48, borderRadius: '50%',
                  backgroundColor: C.greenBg, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Check size={24} color={C.green} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.navy }}>
                {format === 'pptx' ? 'PPTX téléchargé + lien généré' : format === 'pdf' ? 'PDF ouvert + lien généré' : 'Lien généré avec succès'}
              </div>
              <div style={{ fontSize: 12, color: C.gray500 }}>
                {format !== 'html' && 'Le fichier a été téléchargé localement. '}
                Lien en ligne expire dans {EXPIRY_OPTIONS[expiryIdx].label}
              </div>

              {/* Email sent feedback */}
              {emailsSentCount > 0 && (
                <div style={{
                  padding: '8px 16px', borderRadius: 8,
                  backgroundColor: C.greenBg, border: `1px solid ${C.green}`,
                  fontSize: 13, color: '#065f46', width: '100%',
                  display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
                }}>
                  <Mail size={14} />
                  {emailsSentCount} email{emailsSentCount > 1 ? 's' : ''} envoyé{emailsSentCount > 1 ? 's' : ''}
                </div>
              )}

              {/* Link box */}
              <div
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  backgroundColor: C.gray100, border: `1px solid ${C.gray200}`,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <input
                  readOnly
                  value={generatedLink}
                  style={{
                    flex: 1, border: 'none', backgroundColor: 'transparent',
                    fontSize: 12, color: C.navy, outline: 'none',
                  }}
                />
                <button
                  onClick={handleCopy}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '6px 12px', borderRadius: 6,
                    border: 'none', cursor: 'pointer',
                    backgroundColor: copied ? C.greenBg : C.navy,
                    color: copied ? C.green : C.white,
                    fontSize: 12, fontWeight: 500,
                    transition: 'all 0.2s',
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copié !' : 'Copier'}
                </button>
              </div>

              <Button
                onClick={onClose}
                className="w-full"
                variant="outline"
                style={{ marginTop: 8 }}
              >
                Fermer
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
