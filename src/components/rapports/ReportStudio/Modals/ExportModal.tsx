import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  Globe,
  FileCode,
  Download,
  Lock,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ExportFormat, ExportQuality, ExportOptions } from '@/types/reportStudio';

interface ExportModalProps {
  isOpen: boolean;
  isExporting: boolean;
  reportTitle: string;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
}

const formatOptions: {
  format: ExportFormat;
  icon: React.ReactNode;
  label: string;
  description: string;
}[] = [
  {
    format: 'pdf',
    icon: <FileText className="h-6 w-6" />,
    label: 'PDF',
    description: 'Document imprimable',
  },
  {
    format: 'docx',
    icon: <FileText className="h-6 w-6" />,
    label: 'Word',
    description: 'Document éditable',
  },
  {
    format: 'pptx',
    icon: <Presentation className="h-6 w-6" />,
    label: 'PowerPoint',
    description: 'Présentation',
  },
  {
    format: 'xlsx',
    icon: <FileSpreadsheet className="h-6 w-6" />,
    label: 'Excel',
    description: 'Données tabulaires',
  },
  {
    format: 'html',
    icon: <Globe className="h-6 w-6" />,
    label: 'HTML',
    description: 'Page web',
  },
  {
    format: 'md',
    icon: <FileCode className="h-6 w-6" />,
    label: 'Markdown',
    description: 'Texte structuré',
  },
];

const qualityOptions: { quality: ExportQuality; label: string }[] = [
  { quality: 'draft', label: 'Brouillon' },
  { quality: 'standard', label: 'Standard' },
  { quality: 'high', label: 'Haute qualité' },
];

export function ExportModal({
  isOpen,
  isExporting,
  reportTitle,
  onClose,
  onExport,
}: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [quality, setQuality] = useState<ExportQuality>('standard');
  const [includeCoverPage, setIncludeCoverPage] = useState(true);
  const [includeTableOfContents, setIncludeTableOfContents] = useState(true);
  const [includeComments, setIncludeComments] = useState(false);
  const [watermark, setWatermark] = useState('');
  const [password, setPassword] = useState('');

  const handleExport = () => {
    onExport({
      format: selectedFormat,
      quality,
      includeCoverPage,
      includeTableOfContents,
      includeComments,
      sectionsToExport: 'all',
      watermark: watermark || undefined,
      password: password || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Exporter le rapport</DialogTitle>
          <DialogDescription>
            Exportez "{reportTitle}" dans le format de votre choix.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Format</Label>
            <div className="grid grid-cols-3 gap-2">
              {formatOptions.map((option) => (
                <button
                  key={option.format}
                  onClick={() => setSelectedFormat(option.format)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                    selectedFormat === option.format
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <span
                    className={cn(
                      selectedFormat === option.format
                        ? 'text-blue-600'
                        : 'text-gray-500'
                    )}
                  >
                    {option.icon}
                  </span>
                  <span className="text-sm font-medium">{option.label}</span>
                  <span className="text-xs text-gray-500">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quality selection (for PDF) */}
          {selectedFormat === 'pdf' && (
            <div>
              <Label className="text-sm font-medium mb-3 block">Qualité</Label>
              <div className="flex gap-2">
                {qualityOptions.map((option) => (
                  <button
                    key={option.quality}
                    onClick={() => setQuality(option.quality)}
                    className={cn(
                      'flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all',
                      quality === option.quality
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Options */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Options</Label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={includeCoverPage}
                  onCheckedChange={(checked) =>
                    setIncludeCoverPage(checked === true)
                  }
                />
                <span className="text-sm">Inclure la page de couverture</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={includeTableOfContents}
                  onCheckedChange={(checked) =>
                    setIncludeTableOfContents(checked === true)
                  }
                />
                <span className="text-sm">Inclure la table des matières</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={includeComments}
                  onCheckedChange={(checked) =>
                    setIncludeComments(checked === true)
                  }
                />
                <span className="text-sm">Inclure les commentaires</span>
              </label>
            </div>
          </div>

          {/* Security options (for PDF) */}
          {selectedFormat === 'pdf' && (
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Sécurité (optionnel)
              </Label>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="watermark" className="text-xs text-gray-500">
                    Filigrane
                  </Label>
                  <Input
                    id="watermark"
                    value={watermark}
                    onChange={(e) => setWatermark(e.target.value)}
                    placeholder="Texte du filigrane"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-xs text-gray-500">
                    Mot de passe
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Protéger avec un mot de passe"
                      className="pr-10"
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Annuler
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exportation...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
