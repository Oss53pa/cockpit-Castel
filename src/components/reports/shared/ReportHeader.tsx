/**
 * ReportHeader - En-tête commun pour tous les rapports
 * Affiche le titre, la période et les boutons d'export
 */

import { Calendar, Download, FileText, Presentation } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { PROJET_CONFIG } from '@/data/constants';

interface ReportHeaderProps {
  title: string;
  subtitle?: string;
  period?: string;
  onExportPDF?: () => void;
  onExportPPTX?: () => void;
  children?: React.ReactNode;
}

export function ReportHeader({
  title,
  subtitle,
  period,
  onExportPDF,
  onExportPPTX,
  children,
}: ReportHeaderProps) {
  // Calcul J-XXX
  const today = new Date();
  const dateOuverture = new Date(PROJET_CONFIG.dateOuverture);
  const joursRestants = Math.ceil(
    (dateOuverture.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  const semainesRestantes = Math.ceil(joursRestants / 7);

  return (
    <div className="bg-gradient-to-r from-primary-900 to-primary-700 text-white p-6 rounded-lg mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="text-primary-200 mt-1">{subtitle}</p>}
          <div className="flex items-center gap-4 mt-3">
            {period && (
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                <Calendar className="h-3 w-3 mr-1" />
                {period}
              </Badge>
            )}
            <Badge variant="secondary" className="bg-accent-500 text-white border-0">
              J-{joursRestants}
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white border-0">
              S-{semainesRestantes}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {children}
          {onExportPDF && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportPDF}
              className="border-white/30 text-white hover:bg-white/10"
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
          )}
          {onExportPPTX && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportPPTX}
              className="border-white/30 text-white hover:bg-white/10"
            >
              <Presentation className="h-4 w-4 mr-2" />
              PowerPoint
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportHeader;
