import React, { useState, useEffect } from 'react';
import {
  Palette,
  Type,
  Layout,
  FileText,
  List,
  Save,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectOption } from '@/components/ui/select';
import type { ReportDesignSettings, PageFormat, PageOrientation, PageMargin } from '@/types/reportStudio';

// Thèmes prédéfinis
interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
}

interface PredefinedTheme {
  name: string;
  colors: ThemeColors;
}

const PREDEFINED_THEMES: Record<string, PredefinedTheme> = {
  'cosmos-angre': {
    name: 'Cosmos Angré',
    colors: {
      primary: '#404040',
      secondary: '#80bf41',
      accent: '#80bf41',
      text: '#333333',
      background: '#ffffff',
    },
  },
  'corporate-blue': {
    name: 'Corporate Blue',
    colors: {
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#60a5fa',
      text: '#1f2937',
      background: '#ffffff',
    },
  },
  'modern-green': {
    name: 'Modern Green',
    colors: {
      primary: '#047857',
      secondary: '#10b981',
      accent: '#34d399',
      text: '#1f2937',
      background: '#ffffff',
    },
  },
  'elegant-purple': {
    name: 'Elegant Purple',
    colors: {
      primary: '#6d28d9',
      secondary: '#8b5cf6',
      accent: '#a78bfa',
      text: '#1f2937',
      background: '#ffffff',
    },
  },
  'professional-gray': {
    name: 'Professional Gray',
    colors: {
      primary: '#374151',
      secondary: '#6b7280',
      accent: '#9ca3af',
      text: '#111827',
      background: '#ffffff',
    },
  },
};

interface DesignSettingsModalProps {
  isOpen: boolean;
  settings: ReportDesignSettings;
  onClose: () => void;
  onSave: (settings: ReportDesignSettings) => void;
}

export function DesignSettingsModal({
  isOpen,
  settings,
  onClose,
  onSave,
}: DesignSettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<ReportDesignSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const updatePage = (updates: Partial<ReportDesignSettings['page']>) => {
    setLocalSettings((prev) => ({
      ...prev,
      page: { ...prev.page, ...updates },
    }));
  };

  const updateTypography = (updates: Partial<ReportDesignSettings['typography']>) => {
    setLocalSettings((prev) => ({
      ...prev,
      typography: { ...prev.typography, ...updates },
    }));
  };

  const updateColors = (updates: Partial<ReportDesignSettings['colors']>) => {
    setLocalSettings((prev) => ({
      ...prev,
      colors: { ...prev.colors, ...updates },
    }));
  };

  const applyTheme = (themeColors: ThemeColors) => {
    console.log('applyTheme called with:', themeColors);
    setLocalSettings((prev) => {
      const newSettings = {
        ...prev,
        colors: {
          primary: themeColors.primary,
          secondary: themeColors.secondary,
          accent: themeColors.accent,
          text: themeColors.text,
          background: themeColors.background,
        },
      };
      console.log('New settings:', newSettings.colors);
      return newSettings;
    });
  };

  const updateCoverPage = (updates: Partial<ReportDesignSettings['coverPage']>) => {
    setLocalSettings((prev) => ({
      ...prev,
      coverPage: { ...prev.coverPage, ...updates },
    }));
  };

  const updateTableOfContents = (updates: Partial<ReportDesignSettings['tableOfContents']>) => {
    setLocalSettings((prev) => ({
      ...prev,
      tableOfContents: { ...prev.tableOfContents, ...updates },
    }));
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Paramètres de design
          </DialogTitle>
          <DialogDescription>
            Personnalisez l'apparence de votre rapport.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="page" className="flex-1 overflow-hidden">
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="page" className="gap-1">
              <Layout className="h-4 w-4" />
              Page
            </TabsTrigger>
            <TabsTrigger value="typography" className="gap-1">
              <Type className="h-4 w-4" />
              Typographie
            </TabsTrigger>
            <TabsTrigger value="colors" className="gap-1">
              <Palette className="h-4 w-4" />
              Couleurs
            </TabsTrigger>
            <TabsTrigger value="cover" className="gap-1">
              <FileText className="h-4 w-4" />
              Couverture
            </TabsTrigger>
            <TabsTrigger value="toc" className="gap-1">
              <List className="h-4 w-4" />
              Sommaire
            </TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto mt-4 pr-2" style={{ maxHeight: 'calc(85vh - 200px)' }}>
            {/* Page settings */}
            <TabsContent value="page" className="space-y-6 m-0">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Format de page</Label>
                  <Select
                    value={localSettings.page.format}
                    onChange={(e) => updatePage({ format: e.target.value as PageFormat })}
                    className="mt-1"
                  >
                    <SelectOption value="A4">A4 (210 x 297 mm)</SelectOption>
                    <SelectOption value="Letter">Letter (216 x 279 mm)</SelectOption>
                    <SelectOption value="A3">A3 (297 x 420 mm)</SelectOption>
                  </Select>
                </div>

                <div>
                  <Label>Orientation</Label>
                  <Select
                    value={localSettings.page.orientation}
                    onChange={(e) => updatePage({ orientation: e.target.value as PageOrientation })}
                    className="mt-1"
                  >
                    <SelectOption value="portrait">Portrait</SelectOption>
                    <SelectOption value="landscape">Paysage</SelectOption>
                  </Select>
                </div>

                <div>
                  <Label>Marges</Label>
                  <Select
                    value={localSettings.page.margins}
                    onChange={(e) => updatePage({ margins: e.target.value as PageMargin })}
                    className="mt-1"
                  >
                    <SelectOption value="normal">Normales (25 mm)</SelectOption>
                    <SelectOption value="narrow">Étroites (12 mm)</SelectOption>
                    <SelectOption value="wide">Larges (38 mm)</SelectOption>
                  </Select>
                </div>
              </div>

              {/* Page preview */}
              <div className="flex justify-center py-4">
                <div
                  className={cn(
                    'bg-white border-2 border-gray-300 shadow-sm',
                    localSettings.page.orientation === 'landscape' ? 'w-40 h-28' : 'w-28 h-40'
                  )}
                >
                  <div
                    className="h-full border border-dashed border-gray-200 m-2"
                    style={{
                      margin:
                        localSettings.page.margins === 'narrow'
                          ? '4px'
                          : localSettings.page.margins === 'wide'
                          ? '12px'
                          : '8px',
                    }}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Typography settings */}
            <TabsContent value="typography" className="space-y-6 m-0">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Police des titres</Label>
                  <Select
                    value={localSettings.typography.headingFont}
                    onChange={(e) => updateTypography({ headingFont: e.target.value })}
                    className="mt-1"
                  >
                    <SelectOption value="Exo 2">Exo 2</SelectOption>
                    <SelectOption value="Inter">Inter</SelectOption>
                    <SelectOption value="Roboto">Roboto</SelectOption>
                    <SelectOption value="Open Sans">Open Sans</SelectOption>
                    <SelectOption value="Montserrat">Montserrat</SelectOption>
                  </Select>
                </div>

                <div>
                  <Label>Police du corps</Label>
                  <Select
                    value={localSettings.typography.bodyFont}
                    onChange={(e) => updateTypography({ bodyFont: e.target.value })}
                    className="mt-1"
                  >
                    <SelectOption value="Inter">Inter</SelectOption>
                    <SelectOption value="Roboto">Roboto</SelectOption>
                    <SelectOption value="Open Sans">Open Sans</SelectOption>
                    <SelectOption value="Lato">Lato</SelectOption>
                    <SelectOption value="Source Sans Pro">Source Sans Pro</SelectOption>
                  </Select>
                </div>

                <div>
                  <Label>Taille de base (px)</Label>
                  <Input
                    type="number"
                    value={localSettings.typography.baseFontSize}
                    onChange={(e) =>
                      updateTypography({ baseFontSize: parseInt(e.target.value) || 12 })
                    }
                    min={8}
                    max={18}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Typography preview */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <h1
                  style={{
                    fontFamily: localSettings.typography.headingFont,
                    fontSize: `${localSettings.typography.baseFontSize * 2}px`,
                    fontWeight: 'bold',
                  }}
                >
                  Titre principal
                </h1>
                <h2
                  style={{
                    fontFamily: localSettings.typography.headingFont,
                    fontSize: `${localSettings.typography.baseFontSize * 1.5}px`,
                    fontWeight: 600,
                  }}
                >
                  Sous-titre
                </h2>
                <p
                  style={{
                    fontFamily: localSettings.typography.bodyFont,
                    fontSize: `${localSettings.typography.baseFontSize}px`,
                  }}
                >
                  Ceci est un exemple de texte de paragraphe qui montre l'apparence
                  de votre contenu avec les paramètres actuels.
                </p>
              </div>
            </TabsContent>

            {/* Color settings */}
            <TabsContent value="colors" className="space-y-6 m-0">
              {/* Predefined themes */}
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4" />
                  Thèmes prédéfinis
                </Label>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(PREDEFINED_THEMES).map(([themeKey, theme]) => {
                    return (
                      <button
                        key={themeKey}
                        type="button"
                        onClick={() => {
                          alert('Thème cliqué: ' + theme.name);
                          applyTheme(theme.colors);
                        }}
                        className="group p-2 rounded-lg border-2 border-gray-200 hover:border-gray-400 transition-colors text-center"
                      >
                        <div className="flex justify-center gap-1 mb-2">
                          <div
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: theme.colors.primary }}
                          />
                          <div
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: theme.colors.secondary }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">
                          {theme.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="mb-3 block">Personnalisation</Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'primary', label: 'Couleur principale' },
                  { key: 'secondary', label: 'Couleur secondaire' },
                  { key: 'accent', label: 'Couleur d\'accent' },
                  { key: 'text', label: 'Texte' },
                  { key: 'background', label: 'Arrière-plan' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <Label>{label}</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={localSettings.colors[key as keyof typeof localSettings.colors]}
                        onChange={(e) =>
                          updateColors({ [key]: e.target.value })
                        }
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={localSettings.colors[key as keyof typeof localSettings.colors]}
                        onChange={(e) =>
                          updateColors({ [key]: e.target.value })
                        }
                        className="flex-1 font-mono uppercase"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Color preview */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: localSettings.colors.background }}>
                <h3
                  style={{
                    color: localSettings.colors.primary,
                    fontWeight: 'bold',
                    marginBottom: '8px',
                  }}
                >
                  Aperçu des couleurs
                </h3>
                <p style={{ color: localSettings.colors.text, marginBottom: '8px' }}>
                  Texte normal avec couleur{' '}
                  <span style={{ color: localSettings.colors.accent, fontWeight: 500 }}>
                    d'accent
                  </span>{' '}
                  et{' '}
                  <span style={{ color: localSettings.colors.secondary, fontWeight: 500 }}>
                    secondaire
                  </span>
                  .
                </p>
                <div className="flex gap-2">
                  <div
                    className="w-16 h-8 rounded"
                    style={{ backgroundColor: localSettings.colors.primary }}
                  />
                  <div
                    className="w-16 h-8 rounded"
                    style={{ backgroundColor: localSettings.colors.secondary }}
                  />
                  <div
                    className="w-16 h-8 rounded"
                    style={{ backgroundColor: localSettings.colors.accent }}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Cover page settings */}
            <TabsContent value="cover" className="space-y-6 m-0">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Page de couverture</Label>
                  <p className="text-sm text-gray-500">
                    Ajouter une page de couverture au début du rapport
                  </p>
                </div>
                <Switch
                  checked={localSettings.coverPage.enabled}
                  onCheckedChange={(checked) => updateCoverPage({ enabled: checked })}
                />
              </div>

              {localSettings.coverPage.enabled && (
                <>
                  <div>
                    <Label>Template</Label>
                    <Select
                      value={localSettings.coverPage.template}
                      onChange={(e) =>
                        updateCoverPage({ template: e.target.value as 'standard' | 'minimal' | 'modern' })
                      }
                      className="mt-1"
                    >
                      <SelectOption value="standard">Standard</SelectOption>
                      <SelectOption value="minimal">Minimal</SelectOption>
                      <SelectOption value="modern">Moderne</SelectOption>
                    </Select>
                  </div>

                  <div>
                    <Label>Titre personnalisé (optionnel)</Label>
                    <Input
                      value={localSettings.coverPage.title || ''}
                      onChange={(e) => updateCoverPage({ title: e.target.value })}
                      placeholder="Titre du rapport"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Sous-titre (optionnel)</Label>
                    <Input
                      value={localSettings.coverPage.subtitle || ''}
                      onChange={(e) => updateCoverPage({ subtitle: e.target.value })}
                      placeholder="Sous-titre"
                      className="mt-1"
                    />
                  </div>
                </>
              )}
            </TabsContent>

            {/* Table of contents settings */}
            <TabsContent value="toc" className="space-y-6 m-0">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Table des matières</Label>
                  <p className="text-sm text-gray-500">
                    Générer automatiquement une table des matières
                  </p>
                </div>
                <Switch
                  checked={localSettings.tableOfContents.enabled}
                  onCheckedChange={(checked) =>
                    updateTableOfContents({ enabled: checked })
                  }
                />
              </div>

              {localSettings.tableOfContents.enabled && (
                <>
                  <div>
                    <Label>Profondeur</Label>
                    <Select
                      value={String(localSettings.tableOfContents.depth)}
                      onChange={(e) =>
                        updateTableOfContents({ depth: parseInt(e.target.value) })
                      }
                      className="mt-1"
                    >
                      <SelectOption value="1">Niveau 1 uniquement</SelectOption>
                      <SelectOption value="2">Niveaux 1-2</SelectOption>
                      <SelectOption value="3">Niveaux 1-3</SelectOption>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Numéros de page</Label>
                    <Switch
                      checked={localSettings.tableOfContents.showPageNumbers}
                      onCheckedChange={(checked) =>
                        updateTableOfContents({ showPageNumbers: checked })
                      }
                    />
                  </div>
                </>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
