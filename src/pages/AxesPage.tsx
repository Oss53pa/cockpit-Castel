import { Layers } from 'lucide-react';
import { AxesSettings } from '@/components/settings/AxesSettings';

export function AxesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary-100 rounded-lg">
          <Layers className="h-6 w-6 text-primary-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Axes Stratégiques</h1>
          <p className="text-sm text-primary-500">
            Gestion et suivi des axes du projet
          </p>
        </div>
      </div>

      {/* Contenu principal */}
      <AxesSettings />
    </div>
  );
}
