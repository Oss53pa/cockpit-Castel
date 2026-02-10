/**
 * ReportViewPage — Affiche un rapport HTML partagé via Firebase
 * Route publique: /report-view/:token
 */

import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { getReportFromFirebase } from '@/services/firebaseRealtimeSync';

export function ReportViewPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!token) {
      setError('Lien invalide');
      setLoading(false);
      return;
    }

    getReportFromFirebase(token)
      .then((result) => {
        if (result) {
          setHtml(result.html);
        } else {
          setError('Rapport non trouvé ou lien expiré');
        }
      })
      .catch(() => {
        setError('Erreur lors du chargement du rapport');
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
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
        <div style={{
          textAlign: 'center', background: 'white', padding: 32, borderRadius: 12,
          boxShadow: '0 4px 24px rgba(0,0,0,0.1)', maxWidth: 400,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', background: '#fef2f2',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
            fontSize: 24,
          }}>
            !
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
            Rapport non disponible
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>
            {error || 'Lien invalide ou expiré.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      srcDoc={html}
      title="Rapport EXCO"
      style={{ width: '100%', minHeight: '100vh', border: 'none' }}
      sandbox="allow-same-origin allow-popups"
    />
  );
}
