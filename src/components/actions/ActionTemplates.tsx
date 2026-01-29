import { useState } from 'react';
import {
  FileText,
  Handshake,
  CheckSquare,
  GraduationCap,
  UserPlus,
  Wrench,
  Truck,
  MessageSquare,
  FileCheck,
  ShoppingCart,
  CalendarCheck,
  Building,
  Sparkles,
  ChevronRight,
  X,
  Clock,
  Tag,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
} from '@/components/ui';
import type { ActionCategory, ActionType, Priorite } from '@/types';

// Interface pour les templates
export interface ActionTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  // Valeurs pré-remplies
  defaults: {
    duree_prevue_jours: number;
    categorie: ActionCategory;
    type_action: ActionType;
    priorite: Priorite;
    titre_prefix?: string;
    description_template?: string;
    flexibilite: 'fixe' | 'flexible' | 'standard' | 'critique';
  };
}

// Templates pré-définis
export const ACTION_TEMPLATES: ActionTemplate[] = [
  {
    id: 'negociation',
    name: 'Négociation',
    description: 'Négociation commerciale ou contractuelle',
    icon: Handshake,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    defaults: {
      duree_prevue_jours: 10,
      categorie: 'commercial',
      type_action: 'decision',
      priorite: 'haute',
      titre_prefix: 'Négociation: ',
      description_template: 'Mener les négociations pour...',
      flexibilite: 'flexible',
    },
  },
  {
    id: 'validation',
    name: 'Validation',
    description: 'Validation ou approbation d\'un livrable',
    icon: CheckSquare,
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    defaults: {
      duree_prevue_jours: 3,
      categorie: 'administratif',
      type_action: 'approbation',
      priorite: 'haute',
      titre_prefix: 'Validation: ',
      description_template: 'Valider et approuver...',
      flexibilite: 'standard',
    },
  },
  {
    id: 'formation',
    name: 'Formation',
    description: 'Session de formation ou transfert de compétences',
    icon: GraduationCap,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    defaults: {
      duree_prevue_jours: 5,
      categorie: 'rh',
      type_action: 'reunion',
      priorite: 'moyenne',
      titre_prefix: 'Formation: ',
      description_template: 'Organiser et dispenser la formation sur...',
      flexibilite: 'flexible',
    },
  },
  {
    id: 'recrutement',
    name: 'Recrutement',
    description: 'Processus de recrutement complet',
    icon: UserPlus,
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    defaults: {
      duree_prevue_jours: 20,
      categorie: 'rh',
      type_action: 'tache',
      priorite: 'haute',
      titre_prefix: 'Recrutement: ',
      description_template: 'Recruter un(e)...',
      flexibilite: 'flexible',
    },
  },
  {
    id: 'installation',
    name: 'Installation',
    description: 'Installation technique ou mise en place',
    icon: Wrench,
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    defaults: {
      duree_prevue_jours: 15,
      categorie: 'technique',
      type_action: 'tache',
      priorite: 'haute',
      titre_prefix: 'Installation: ',
      description_template: 'Installer et configurer...',
      flexibilite: 'standard',
    },
  },
  {
    id: 'livraison',
    name: 'Livraison',
    description: 'Réception et contrôle de livraison',
    icon: Truck,
    color: 'text-teal-700',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    defaults: {
      duree_prevue_jours: 2,
      categorie: 'operationnel',
      type_action: 'livrable',
      priorite: 'haute',
      titre_prefix: 'Livraison: ',
      description_template: 'Réceptionner et contrôler...',
      flexibilite: 'fixe',
    },
  },
  {
    id: 'reunion',
    name: 'Réunion',
    description: 'Organisation d\'une réunion ou comité',
    icon: MessageSquare,
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    defaults: {
      duree_prevue_jours: 1,
      categorie: 'administratif',
      type_action: 'reunion',
      priorite: 'moyenne',
      titre_prefix: 'Réunion: ',
      description_template: 'Organiser et animer la réunion...',
      flexibilite: 'flexible',
    },
  },
  {
    id: 'audit',
    name: 'Audit / Contrôle',
    description: 'Audit qualité ou contrôle de conformité',
    icon: FileCheck,
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    defaults: {
      duree_prevue_jours: 5,
      categorie: 'autre',
      type_action: 'approbation',
      priorite: 'critique',
      titre_prefix: 'Audit: ',
      description_template: 'Réaliser l\'audit de conformité...',
      flexibilite: 'fixe',
    },
  },
  {
    id: 'commande',
    name: 'Commande',
    description: 'Passation de commande fournisseur',
    icon: ShoppingCart,
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    defaults: {
      duree_prevue_jours: 3,
      categorie: 'financier',
      type_action: 'tache',
      priorite: 'moyenne',
      titre_prefix: 'Commande: ',
      description_template: 'Passer la commande pour...',
      flexibilite: 'standard',
    },
  },
  {
    id: 'planification',
    name: 'Planification',
    description: 'Planification et coordination',
    icon: CalendarCheck,
    color: 'text-slate-700',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    defaults: {
      duree_prevue_jours: 5,
      categorie: 'administratif',
      type_action: 'tache',
      priorite: 'moyenne',
      titre_prefix: 'Planification: ',
      description_template: 'Planifier et coordonner...',
      flexibilite: 'flexible',
    },
  },
  {
    id: 'amenagement',
    name: 'Aménagement',
    description: 'Travaux d\'aménagement ou de construction',
    icon: Building,
    color: 'text-stone-700',
    bgColor: 'bg-stone-50',
    borderColor: 'border-stone-200',
    defaults: {
      duree_prevue_jours: 30,
      categorie: 'technique',
      type_action: 'tache',
      priorite: 'haute',
      titre_prefix: 'Aménagement: ',
      description_template: 'Réaliser les travaux d\'aménagement...',
      flexibilite: 'standard',
    },
  },
  {
    id: 'document',
    name: 'Document',
    description: 'Rédaction ou révision de document',
    icon: FileText,
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    defaults: {
      duree_prevue_jours: 3,
      categorie: 'administratif',
      type_action: 'livrable',
      priorite: 'moyenne',
      titre_prefix: 'Document: ',
      description_template: 'Rédiger et finaliser le document...',
      flexibilite: 'flexible',
    },
  },
];

interface ActionTemplatesProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: ActionTemplate) => void;
}

export function ActionTemplates({
  isOpen,
  onClose,
  onSelectTemplate,
}: ActionTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { id: null, label: 'Tous', count: ACTION_TEMPLATES.length },
    { id: 'commercial', label: 'Commercial', count: ACTION_TEMPLATES.filter(t => t.defaults.categorie === 'commercial').length },
    { id: 'technique', label: 'Technique', count: ACTION_TEMPLATES.filter(t => t.defaults.categorie === 'technique').length },
    { id: 'rh', label: 'RH', count: ACTION_TEMPLATES.filter(t => t.defaults.categorie === 'rh').length },
    { id: 'administratif', label: 'Admin', count: ACTION_TEMPLATES.filter(t => t.defaults.categorie === 'administratif').length },
    { id: 'other', label: 'Autres', count: ACTION_TEMPLATES.filter(t => !['commercial', 'technique', 'rh', 'administratif'].includes(t.defaults.categorie)).length },
  ];

  const filteredTemplates = selectedCategory
    ? selectedCategory === 'other'
      ? ACTION_TEMPLATES.filter(t => !['commercial', 'technique', 'rh', 'administratif'].includes(t.defaults.categorie))
      : ACTION_TEMPLATES.filter(t => t.defaults.categorie === selectedCategory)
    : ACTION_TEMPLATES;

  const handleSelect = (template: ActionTemplate) => {
    onSelectTemplate(template);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span>Choisir un modèle d'action</span>
          </DialogTitle>
        </DialogHeader>

        {/* Category filters */}
        <div className="flex gap-2 flex-wrap border-b border-neutral-200 pb-3 mb-3">
          {categories.map((cat) => (
            <button
              key={cat.id ?? 'all'}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-violet-100 text-violet-800 border-2 border-violet-300'
                  : 'bg-neutral-100 text-neutral-600 border-2 border-transparent hover:bg-neutral-200'
              }`}
            >
              {cat.label}
              {cat.count > 0 && (
                <span className="ml-1.5 text-xs opacity-70">({cat.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Templates grid */}
        <div className="overflow-y-auto flex-1 pr-2">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <button
                  key={template.id}
                  onClick={() => handleSelect(template)}
                  className={`p-4 rounded-xl border-2 ${template.borderColor} ${template.bgColor} hover:shadow-md transition-all text-left group`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-white/80 ${template.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-sm ${template.color}`}>
                        {template.name}
                      </div>
                      <div className="text-xs text-neutral-600 mt-0.5 line-clamp-2">
                        {template.description}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {template.defaults.duree_prevue_jours}j
                    </span>
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {template.defaults.priorite}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-end text-xs text-violet-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Utiliser
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 pt-3 mt-3 flex justify-between items-center">
          <p className="text-xs text-neutral-500">
            Les modèles pré-remplissent automatiquement les champs courants
          </p>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-1" />
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ActionTemplates;
