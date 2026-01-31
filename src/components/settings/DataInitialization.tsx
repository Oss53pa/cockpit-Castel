// ============================================================================
// COMPOSANT D'INITIALISATION DES DONNÉES V2.0
// ============================================================================

import { useState, useEffect } from 'react';
import { Database, RefreshCw, Trash2, CheckCircle, AlertTriangle, Info, Download, Upload, Wallet } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { useSeedData } from '@/hooks/useSeedData';
import { getDatabaseStats, forceReseed } from '@/lib/initDatabase';
import { db } from '@/db';

interface DatabaseStats {
  users: number;
  jalons: number;
  actions: number;
  risques: number;
  budget: number;
  alertes: number;
}

export function DataInitialization() {
  const { isSeeding, error, result, budgetResult, seedData, resetAndSeed, seedBudget, projectMetadata } = useSeedData();
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [forceReseeding, setForceReseeding] = useState(false);

  // Charger les statistiques au montage
  useEffect(() => {
    loadStats();
  }, [result]);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const dbStats = await getDatabaseStats();
      setStats(dbStats);
    } catch (err) {
      console.error('Erreur chargement stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSeedIfEmpty = async () => {
    await seedData(false);
    await loadStats();
  };

  const handleForceReseed = async () => {
    if (
      confirm(
        'ATTENTION: Cette action va EFFACER toutes les données existantes et les remplacer par les données v2.0 de production.\n\nToutes vos modifications seront perdues.\n\nContinuer ?'
      )
    ) {
      setForceReseeding(true);
      try {
        await forceReseed();
        alert('Données réinitialisées avec succès ! La page va se recharger.');
        window.location.reload();
      } catch (err) {
        console.error('Erreur reseed:', err);
        alert('Erreur lors de la réinitialisation');
      } finally {
        setForceReseeding(false);
      }
    }
  };

  const handleClearAll = async () => {
    if (
      confirm(
        'ATTENTION: Cette action va SUPPRIMER DÉFINITIVEMENT toutes les données.\n\nCette action est IRRÉVERSIBLE.\n\nContinuer ?'
      )
    ) {
      try {
        await db.transaction('rw', [db.users, db.jalons, db.actions, db.risques, db.budget, db.alertes], async () => {
          await db.users.clear();
          await db.jalons.clear();
          await db.actions.clear();
          await db.risques.clear();
          await db.budget.clear();
          await db.alertes.clear();
        });
        alert('Toutes les données ont été supprimées. La page va se recharger.');
        window.location.reload();
      } catch (err) {
        console.error('Erreur suppression:', err);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const isDatabaseEmpty = stats && stats.jalons === 0 && stats.actions === 0;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card padding="md">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary-100 rounded-lg">
            <Database className="h-6 w-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-primary-900">
              Initialisation des données v2.0
            </h3>
            <p className="text-sm text-primary-500 mt-1">
              Gestion des données de production COSMOS ANGRÉ selon les spécifications v2.0
            </p>
          </div>
        </div>
      </Card>

      {/* Statistiques actuelles */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-4 flex items-center gap-2">
          <Info className="h-5 w-5" />
          État actuel de la base de données
        </h4>

        {loadingStats ? (
          <div className="flex items-center gap-2 text-primary-500">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Chargement des statistiques...
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-3 bg-primary-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-primary-900">{stats.users}</div>
              <div className="text-xs text-primary-500">Utilisateurs</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-900">{stats.jalons}</div>
              <div className="text-xs text-blue-500">Jalons</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-900">{stats.actions}</div>
              <div className="text-xs text-green-500">Actions</div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-900">{stats.risques}</div>
              <div className="text-xs text-orange-500">Risques</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-900">{stats.budget}</div>
              <div className="text-xs text-purple-500">Budget</div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-900">{stats.alertes}</div>
              <div className="text-xs text-red-500">Alertes</div>
            </div>
          </div>
        ) : (
          <p className="text-error-500">Erreur lors du chargement des statistiques</p>
        )}

        {isDatabaseEmpty && (
          <div className="mt-4 p-3 bg-warning-50 border border-warning-200 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning-600" />
            <span className="text-sm text-warning-700">
              La base de données est vide. Cliquez sur "Initialiser les données" pour charger les données v2.0.
            </span>
          </div>
        )}

        {result && (
          <div className="mt-4 p-3 bg-success-50 border border-success-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success-600" />
            <span className="text-sm text-success-700">
              Seed terminé : {result.usersCreated} utilisateurs, {result.jalonsCreated} jalons, {result.actionsCreated} actions, {result.budgetCreated} postes budget créés
            </span>
          </div>
        )}

        {budgetResult && (
          <div className="mt-4 p-3 bg-success-50 border border-success-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success-600" />
            <span className="text-sm text-success-700">
              Budget mis à jour : {budgetResult.budgetCreated} postes budgétaires créés (2026 + 2027 = 961M FCFA)
            </span>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-error-50 border border-error-200 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-error-600" />
            <span className="text-sm text-error-700">{error}</span>
          </div>
        )}
      </Card>

      {/* Métadonnées du projet */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-4">
          Données v2.0 - Projet COSMOS ANGRÉ
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-primary-50 rounded-lg">
            <div className="text-primary-500 text-xs uppercase">Localisation</div>
            <div className="font-medium text-primary-900">{projectMetadata.localisation}</div>
          </div>
          <div className="p-3 bg-primary-50 rounded-lg">
            <div className="text-primary-500 text-xs uppercase">Surface (GLA)</div>
            <div className="font-medium text-primary-900">{projectMetadata.gla.toLocaleString()} m²</div>
          </div>
          <div className="p-3 bg-primary-50 rounded-lg">
            <div className="text-primary-500 text-xs uppercase">Boutiques</div>
            <div className="font-medium text-primary-900">{projectMetadata.nombreBoutiques.min} - {projectMetadata.nombreBoutiques.max}</div>
          </div>
          <div className="p-3 bg-primary-50 rounded-lg">
            <div className="text-primary-500 text-xs uppercase">Investissement</div>
            <div className="font-medium text-primary-900">{projectMetadata.investissement}</div>
          </div>
          <div className="p-3 bg-primary-50 rounded-lg">
            <div className="text-primary-500 text-xs uppercase">Soft Opening</div>
            <div className="font-medium text-primary-900">{projectMetadata.datesClePtojet.softOpening}</div>
          </div>
          <div className="p-3 bg-primary-50 rounded-lg">
            <div className="text-primary-500 text-xs uppercase">Inauguration</div>
            <div className="font-medium text-primary-900">{projectMetadata.datesClePtojet.inauguration}</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          <Badge variant="info">35 Jalons</Badge>
          <Badge variant="success">7 Axes</Badge>
          <Badge variant="warning">6 Bâtiments</Badge>
          <Badge variant="default">100% Poids</Badge>
        </div>
      </Card>

      {/* Actions */}
      <Card padding="md">
        <h4 className="font-semibold text-primary-900 mb-4">Actions</h4>

        <div className="space-y-4">
          {/* Initialiser si vide */}
          <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
            <div>
              <h5 className="font-medium text-primary-900">Initialiser les données</h5>
              <p className="text-sm text-primary-500">
                Charge les données v2.0 si la base est vide (ne modifie pas les données existantes)
              </p>
            </div>
            <Button
              variant="primary"
              onClick={handleSeedIfEmpty}
              disabled={isSeeding || !isDatabaseEmpty}
            >
              {isSeeding ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Initialisation...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Initialiser
                </>
              )}
            </Button>
          </div>

          {/* Charger budget d'exploitation */}
          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
            <div>
              <h5 className="font-medium text-purple-900">Charger budget d'exploitation</h5>
              <p className="text-sm text-purple-600">
                Charge les budgets 2026 (200M) et 2027 (761M) depuis les données COSMOS ANGRÉ
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={seedBudget}
              disabled={isSeeding}
              className="bg-purple-100 hover:bg-purple-200 text-purple-700"
            >
              {isSeeding ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Chargement...
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4 mr-2" />
                  Charger budget
                </>
              )}
            </Button>
          </div>

          {/* Réinitialiser (force) */}
          <div className="flex items-center justify-between p-4 bg-warning-50 rounded-lg">
            <div>
              <h5 className="font-medium text-warning-900">Réinitialiser avec données v2.0</h5>
              <p className="text-sm text-warning-600">
                EFFACE toutes les données existantes et recharge les données v2.0 de production
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={handleForceReseed}
              disabled={forceReseeding}
            >
              {forceReseeding ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Réinitialisation...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Réinitialiser v2.0
                </>
              )}
            </Button>
          </div>

          {/* Supprimer tout */}
          <div className="flex items-center justify-between p-4 bg-error-50 rounded-lg">
            <div>
              <h5 className="font-medium text-error-900">Supprimer toutes les données</h5>
              <p className="text-sm text-error-600">
                Action IRRÉVERSIBLE - Supprime définitivement toutes les données
              </p>
            </div>
            <Button variant="danger" onClick={handleClearAll}>
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer tout
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default DataInitialization;
