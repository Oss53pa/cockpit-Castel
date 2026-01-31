import { useState } from 'react';
import { Plus, Layers } from 'lucide-react';
import { Button } from '@/components/ui';
import { AxesSettings } from '@/components/settings/AxesSettings';

export function AxesPage() {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Layers className="h-6 w-6 text-primary-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Axes Strategiques</h1>
            <p className="text-sm text-primary-500">
              Gestion et suivi des axes du projet
            </p>
          </div>
        </div>

        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un axe
        </Button>
      </div>

      {/* Contenu principal */}
      <AxesSettings />

      {/* Modal d'ajout */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-primary-900 mb-4">
              Ajouter un axe
            </h3>
            <p className="text-primary-600 mb-6">
              Les axes strategiques sont definis dans la configuration du projet.
              Pour ajouter un nouvel axe, veuillez contacter l'administrateur ou
              modifier la configuration dans <code className="bg-gray-100 px-1 rounded">src/types/index.ts</code>.
            </p>
            <div className="flex justify-end">
              <Button onClick={() => setShowAddModal(false)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
