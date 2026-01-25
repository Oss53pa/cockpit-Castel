import { useState } from 'react';
import { Download, Upload, Trash2, RefreshCw, Users, UsersRound, Database, Settings, Info, Sparkles, Mail, Building2, RotateCcw, Cloud, Grid3X3, Warehouse, Globe } from 'lucide-react';
import { Card, Button, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { exportDatabase, importDatabase, clearDatabase } from '@/db';
import { generateAlertesAutomatiques } from '@/hooks';
import { resetAndSeedDatabase } from '@/data/cosmosAngre';
import { TeamManagement } from '@/components/settings/TeamManagement';
import { UserManagement } from '@/components/settings/UserManagement';
import { AISettings } from '@/components/settings/AISettings';
import { EmailSettings } from '@/components/settings/EmailSettings';
import { ProjectSettings } from '@/components/settings/ProjectSettings';
import { BuildingsSettings } from '@/components/settings/BuildingsSettings';
import { SharePointSync } from '@/components/settings/SharePointSync';
import { RACISettings } from '@/components/settings/RACISettings';
import { SiteManagement } from '@/components/settings/SiteManagement';

export function SettingsPage() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    // Check URL params for tab
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'sites';
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await exportDatabase();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cosmos-angre-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setImporting(true);
      try {
        const text = await file.text();
        await importDatabase(text);
        window.location.reload();
      } catch (error) {
        console.error('Import error:', error);
        alert('Erreur lors de l\'import');
      } finally {
        setImporting(false);
      }
    };
    input.click();
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

  const handleResetDatabase = async () => {
    if (
      confirm(
        'Attention: Cette action va réinitialiser toutes les données avec les données de démonstration COSMOS ANGRÉ (3 bâtiments, jalons, actions, risques). Toutes vos modifications seront perdues. Continuer ?'
      )
    ) {
      setResetting(true);
      try {
        await resetAndSeedDatabase();
        alert('Données réinitialisées avec succès ! La page va se recharger.');
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
        <TabsList className="grid w-full grid-cols-11 mb-6">
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
          <TabsTrigger value="raci" className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            RACI
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
            Donnees
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

        {/* RACI Tab */}
        <TabsContent value="raci">
          <RACISettings />
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
          <Card padding="md">
            <h3 className="text-lg font-semibold text-primary-900 mb-4">
              Gestion des donnees
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-primary-900">
                    Exporter les donnees
                  </h4>
                  <p className="text-sm text-primary-500">
                    Telecharger une sauvegarde JSON complete
                  </p>
                </div>
                <Button onClick={handleExport} disabled={exporting}>
                  <Download className="h-4 w-4 mr-2" />
                  {exporting ? 'Export...' : 'Exporter'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-primary-900">
                    Importer des donnees
                  </h4>
                  <p className="text-sm text-primary-500">
                    Restaurer depuis un fichier JSON
                  </p>
                </div>
                <Button onClick={handleImport} disabled={importing}>
                  <Upload className="h-4 w-4 mr-2" />
                  {importing ? 'Import...' : 'Importer'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-warning-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-warning-900">
                    Réinitialiser les données de démo
                  </h4>
                  <p className="text-sm text-warning-600">
                    Recharger les données COSMOS ANGRÉ (8 structures, jalons, actions, risques)
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
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <div className="space-y-6">
            {/* Maintenance */}
            <Card padding="md">
              <h3 className="text-lg font-semibold text-primary-900 mb-4">
                Maintenance
              </h3>

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
            </Card>

            {/* About */}
            <Card padding="md">
              <h3 className="text-lg font-semibold text-primary-900 mb-4">
                A propos
              </h3>

              <div className="space-y-2 text-sm text-primary-600">
                <p>
                  <strong>COSMOS ANGRE Cockpit</strong> — Application de pilotage de projet
                </p>
                <p>Version 1.0.0</p>
                <p>Mode : 100% Local (IndexedDB)</p>
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
