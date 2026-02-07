import { useState } from 'react';
import { Trash2, RefreshCw, Users, UsersRound, Database, Settings, Info, Sparkles, Mail, Building2, RotateCcw, Cloud, Warehouse, Globe, HardDrive, Flame, Lock, Wallet, SlidersHorizontal, Shield, Cpu } from 'lucide-react';
import { Card, Button, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { clearDatabase } from '@/db';
import { generateAlertesAutomatiques, resetBudgetEngagements, usePermissions } from '@/hooks';
import { resetAndSeedDatabase } from '@/data/cosmosAngre';
import { TeamManagement } from '@/components/settings/TeamManagement';
import { UserManagement } from '@/components/settings/UserManagement';
import { AISettings } from '@/components/settings/AISettings';
import { EmailSettings } from '@/components/settings/EmailSettings';
import { ProjectSettings } from '@/components/settings/ProjectSettings';
import { BuildingsSettings } from '@/components/settings/BuildingsSettings';
import { SharePointSync } from '@/components/settings/SharePointSync';
import { SiteManagement } from '@/components/settings/SiteManagement';
import { BackupManagement } from '@/components/settings/BackupManagement';
import { DataInitialization } from '@/components/settings/DataInitialization';
import { FirebaseSyncSettings } from '@/components/settings/FirebaseSyncSettings';
import { GoogleDriveSync } from '@/components/settings/GoogleDriveSync';
import { ParametresMetierSettings } from '@/components/settings/ParametresMetierSettings';
import { GovernanceRules } from '@/components/settings/GovernanceRules';
import { AlgorithmsSettings } from '@/components/settings/AlgorithmsSettings';
import { PROJET_CONFIG } from '@/data/constants';

const SETTINGS_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'Atokp0879*';

export function SettingsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('settings_authenticated') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { canAdmin } = usePermissions();
  const [activeTab, setActiveTab] = useState(() => {
    // Check URL params for tab
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') || 'project_sites';
    // Redirect old tab values to new grouped tabs
    if (tab === 'sites' || tab === 'project' || tab === 'buildings') return 'project_sites';
    if (tab === 'users' || tab === 'teams') return 'personnel';
    if (tab === 'parametres' || tab === 'gouvernance') return 'regles';
    return tab;
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === SETTINGS_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('settings_authenticated', 'true');
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const handleClearDatabase = async () => {
    if (
      confirm(
        'Etes-vous sur de vouloir supprimer toutes les donnees ? Cette action est irreversible.'
      )
    ) {
      await clearDatabase();
      window.location.reload();
    }
  };

  const handleGenerateAlertes = async () => {
    await generateAlertesAutomatiques();
    alert('Alertes generees avec succes');
  };

  const handleResetBudgetEngagements = async () => {
    if (
      confirm(
        'Cette action va mettre à 0 tous les montants engagés et réalisés du budget.\n\n' +
        'À utiliser car le budget n\'est pas encore validé.\n\n' +
        'Continuer ?'
      )
    ) {
      try {
        const count = await resetBudgetEngagements();
        alert(`✅ ${count} lignes budgétaires mises à jour.\n\nEngagé = 0\nRéalisé = 0`);
      } catch (error) {
        console.error('Reset budget error:', error);
        alert('Erreur lors de la réinitialisation du budget');
      }
    }
  };

  const handleResetDatabase = async () => {
    if (
      confirm(
        `Cette action va COMPLÉTER les données avec les éléments ${PROJET_CONFIG.nom} manquants.\n\n` +
        '✅ Données existantes : CONSERVÉES\n' +
        '✅ Modifications des collaborateurs : CONSERVÉES\n' +
        '✅ Imports manuels : CONSERVÉS\n' +
        '➕ Seuls les éléments manquants seront ajoutés.\n\n' +
        'Continuer ?'
      )
    ) {
      setResetting(true);
      try {
        const result = await resetAndSeedDatabase();
        const message = [
          '✅ Seed terminé avec succès !\n',
          `👤 Utilisateurs: ${result.usersCreated} ajoutés, ${result.usersSkipped} déjà existants`,
          `🎯 Jalons: ${result.jalonsCreated} ajoutés, ${result.jalonsSkipped} déjà existants`,
          `📋 Actions: ${result.actionsCreated} ajoutées, ${result.actionsSkipped} déjà existantes`,
          `💰 Budget: ${result.budgetCreated} ajoutés, ${result.budgetSkipped} déjà existants`,
          '\nLa page va se recharger.'
        ].join('\n');
        alert(message);
        window.location.reload();
      } catch (error) {
        console.error('Reset error:', error);
        alert('Erreur lors de la réinitialisation');
      } finally {
        setResetting(false);
      }
    }
  };

  // Password protection screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card padding="lg" className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-primary-900">Accès protégé</h2>
            <p className="text-sm text-primary-500 mt-1">
              Entrez le mot de passe pour accéder aux paramètres
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError(false);
                }}
                placeholder="Mot de passe"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  passwordError ? 'border-error-500 bg-error-50' : 'border-primary-200'
                }`}
                autoFocus
              />
              {passwordError && (
                <p className="text-error-600 text-sm mt-2">Mot de passe incorrect</p>
              )}
            </div>
            <Button type="submit" className="w-full">
              <Lock className="h-4 w-4 mr-2" />
              Accéder aux paramètres
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary-100 rounded-lg">
          <Settings className="h-6 w-6 text-primary-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-primary-900">Parametres</h2>
          <p className="text-sm text-primary-500">
            Configuration de l'application et gestion des utilisateurs
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap gap-1 mb-6">
          <TabsTrigger value="project_sites" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Projet & Sites
          </TabsTrigger>
          <TabsTrigger value="personnel" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Personnel
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Proph3t IA
          </TabsTrigger>
          <TabsTrigger value="sharepoint" className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            SharePoint
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Emails
          </TabsTrigger>
          <TabsTrigger value="firebase" className="flex items-center gap-2">
            <Flame className="h-4 w-4" />
            Firebase
          </TabsTrigger>
          <TabsTrigger value="gdrive" className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Google Drive
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Sauvegardes
          </TabsTrigger>
          <TabsTrigger value="init" className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Données v2
          </TabsTrigger>
          <TabsTrigger value="regles" className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Règles & Paramètres
          </TabsTrigger>
          <TabsTrigger value="algorithms" className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            Algorithmes
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Systeme
          </TabsTrigger>
        </TabsList>

        {/* Projet & Sites Tab */}
        <TabsContent value="project_sites">
          <Tabs defaultValue="sites">
            <TabsList className="mb-4 bg-primary-50">
              <TabsTrigger value="sites" className="flex items-center gap-2 text-xs">
                <Globe className="h-3.5 w-3.5" />
                Sites
              </TabsTrigger>
              <TabsTrigger value="project" className="flex items-center gap-2 text-xs">
                <Building2 className="h-3.5 w-3.5" />
                Projet
              </TabsTrigger>
              <TabsTrigger value="buildings" className="flex items-center gap-2 text-xs">
                <Warehouse className="h-3.5 w-3.5" />
                Bâtiments
              </TabsTrigger>
            </TabsList>
            <TabsContent value="sites">
              <SiteManagement />
            </TabsContent>
            <TabsContent value="project">
              <ProjectSettings />
            </TabsContent>
            <TabsContent value="buildings">
              <BuildingsSettings />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Personnel Tab */}
        <TabsContent value="personnel">
          <Tabs defaultValue="users">
            <TabsList className="mb-4 bg-primary-50">
              <TabsTrigger value="users" className="flex items-center gap-2 text-xs">
                <Users className="h-3.5 w-3.5" />
                Utilisateurs
              </TabsTrigger>
              <TabsTrigger value="teams" className="flex items-center gap-2 text-xs">
                <UsersRound className="h-3.5 w-3.5" />
                Equipes
              </TabsTrigger>
            </TabsList>
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>
            <TabsContent value="teams">
              <TeamManagement />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* AI Tab */}
        <TabsContent value="ai">
          <AISettings />
        </TabsContent>

        {/* SharePoint Tab */}
        <TabsContent value="sharepoint">
          <SharePointSync />
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email">
          <EmailSettings />
        </TabsContent>

        {/* Firebase Tab */}
        <TabsContent value="firebase">
          <FirebaseSyncSettings />
        </TabsContent>

        {/* Google Drive Tab */}
        <TabsContent value="gdrive">
          <GoogleDriveSync />
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data">
          <BackupManagement />
        </TabsContent>

        {/* Data Initialization Tab */}
        <TabsContent value="init">
          <DataInitialization />
        </TabsContent>

        {/* Règles & Paramètres Tab */}
        <TabsContent value="regles">
          <Tabs defaultValue="parametres">
            <TabsList className="mb-4 bg-primary-50">
              <TabsTrigger value="parametres" className="flex items-center gap-2 text-xs">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Paramètres métier
              </TabsTrigger>
              <TabsTrigger value="gouvernance" className="flex items-center gap-2 text-xs">
                <Shield className="h-3.5 w-3.5" />
                Gouvernance
              </TabsTrigger>
            </TabsList>
            <TabsContent value="parametres">
              <ParametresMetierSettings />
            </TabsContent>
            <TabsContent value="gouvernance">
              <GovernanceRules />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Algorithms Tab */}
        <TabsContent value="algorithms">
          <AlgorithmsSettings />
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <div className="space-y-6">
            {/* Maintenance */}
            <Card padding="md">
              <h3 className="text-lg font-semibold text-primary-900 mb-4">
                Maintenance
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-primary-900">
                      Generer les alertes
                    </h4>
                    <p className="text-sm text-primary-500">
                      Recalculer les alertes automatiques
                    </p>
                  </div>
                  <Button variant="secondary" onClick={handleGenerateAlertes}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generer
                  </Button>
                </div>

                {canAdmin && (
                  <div className="flex items-center justify-between p-4 bg-warning-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-warning-900">
                        Réinitialiser les données de démo
                      </h4>
                      <p className="text-sm text-warning-600">
                        Recharger les données de démonstration (structures, jalons, actions, risques)
                      </p>
                    </div>
                    <Button variant="secondary" onClick={handleResetDatabase} disabled={resetting}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {resetting ? 'Réinitialisation...' : 'Réinitialiser'}
                    </Button>
                  </div>
                )}

                {canAdmin && (
                  <div className="flex items-center justify-between p-4 bg-info-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-info-900">
                        Réinitialiser engagements budget
                      </h4>
                      <p className="text-sm text-info-600">
                        Mettre Engagé = 0 et Réalisé = 0 (budget non validé)
                      </p>
                    </div>
                    <Button variant="secondary" onClick={handleResetBudgetEngagements}>
                      <Wallet className="h-4 w-4 mr-2" />
                      Réinitialiser
                    </Button>
                  </div>
                )}

                {canAdmin && (
                  <div className="flex items-center justify-between p-4 bg-error-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-error-900">
                        Supprimer toutes les donnees
                      </h4>
                      <p className="text-sm text-error-600">
                        Action irreversible
                      </p>
                    </div>
                    <Button variant="danger" onClick={handleClearDatabase}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* About */}
            <Card padding="md">
              <h3 className="text-lg font-semibold text-primary-900 mb-4">
                A propos
              </h3>

              <div className="space-y-2 text-sm text-primary-600">
                <p>
                  <strong>Cockpit</strong> — Application de pilotage de projet
                </p>
                <p>Version 1.0.0</p>
                <p>Mode : 100% Local (IndexedDB)</p>
                <p className="mt-2 text-primary-500">
                  Developed by <strong>Pamela Atokouna</strong>
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <Badge variant="success">PWA</Badge>
                  <Badge variant="info">Offline Ready</Badge>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
