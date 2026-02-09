import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Mot de passe obligatoire via variable d'environnement
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD?.trim().toLowerCase();

// Vérification au démarrage
if (!APP_PASSWORD) {
  console.error('[SÉCURITÉ CRITIQUE] VITE_APP_PASSWORD non configuré dans .env');
  console.error('L\'application nécessite un mot de passe pour fonctionner.');
  console.error('Créez un fichier .env avec: VITE_APP_PASSWORD=votre_mot_de_passe');
}

interface AuthState {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      login: (password: string) => {
        // Bloquer si mot de passe non configuré
        if (!APP_PASSWORD) {
          console.error('[AUTH] Connexion impossible: VITE_APP_PASSWORD non configuré');
          return false;
        }
        if (password.trim().toLowerCase() === APP_PASSWORD) {
          set({ isAuthenticated: true });
          return true;
        }
        return false;
      },
      logout: () => {
        set({ isAuthenticated: false });
      },
    }),
    {
      name: 'cockpit-auth',
    }
  )
);
