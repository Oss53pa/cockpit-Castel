import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout';
import { ProphetChat } from '@/components/prophet';
import {
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
import { seedDatabase } from '@/data/cosmosAngre';
import { generateAlertesAutomatiques, cleanupDuplicateAlertes } from '@/hooks';
import { migrateEmailConfig, initDefaultTemplates } from '@/services/emailService';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function initApp() {
      try {
        await seedDatabase();
        // Nettoyer les alertes en double avant d'en generer de nouvelles
        const cleaned = await cleanupDuplicateAlertes();
        if (cleaned > 0) {
          console.log(`Nettoyage: ${cleaned} alerte(s) en double supprimee(s)`);
        }
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
          <p className="text-xs text-primary-500 uppercase tracking-wider mb-8">Cosmos Angré</p>
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-900 mx-auto"></div>
          <p className="mt-4 text-sm text-primary-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Shared Report Page - Standalone without layout */}
        <Route path="/reports/share/:shareId" element={<SharedReportPage />} />

        {/* External Update Page - Standalone without layout */}
        <Route path="/update/:type/:token" element={<ExternalUpdatePage />} />

        {/* Main App with Layout */}
        <Route element={<MainLayout />}>
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

      {/* Proph3t AI Assistant */}
      <ProphetChat />
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
