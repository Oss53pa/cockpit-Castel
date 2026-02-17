/**
 * ReportViewPage — Affiche un rapport HTML partagé via Firebase
 * Route publique: /report-view/:token
 */

import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getReportFromFirebase } from '@/services/firebaseRealtimeSync';
import { FIREBASE_TTL } from '@/data/constants';

export function ReportViewPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!token) {
      setError('Lien invalide');
      setLoading(false);
      return;
    }

    getReportFromFirebase(token)
      .then((result) => {
        if (result.status === 'ok') {
          setHtml(result.data.html);
          setTitle(result.data.title || 'Rapport EXCO');
        } else if (result.status === 'expired') {
          setError(`Ce rapport a expiré (disponible ${FIREBASE_TTL.UPDATE_LINKS} jours après création). Contactez l'administrateur pour un nouveau lien.`);
        } else if (result.status === 'not_found') {
          // Fallback: try localStorage (same-browser access)
          try {
            const localReports = JSON.parse(localStorage.getItem('shared_reports') || '{}');
            const local = localReports[token];
            if (local && local.html) {
              if (!local.expiresAt || new Date(local.expiresAt) > new Date()) {
                setHtml(local.html);
                setTitle(local.title || 'Rapport EXCO');
                return;
              }
            }
          } catch {
            // ignore localStorage errors
          }
          setError('Ce rapport n\'existe pas ou a été supprimé.');
        } else {
          // status === 'error' — fallback localStorage
          try {
            const localReports = JSON.parse(localStorage.getItem('shared_reports') || '{}');
            const local = localReports[token];
            if (local && local.html) {
              if (!local.expiresAt || new Date(local.expiresAt) > new Date()) {
                setHtml(local.html);
                setTitle(local.title || 'Rapport EXCO');
                return;
              }
            }
          } catch {
            // ignore
          }
          setError('Impossible de charger le rapport. Vérifiez votre connexion.');
        }
      })
      .catch(() => {
        // Fallback: try localStorage on Firebase error
        try {
          const localReports = JSON.parse(localStorage.getItem('shared_reports') || '{}');
          const local = localReports[token];
          if (local && local.html) {
            if (!local.expiresAt || new Date(local.expiresAt) > new Date()) {
              setHtml(local.html);
              setTitle(local.title || 'Rapport EXCO');
              return;
            }
          }
        } catch {
          // ignore
        }
        setError('Impossible de charger le rapport. Vérifiez votre connexion.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  // Ajuster la hauteur de l'iframe au contenu
  useEffect(() => {
    if (!html || !iframeRef.current) return;
    const iframe = iframeRef.current;
    const handleLoad = () => {
      try {
        const doc = iframe.contentDocument;
        if (doc) {
          iframe.style.height = doc.documentElement.scrollHeight + 'px';
        }
      } catch {
        // cross-origin, ignore
      }
    };
    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, [html]);

  const handleDownloadPdf = useCallback(() => {
    if (!html) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => setTimeout(() => { try { printWindow.print(); } catch {} }, 500);
    }
  }, [html]);

  const handleDownloadHtml = useCallback(() => {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9À-ÿ\s-]/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [html, title]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, border: '3px solid #e5e7eb', borderTopColor: '#1C3163',
            borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto',
          }} />
          <p style={{ marginTop: 12, color: '#6b7280', fontSize: 14 }}>Chargement du rapport...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (error || !html) {
    const isExpired = error?.includes('expiré');
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
        <div style={{
          textAlign: 'center', background: 'white', padding: 32, borderRadius: 12,
          boxShadow: '0 4px 24px rgba(0,0,0,0.1)', maxWidth: 400,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: isExpired ? '#fffbeb' : '#fef2f2',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
            fontSize: 24,
          }}>
            {isExpired ? '\u23F0' : '!'}
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
            {isExpired ? 'Rapport expiré' : 'Rapport non disponible'}
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>
            {error || 'Lien invalide ou expiré.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', background: '#1C3163', color: 'white', flexShrink: 0,
      }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleDownloadPdf}
            style={{
              padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, background: '#B8953F', color: 'white',
            }}
          >
            Enregistrer en PDF
          </button>
          <button
            onClick={handleDownloadHtml}
            style={{
              padding: '6px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.3)',
              cursor: 'pointer', fontSize: 12, fontWeight: 600, background: 'transparent', color: 'white',
            }}
          >
            Telecharger HTML
          </button>
        </div>
      </div>
      <iframe
        ref={iframeRef}
        srcDoc={html}
        title="Rapport EXCO"
        style={{ width: '100%', flex: 1, minHeight: 'calc(100vh - 44px)', border: 'none' }}
        sandbox="allow-same-origin allow-popups"
      />
    </div>
  );
}
