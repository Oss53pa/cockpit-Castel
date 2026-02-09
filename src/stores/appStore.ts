import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ActionViewMode, ActionFilters, JalonFilters, RisqueFilters, AlerteFilters } from '@/types';

interface AppState {
  // Sidebar state
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Current user (simplified - would be auth in real app)
  currentUserId: number | null;
  setCurrentUserId: (id: number | null) => void;

  // Online status
  isOnline: boolean;
  setIsOnline: (status: boolean) => void;

  // Actions view mode
  actionsViewMode: ActionViewMode;
  setActionsViewMode: (mode: ActionViewMode) => void;

  // Filters
  actionFilters: ActionFilters;
  setActionFilters: (filters: ActionFilters) => void;
  resetActionFilters: () => void;

  jalonFilters: JalonFilters;
  setJalonFilters: (filters: JalonFilters) => void;
  resetJalonFilters: () => void;

  risqueFilters: RisqueFilters;
  setRisqueFilters: (filters: RisqueFilters) => void;
  resetRisqueFilters: () => void;

  alerteFilters: AlerteFilters;
  setAlerteFilters: (filters: AlerteFilters) => void;
  resetAlerteFilters: () => void;

  // Notifications panel
  notificationsPanelOpen: boolean;
  toggleNotificationsPanel: () => void;
  setNotificationsPanelOpen: (open: boolean) => void;

  // Theme (for future dark mode)
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

const defaultActionFilters: ActionFilters = {};
const defaultJalonFilters: JalonFilters = {};
const defaultRisqueFilters: RisqueFilters = {};
const defaultAlerteFilters: AlerteFilters = { traitee: false };

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Sidebar
      sidebarOpen: true,
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      // Current user - null until explicitly set via auth
      currentUserId: null as number | null,
      setCurrentUserId: (id) => set({ currentUserId: id }),

      // Online status
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      setIsOnline: (status) => set({ isOnline: status }),

      // Actions view mode
      actionsViewMode: 'list',
      setActionsViewMode: (mode) => set({ actionsViewMode: mode }),

      // Filters
      actionFilters: defaultActionFilters,
      setActionFilters: (filters) =>
        set((state) => ({
          actionFilters: { ...state.actionFilters, ...filters },
        })),
      resetActionFilters: () => set({ actionFilters: defaultActionFilters }),

      jalonFilters: defaultJalonFilters,
      setJalonFilters: (filters) =>
        set((state) => ({
          jalonFilters: { ...state.jalonFilters, ...filters },
        })),
      resetJalonFilters: () => set({ jalonFilters: defaultJalonFilters }),

      risqueFilters: defaultRisqueFilters,
      setRisqueFilters: (filters) =>
        set((state) => ({
          risqueFilters: { ...state.risqueFilters, ...filters },
        })),
      resetRisqueFilters: () => set({ risqueFilters: defaultRisqueFilters }),

      alerteFilters: defaultAlerteFilters,
      setAlerteFilters: (filters) =>
        set((state) => ({
          alerteFilters: { ...state.alerteFilters, ...filters },
        })),
      resetAlerteFilters: () => set({ alerteFilters: defaultAlerteFilters }),

      // Notifications panel
      notificationsPanelOpen: false,
      toggleNotificationsPanel: () =>
        set((state) => ({ notificationsPanelOpen: !state.notificationsPanelOpen })),
      setNotificationsPanelOpen: (open) => set({ notificationsPanelOpen: open }),

      // Theme
      theme: 'light',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'cockpit-app-store',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        actionsViewMode: state.actionsViewMode,
        currentUserId: state.currentUserId,
        theme: state.theme,
      }),
    }
  )
);

// Online/offline listener
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useAppStore.getState().setIsOnline(true);
  });
  window.addEventListener('offline', () => {
    useAppStore.getState().setIsOnline(false);
  });
}
