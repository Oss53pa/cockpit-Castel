import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  Calendar,
  AlertTriangle,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { useDashboardKPIs, useAvancementGlobal } from '@/hooks';

function getDaysUntilOpening(): number {
  const opening = new Date('2026-11-15');
  const today = new Date();
  return Math.ceil((opening.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function HomePage() {
  const navigate = useNavigate();
  const kpis = useDashboardKPIs();
  const avancementGlobal = useAvancementGlobal();
  const daysUntilOpening = getDaysUntilOpening();

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-12 py-6">
        <span className="text-lg font-semibold text-primary-900">Cosmos Angre</span>

        <nav className="flex items-center gap-8">
          <span className="text-sm text-primary-400">Avancement {avancementGlobal.toFixed(2)}%</span>
          <span className="text-sm text-primary-400">J-{daysUntilOpening}</span>
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
          Developed by Pamela Atokouna
        </p>
      </footer>
    </div>
  );
}
