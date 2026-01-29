import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout';
import { ProphetChat } from '@/components/prophet';
import {
  LoginPage,
  DashboardPage,
  ActionsPage,
  JalonsPage,
  BudgetPage,
  RisquesPage,
  AlertesPage,
  RapportsPage,
  SettingsPage,
  SharedReportPage,
  ExternalUpdatePage,
  SynchronisationPage,
} from '@/pages';
import { useAuthStore } from '@/stores/authStore';
import { seedDatabase } from '@/data/cosmosAngre';
import { generateAlertesAutomatiques, cleanupDuplicateAlertes, initializeDefaultSite } from '@/hooks';
import { migrateEmailConfig, initDefaultTemplates } from '@/services/emailService';

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

function AppContent() {
  const [isReady, setIsReady] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    async function initApp() {
      try {
        // Initialize default site if none exists
        await initializeDefaultSite();
        await seedDatabase();
        // Nettoyer les alertes en double avant d'en generer de nouvelles
        await cleanupDuplicateAlertes();
        await generateAlertesAutomatiques();
        // Migration et initialisation des services email
        await migrateEmailConfig();
        await initDefaultTemplates();
        setIsReady(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsReady(true);
      }
    }

    initApp();
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
        <Route path="/update/:type/:token" element={<ExternalUpdatePage />} />

        {/* Main App with Layout (protected) */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/actions" element={<ActionsPage />} />
          <Route path="/jalons" element={<JalonsPage />} />
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
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
