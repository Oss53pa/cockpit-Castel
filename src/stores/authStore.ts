import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Mot de passe par défaut - à changer via variables d'environnement
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'cosmos2026';

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
        if (password === APP_PASSWORD) {
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
