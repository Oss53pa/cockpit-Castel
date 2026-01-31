import { useState } from 'react';
import { Trash2, RefreshCw, Users, UsersRound, Database, Settings, Info, Sparkles, Mail, Building2, RotateCcw, Cloud, Warehouse, Globe, HardDrive } from 'lucide-react';
import { Card, Button, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { clearDatabase } from '@/db';
import { generateAlertesAutomatiques } from '@/hooks';
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

export function SettingsPage() {
  const [resetting, setResetting] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    // Check URL params for tab
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'sites';
  });

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

  const handleResetDatabase = async () => {
    if (
      confirm(
        'Cette action va COMPLÉTER les données avec les éléments COSMOS ANGRÉ manquants.\n\n' +
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
          <TabsTrigger value="sites" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Sites
          </TabsTrigger>
          <TabsTrigger value="project" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Projet
          </TabsTrigger>
          <TabsTrigger value="buildings" className="flex items-center gap-2">
            <Warehouse className="h-4 w-4" />
            Bâtiments
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <UsersRound className="h-4 w-4" />
            Equipes
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
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Sauvegardes
          </TabsTrigger>
          <TabsTrigger value="init" className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Données v2
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Systeme
          </TabsTrigger>
        </TabsList>

        {/* Sites Tab */}
        <TabsContent value="sites">
          <SiteManagement />
        </TabsContent>

        {/* Project Tab */}
        <TabsContent value="project">
          <ProjectSettings />
        </TabsContent>

        {/* Buildings Tab */}
        <TabsContent value="buildings">
          <BuildingsSettings />
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams">
          <TeamManagement />
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

        {/* Data Tab */}
        <TabsContent value="data">
          <BackupManagement />
        </TabsContent>

        {/* Data Initialization Tab */}
        <TabsContent value="init">
          <DataInitialization />
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
