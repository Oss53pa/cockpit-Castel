// ============================================================================
// FICHE RISQUE DÉTAILLÉE - Composant d'affichage enrichi
// ============================================================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion as _Accordion,
  AccordionContent as _AccordionContent,
  AccordionItem as _AccordionItem,
  AccordionTrigger as _AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Target,
  Shield,
  Bell,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  FICHES_RISQUES_TOP10,
  type FicheRisque,
  type ActionMitigation,
} from '@/data/cosmosAngreRef4';

// Couleurs par score
function getScoreColor(score: number): string {
  if (score >= 15) return 'bg-red-500';
  if (score >= 10) return 'bg-orange-500';
  if (score >= 5) return 'bg-yellow-500';
  return 'bg-green-500';
}

function _getScoreBadgeVariant(score: number): 'destructive' | 'default' | 'secondary' {
  if (score >= 15) return 'destructive';
  if (score >= 10) return 'default';
  return 'secondary';
}

// Couleurs par catégorie
const CATEGORIE_COLORS: Record<string, string> = {
  technique: 'bg-blue-100 text-blue-800',
  commercial: 'bg-green-100 text-green-800',
  rh: 'bg-purple-100 text-purple-800',
  financier: 'bg-amber-100 text-amber-800',
  reglementaire: 'bg-red-100 text-red-800',
  operationnel: 'bg-cyan-100 text-cyan-800',
};

// Statut d'action
function ActionStatutBadge({ statut }: { statut?: ActionMitigation['statut'] }) {
  if (!statut) return null;

  const config = {
    fait: { icon: CheckCircle2, className: 'bg-green-100 text-green-800', label: 'Fait' },
    en_cours: { icon: Clock, className: 'bg-blue-100 text-blue-800', label: 'En cours' },
    planifie: { icon: Target, className: 'bg-gray-100 text-gray-800', label: 'Planifié' },
  };

  const { icon: Icon, className, label } = config[statut];

  return (
    <Badge variant="outline" className={cn('gap-1', className)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

// Matrice de risque visuelle
function RisqueMatrix({ probabilite, impact }: { probabilite: number; impact: number }) {
  return (
    <div className="grid grid-cols-5 gap-0.5 w-32 h-32">
      {[5, 4, 3, 2, 1].map((p) =>
        [1, 2, 3, 4, 5].map((i) => {
          const score = p * i;
          const isActive = p === probabilite && i === impact;
          return (
            <div
              key={`${p}-${i}`}
              className={cn(
                'w-6 h-6 rounded-sm transition-all',
                score >= 15 ? 'bg-red-200' : score >= 10 ? 'bg-orange-200' : score >= 5 ? 'bg-yellow-200' : 'bg-green-200',
                isActive && 'ring-2 ring-primary ring-offset-1',
                isActive && (score >= 15 ? 'bg-red-500' : score >= 10 ? 'bg-orange-500' : score >= 5 ? 'bg-yellow-500' : 'bg-green-500')
              )}
              title={`P:${p} × I:${i} = ${score}`}
            />
          );
        })
      )}
    </div>
  );
}

interface FicheRisqueCardProps {
  fiche: FicheRisque;
  onSelect?: (fiche: FicheRisque) => void;
  compact?: boolean;
}

export function FicheRisqueCard({ fiche, onSelect, compact = false }: FicheRisqueCardProps) {
  if (compact) {
    return (
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onSelect?.(fiche)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  {fiche.id}
                </Badge>
                <Badge className={cn('text-xs', CATEGORIE_COLORS[fiche.categorie])}>
                  {fiche.categorie}
                </Badge>
              </div>
              <h4 className="font-semibold">{fiche.titre}</h4>
              <p className="text-sm text-muted-foreground mt-1">{fiche.axe}</p>
            </div>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg',
                  getScoreColor(fiche.score)
                )}
              >
                {fiche.score}
              </div>
              <span className="text-xs text-muted-foreground mt-1">
                {fiche.probabilite}×{fiche.impact}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{fiche.id}</Badge>
              <Badge className={cn(CATEGORIE_COLORS[fiche.categorie])}>
                {fiche.categorie}
              </Badge>
            </div>
            <CardTitle>{fiche.titre}</CardTitle>
            <CardDescription>
              {fiche.axe} • Responsable: {fiche.responsableSuivi}
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <RisqueMatrix probabilite={fiche.probabilite} impact={fiche.impact} />
            <div className="text-center">
              <div
                className={cn(
                  'w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl',
                  getScoreColor(fiche.score)
                )}
              >
                {fiche.score}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                P:{fiche.probabilite} × I:{fiche.impact}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="causes" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="causes" className="gap-1">
              <AlertCircle className="h-4 w-4" />
              Causes
            </TabsTrigger>
            <TabsTrigger value="mitigation" className="gap-1">
              <Shield className="h-4 w-4" />
              Mitigation
            </TabsTrigger>
            <TabsTrigger value="contingence" className="gap-1">
              <Target className="h-4 w-4" />
              Contingence
            </TabsTrigger>
            <TabsTrigger value="alertes" className="gap-1">
              <Bell className="h-4 w-4" />
              Alertes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="causes" className="mt-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Causes potentielles
                </h4>
                <ul className="space-y-2">
                  {fiche.causesPotentielles.map((cause, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-orange-500 mt-0.5">•</span>
                      {cause}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  Conséquences
                </h4>
                <ul className="space-y-2">
                  {fiche.consequences.map((consequence, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-red-500 mt-0.5">•</span>
                      {consequence}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mitigation" className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fiche.planMitigation.map((action, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{action.action}</TableCell>
                    <TableCell>{action.responsable}</TableCell>
                    <TableCell>{action.deadline}</TableCell>
                    <TableCell>
                      <ActionStatutBadge statut={action.statut} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="contingence" className="mt-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-semibold mb-3">
                Plan de contingence (si le risque se réalise)
              </h4>
              <ul className="space-y-2">
                {fiche.planContingence.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">
                      {i + 1}
                    </span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="alertes" className="mt-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-amber-500" />
                  Indicateurs d'alerte
                </h4>
                <ul className="space-y-2">
                  {fiche.indicateursAlerte.map((indicateur, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm bg-amber-50 p-2 rounded">
                      <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      {indicateur}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-red-800">
                  <ArrowUpRight className="h-4 w-4" />
                  Seuil d'escalade
                </h4>
                <p className="text-sm text-red-700">{fiche.seuilEscalade}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Composant principal avec liste et détail
export function FichesRisquesTop10() {
  const [selectedFiche, setSelectedFiche] = useState<FicheRisque | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSelect = (fiche: FicheRisque) => {
    setSelectedFiche(fiche);
    setCurrentIndex(FICHES_RISQUES_TOP10.findIndex((f) => f.id === fiche.id));
  };

  const handlePrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : FICHES_RISQUES_TOP10.length - 1;
    setCurrentIndex(newIndex);
    setSelectedFiche(FICHES_RISQUES_TOP10[newIndex]);
  };

  const handleNext = () => {
    const newIndex = currentIndex < FICHES_RISQUES_TOP10.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    setSelectedFiche(FICHES_RISQUES_TOP10[newIndex]);
  };

  if (selectedFiche) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setSelectedFiche(null)}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {FICHES_RISQUES_TOP10.length}
            </span>
            <Button variant="outline" size="icon" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <FicheRisqueCard fiche={selectedFiche} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Top 10 Risques Projet</h2>
          <p className="text-muted-foreground">
            Fiches risques enrichies avec plans de mitigation et contingence
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {FICHES_RISQUES_TOP10.filter((f) => f.score >= 15).length} critiques
          </Badge>
          <Badge variant="default" className="gap-1">
            {FICHES_RISQUES_TOP10.filter((f) => f.score >= 10 && f.score < 15).length} élevés
          </Badge>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {FICHES_RISQUES_TOP10.map((fiche) => (
          <FicheRisqueCard key={fiche.id} fiche={fiche} onSelect={handleSelect} compact />
        ))}
      </div>
    </div>
  );
}

export default FichesRisquesTop10;
