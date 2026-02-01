import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout';
import { ProphetChat } from '@/components/prophet';
import {
  LoginPage,
  HomePage,
  DashboardPage,
  AxesPage,
  ActionsPage,
  JalonsPage,
  BudgetPage,
  RisquesPage,
  AlertesPage,
  RapportsPage,
  SettingsPage,
  SharedReportPage,
  ExternalUpdateRouter,
  SynchronisationPage,
} from '@/pages';
import { useAuthStore } from '@/stores/authStore';
import { seedDatabase } from '@/data/cosmosAngre';
import { initializeDatabase } from '@/lib/initDatabase';
import { generateAlertesAutomatiques, cleanupDuplicateAlertes, initializeDefaultSite, useFirebaseRealtimeSync, useAutoRecalculate } from '@/hooks';
import { migrateEmailConfig, initDefaultTemplates } from '@/services/emailService';
import { ToastProvider } from '@/components/ui/toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

// Composant pour protéger les routes
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Composant séparé pour le recalcul (ne se monte qu'après isReady)
function AutoRecalculateInitializer() {
  useAutoRecalculate();
  return null;
}

function AppContent() {
  const [isReady, setIsReady] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    let isMounted = true;

    async function initApp() {
      console.log('[App] Début initApp...');
      try {
        // ÉTAPE 1: Site par défaut
        console.log('[App] initializeDefaultSite...');
        await initializeDefaultSite();

        // ÉTAPE 2: Database init (rapide si déjà fait)
        console.log('[App] initializeDatabase...');
        const initResult = await initializeDatabase();

        // Seed seulement si nécessaire
        if (!initResult.seeded) {
          console.log('[App] seedDatabase...');
          await seedDatabase();
        }

        console.log('[App] Prêt!');
        if (isMounted) setIsReady(true);

        // Opérations différées en background
        setTimeout(async () => {
          if (!isMounted) return;
          try {
            await cleanupDuplicateAlertes();
            await generateAlertesAutomatiques();
            await migrateEmailConfig();
            await initDefaultTemplates();
          } catch (err) {
            console.error('[App] Erreur init différée:', err);
          }
        }, 3000);

      } catch (error) {
        console.error('[App] Erreur initApp:', error);
        if (isMounted) setIsReady(true);
      }
    }

    initApp();

    return () => { isMounted = false; };
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-50">
        <div className="text-center">
          <h1 className="font-display text-5xl text-primary-900 mb-2">Cockpit</h1>
          <p className="text-xs text-primary-500 uppercase tracking-wider mb-8">Project Management</p>
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-900 mx-auto"></div>
          <p className="mt-4 text-sm text-primary-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Page de connexion */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />

        {/* Shared Report Page - Standalone without layout (public) */}
        <Route path="/reports/share/:shareId" element={<SharedReportPage />} />

        {/* External Update Page - Standalone without layout (public) */}
        <Route path="/update/:type/:token" element={<ExternalUpdateRouter />} />

        {/* Home Page - Welcome screen (protected, without sidebar) */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />

        {/* Main App with Layout (protected) */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/axes" element={<AxesPage />} />
          <Route path="/jalons" element={<JalonsPage />} />
          <Route path="/actions" element={<ActionsPage />} />
          <Route path="/synchronisation" element={<SynchronisationPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/risques" element={<RisquesPage />} />
          <Route path="/alertes" element={<AlertesPage />} />
          <Route path="/rapports" element={<RapportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>

      {/* Proph3t AI Assistant - seulement si connecté */}
      {isAuthenticated && <ProphetChat />}

      {/* Firebase Realtime Sync - seulement si connecté */}
      {isAuthenticated && <FirebaseRealtimeSyncInitializer />}

      {/* Auto-recalcul des statuts - TEMPORAIREMENT DÉSACTIVÉ pour debug perf */}
      {/* <AutoRecalculateInitializer /> */}
    </>
  );
}

// Composant pour initialiser la synchronisation Firebase temps réel
function FirebaseRealtimeSyncInitializer() {
  const { isConnected, isListening } = useFirebaseRealtimeSync();

  // Ce composant n'affiche rien, il initialise juste le hook
  // Les notifications sont gérées par le hook via useToast
  useEffect(() => {
    if (isConnected && isListening) {
      console.log('Firebase realtime sync active');
    }
  }, [isConnected, isListening]);

  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
