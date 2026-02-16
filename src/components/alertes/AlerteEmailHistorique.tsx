// ============================================================================
// COMPOSANT HISTORIQUE DES EMAILS D'ALERTES
// ============================================================================

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MousePointer,
  RefreshCw,
  AlertTriangle,
  Send,
  User,
  Calendar,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
} from 'lucide-react';
import { db } from '@/db';
import { Badge, Button, Input, Select, SelectOption } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { AlerteEmailHistorique } from '@/types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const STATUT_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  envoye: { label: 'Envoyé', color: 'bg-blue-100 text-blue-700', icon: Send },
  echec: { label: 'Échec', color: 'bg-red-100 text-red-700', icon: XCircle },
  ouvert: { label: 'Ouvert', color: 'bg-green-100 text-green-700', icon: Eye },
  clique: { label: 'Cliqué', color: 'bg-purple-100 text-purple-700', icon: MousePointer },
};

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  initial: { label: 'Initial', color: 'bg-gray-100 text-gray-700' },
  relance: { label: 'Relance', color: 'bg-orange-100 text-orange-700' },
  escalade: { label: 'Escalade', color: 'bg-red-100 text-red-700' },
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

interface AlerteEmailHistoriqueProps {
  alerteId?: number; // Si fourni, affiche uniquement l'historique de cette alerte
  limit?: number;
}

export function AlerteEmailHistoriqueList({ alerteId, limit = 50 }: AlerteEmailHistoriqueProps) {
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Requête pour récupérer l'historique
  const historique = useLiveQuery(async () => {
    const query = db.alerteEmailHistorique.orderBy('envoyeAt').reverse();

    if (alerteId) {
      return await db.alerteEmailHistorique
        .where('alerteId')
        .equals(alerteId)
        .reverse()
        .toArray();
    }

    return await query.limit(limit).toArray();
  }, [alerteId, limit]);

  // Filtrage côté client
  const filteredHistorique = historique?.filter(item => {
    if (search) {
      const searchLower = search.toLowerCase();
      if (
        !item.destinataireEmail.toLowerCase().includes(searchLower) &&
        !item.destinataireNom.toLowerCase().includes(searchLower) &&
        !item.sujet.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }
    if (filterStatut && item.statut !== filterStatut) return false;
    if (filterType && item.type !== filterType) return false;
    return true;
  }) || [];

  // Stats
  const stats = {
    total: historique?.length || 0,
    envoyes: historique?.filter(h => h.statut === 'envoye').length || 0,
    ouverts: historique?.filter(h => h.statut === 'ouvert' || h.statut === 'clique').length || 0,
    echecs: historique?.filter(h => h.statut === 'echec').length || 0,
  };

  return (
    <div className="space-y-4">
      {/* Stats rapides */}
      {!alerteId && (
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 bg-blue-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
            <div className="text-xs text-blue-600">Total envoyés</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-700">{stats.ouverts}</div>
            <div className="text-xs text-green-600">Ouverts</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-gray-700">{stats.envoyes}</div>
            <div className="text-xs text-gray-600">En attente</div>
          </div>
          <div className="p-3 bg-red-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-700">{stats.echecs}</div>
            <div className="text-xs text-red-600">Échecs</div>
          </div>
        </div>
      )}

      {/* Filtres */}
      {!alerteId && (
        <div className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              placeholder="Rechercher par email, nom ou sujet..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} className="w-40">
            <SelectOption value="">Tous statuts</SelectOption>
            {Object.entries(STATUT_CONFIG).map(([key, config]) => (
              <SelectOption key={key} value={key}>{config.label}</SelectOption>
            ))}
          </Select>
          <Select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-40">
            <SelectOption value="">Tous types</SelectOption>
            {Object.entries(TYPE_CONFIG).map(([key, config]) => (
              <SelectOption key={key} value={key}>{config.label}</SelectOption>
            ))}
          </Select>
        </div>
      )}

      {/* Liste */}
      <div className="space-y-2">
        {filteredHistorique.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 bg-neutral-50 rounded-lg">
            <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucun email dans l'historique</p>
          </div>
        ) : (
          filteredHistorique.map((item) => (
            <EmailHistoryItem
              key={item.id}
              item={item}
              isExpanded={expandedId === item.id}
              onToggle={() => setExpandedId(expandedId === item.id ? null : item.id!)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ITEM D'HISTORIQUE
// ============================================================================

interface EmailHistoryItemProps {
  item: AlerteEmailHistorique;
  isExpanded: boolean;
  onToggle: () => void;
}

function EmailHistoryItem({ item, isExpanded, onToggle }: EmailHistoryItemProps) {
  const statutConfig = STATUT_CONFIG[item.statut] || STATUT_CONFIG.envoye;
  const typeConfig = TYPE_CONFIG[item.type] || TYPE_CONFIG.initial;
  const StatutIcon = statutConfig.icon;

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      {/* Header cliquable */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-4 hover:bg-neutral-50 transition-colors text-left"
      >
        {/* Icône statut */}
        <div className={cn('p-2 rounded-full', statutConfig.color)}>
          <StatutIcon className="w-4 h-4" />
        </div>

        {/* Infos principales */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-neutral-900 truncate">{item.destinataireNom}</span>
            <Badge className={cn('text-xs', typeConfig.color)}>{typeConfig.label}</Badge>
          </div>
          <p className="text-sm text-neutral-600 truncate">{item.sujet}</p>
          <div className="flex items-center gap-4 mt-1 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {item.destinataireEmail}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(item.envoyeAt).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        {/* Badge statut */}
        <Badge className={cn('text-xs', statutConfig.color)}>
          {statutConfig.label}
        </Badge>

        {/* Chevron */}
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-neutral-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-neutral-400" />
        )}
      </button>

      {/* Contenu expandé */}
      {isExpanded && (
        <div className="border-t p-4 bg-neutral-50">
          {/* Timeline */}
          <div className="flex items-center gap-4 mb-4 text-sm">
            <div className="flex items-center gap-2 text-blue-600">
              <Send className="w-4 h-4" />
              <span>Envoyé: {new Date(item.envoyeAt).toLocaleString('fr-FR')}</span>
            </div>
            {item.ouvertAt && (
              <div className="flex items-center gap-2 text-green-600">
                <Eye className="w-4 h-4" />
                <span>Ouvert: {new Date(item.ouvertAt).toLocaleString('fr-FR')}</span>
              </div>
            )}
            {item.cliqueAt && (
              <div className="flex items-center gap-2 text-purple-600">
                <MousePointer className="w-4 h-4" />
                <span>Cliqué: {new Date(item.cliqueAt).toLocaleString('fr-FR')}</span>
              </div>
            )}
          </div>

          {/* Erreur si échec */}
          {item.erreur && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <div className="flex items-center gap-2 text-red-700 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Erreur:</span>
                <span>{item.erreur}</span>
              </div>
            </div>
          )}

          {/* Aperçu HTML */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-neutral-100 px-3 py-2 text-xs text-neutral-600 font-medium">
              Aperçu de l'email
            </div>
            <div
              className="p-4 bg-white max-h-[400px] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: item.contenuHtml }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default AlerteEmailHistoriqueList;
