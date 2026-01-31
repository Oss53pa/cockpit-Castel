/**
 * External Update Router
 *
 * Ce composant détermine quelle page de mise à jour utiliser:
 * - Si Firebase est configuré et activé → ExternalUpdateFirebasePage (temps réel)
 * - Sinon → ExternalUpdatePage (local uniquement)
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ExternalUpdatePage } from './ExternalUpdatePage';
import { ExternalUpdateFirebasePage } from './ExternalUpdateFirebasePage';
import { isFirebaseConfigured, getFirebaseConfig } from '@/services/firebaseConfigService';
import { getUpdateLinkFromFirebase, initRealtimeSync } from '@/services/firebaseRealtimeSync';

export function ExternalUpdateRouter() {
  const { token } = useParams<{ token: string }>();
  const [checking, setChecking] = useState(true);
  const [useFirebase, setUseFirebase] = useState(false);

  useEffect(() => {
    checkFirebaseAvailability();
  }, [token]);

  const checkFirebaseAvailability = async () => {
    try {
      // Vérifier si Firebase est configuré
      const config = getFirebaseConfig();

      if (!config.enabled || !isFirebaseConfigured()) {
        console.log('Firebase not configured, using local page');
        setUseFirebase(false);
        setChecking(false);
        return;
      }

      // Initialiser Firebase et vérifier si le lien existe dans Firebase
      const initialized = await initRealtimeSync();

      if (!initialized) {
        console.log('Firebase init failed, using local page');
        setUseFirebase(false);
        setChecking(false);
        return;
      }

      // Vérifier si le lien existe dans Firebase
      if (token) {
        const firebaseLink = await getUpdateLinkFromFirebase(token);

        if (firebaseLink) {
          console.log('Link found in Firebase, using Firebase page');
          setUseFirebase(true);
        } else {
          console.log('Link not in Firebase, using local page');
          setUseFirebase(false);
        }
      }

      setChecking(false);
    } catch (e) {
      console.error('Error checking Firebase:', e);
      setUseFirebase(false);
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Utiliser la page Firebase si disponible, sinon la page locale
  if (useFirebase) {
    return <ExternalUpdateFirebasePage />;
  }

  return <ExternalUpdatePage />;
}
