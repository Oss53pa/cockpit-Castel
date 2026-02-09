import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  Calendar,
  AlertTriangle,
  FileText,
  ArrowRight,
  Sparkles,
  Brain,
} from 'lucide-react';
import { useDashboardKPIs, useAvancementGlobal, useAlertes } from '@/hooks';
import { useCurrentSite } from '@/hooks/useSites';
import { useProph3tHealth } from '@/hooks/useProph3t';
import { cn } from '@/lib/utils';
import { Proph3tWidget } from '@/components/proph3t/Proph3tWidget';

export function HomePage() {
  const navigate = useNavigate();
  const kpis = useDashboardKPIs();
  const avancementGlobal = useAvancementGlobal();
  const currentSite = useCurrentSite();
  const { alertes = [] } = useAlertes();

  // Calculate days until opening from site configuration (database)
  const dateOuverture = currentSite?.dateOuverture || '2026-10-16';
  const opening = new Date(dateOuverture);
  const today = new Date();
  const daysUntilOpening = Math.ceil((opening.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const [showProph3t, setShowProph3t] = useState(false);
  const proph3tHealth = useProph3tHealth();

  // Nombre de problèmes remontés (alertes non traitées)
  const problemesCount = (alertes || []).filter(a => !a.traitee).length;

  // Couleurs du score de santé
  const healthColors: Record<string, string> = {
    vert: 'bg-green-500',
    jaune: 'bg-yellow-500',
    rouge: 'bg-red-500',
  };

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden relative">
      {/* PROPH3T Widget */}
      {showProph3t && (
        <div className="absolute top-20 right-8 z-50">
          <Proph3tWidget onClose={() => setShowProph3t(false)} />
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-12 py-6">
        <div>
          <span className="text-lg font-semibold text-primary-900">{currentSite?.nom || kpis.projectName}</span>
          <p className="text-base text-primary-500">Mobilization</p>
        </div>

        <nav className="flex items-center gap-6">
          {/* Score de Santé PROPH3T */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 rounded-full cursor-pointer hover:bg-primary-100 transition-colors"
            onClick={() => setShowProph3t(!showProph3t)}
            title="Score de santé du projet"
          >
            <Brain className="h-4 w-4 text-primary-600" />
            <div className={cn('w-2 h-2 rounded-full', proph3tHealth ? healthColors[proph3tHealth.status] : 'bg-gray-400')} />
            <span className="text-sm font-semibold text-primary-700">{proph3tHealth?.score ?? 0}</span>
          </div>
          <button
            onClick={() => setShowProph3t(!showProph3t)}
            className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Proph3t {problemesCount > 0 && <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{problemesCount}</span>}
          </button>
          <span className="flex items-center gap-2">
            <span className="text-sm text-primary-600">Soft-Opening:</span>
            <span className="text-2xl font-bold text-primary-900">J-{daysUntilOpening}</span>
          </span>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-900 text-white text-sm rounded-full hover:bg-primary-800 transition-colors"
          >
            Dashboard
            <ArrowRight className="h-4 w-4" />
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-12">
        <div className="text-center mb-16">
          <h1 className="font-display text-8xl text-primary-900 mb-4">Cockpit</h1>
          <p className="text-xl text-primary-400 font-light tracking-wide">
            Project Management
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-16 text-center">
          <div>
            <p className="text-5xl font-light text-primary-900">{kpis.totalActions}</p>
            <p className="text-sm text-primary-400 mt-2">Actions</p>
          </div>
          <div className="w-px h-12 bg-primary-200" />
          <div>
            <p className="text-5xl font-light text-primary-900">{kpis.totalJalons}</p>
            <p className="text-sm text-primary-400 mt-2">Jalons</p>
          </div>
          <div className="w-px h-12 bg-primary-200" />
          <div>
            <p className="text-5xl font-light text-primary-900">{kpis.totalRisques}</p>
            <p className="text-sm text-primary-400 mt-2">Risques</p>
          </div>
          <div className="w-px h-12 bg-primary-200" />
          <div>
            <p className="text-5xl font-light text-primary-900">{avancementGlobal.toFixed(2)}%</p>
            <p className="text-sm text-primary-400 mt-2">Avancement</p>
          </div>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="px-12 py-8">
        <div className="flex items-center justify-center gap-4">
          {[
            { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
            { icon: Target, label: 'Actions', path: '/actions' },
            { icon: Calendar, label: 'Jalons', path: '/jalons' },
            { icon: AlertTriangle, label: 'Risques', path: '/risques' },
            { icon: FileText, label: 'Rapports', path: '/rapports' },
          ].map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className="flex items-center gap-2 px-5 py-3 border border-primary-200 rounded-full text-sm text-primary-600 hover:bg-primary-50 hover:border-primary-300 transition-all"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </button>
          ))}
        </div>

        <p className="text-center text-primary-300 text-xs mt-6">
          Developed by Pamela Atokouna — Tous droits réservés © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
