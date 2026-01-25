import { Search, X, Calendar } from 'lucide-react';
import { Input, Select, SelectOption, Button } from '@/components/ui';
import { useUsers } from '@/hooks';
import { useAppStore } from '@/stores';
import {
  AXES,
  AXE_LABELS,
  PHASES,
  PHASE_LABELS,
  ACTION_STATUSES,
  ACTION_STATUS_LABELS,
  PRIORITIES,
  PRIORITY_LABELS,
  BUILDING_CODES,
  BUILDING_CODE_LABELS,
} from '@/types';

export function ActionFiltersBar() {
  const { actionFilters, setActionFilters, resetActionFilters } = useAppStore();
  const users = useUsers();

  const activeFiltersCount = Object.values(actionFilters).filter(Boolean).length;

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-lg border">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-400" />
        <Input
          value={actionFilters.search ?? ''}
          onChange={(e) => setActionFilters({ search: e.target.value || undefined })}
          placeholder="Rechercher une action..."
          className="pl-10"
        />
      </div>

      {/* Phase filter */}
      <Select
        value={actionFilters.phase ?? ''}
        onChange={(e) =>
          setActionFilters({
            phase: e.target.value ? (e.target.value as typeof actionFilters.phase) : undefined,
          })
        }
        className="w-36"
      >
        <SelectOption value="">Toutes phases</SelectOption>
        {PHASES.map((phase) => (
          <SelectOption key={phase} value={phase}>
            {PHASE_LABELS[phase]}
          </SelectOption>
        ))}
      </Select>

      {/* Axe filter */}
      <Select
        value={actionFilters.axe ?? ''}
        onChange={(e) =>
          setActionFilters({
            axe: e.target.value ? (e.target.value as typeof actionFilters.axe) : undefined,
          })
        }
        className="w-40"
      >
        <SelectOption value="">Tous les axes</SelectOption>
        {AXES.map((axe) => (
          <SelectOption key={axe} value={axe}>
            {AXE_LABELS[axe]}
          </SelectOption>
        ))}
      </Select>

      {/* Status filter */}
      <Select
        value={actionFilters.status ?? ''}
        onChange={(e) =>
          setActionFilters({
            status: e.target.value
              ? (e.target.value as typeof actionFilters.status)
              : undefined,
          })
        }
        className="w-36"
      >
        <SelectOption value="">Tous statuts</SelectOption>
        {ACTION_STATUSES.map((status) => (
          <SelectOption key={status} value={status}>
            {ACTION_STATUS_LABELS[status]}
          </SelectOption>
        ))}
      </Select>

      {/* Priority filter */}
      <Select
        value={actionFilters.priorite ?? ''}
        onChange={(e) =>
          setActionFilters({
            priorite: e.target.value
              ? (e.target.value as typeof actionFilters.priorite)
              : undefined,
          })
        }
        className="w-36"
      >
        <SelectOption value="">Toutes priorités</SelectOption>
        {PRIORITIES.map((priority) => (
          <SelectOption key={priority} value={priority}>
            {PRIORITY_LABELS[priority]}
          </SelectOption>
        ))}
      </Select>

      {/* Responsable filter */}
      <Select
        value={actionFilters.responsableId?.toString() ?? ''}
        onChange={(e) =>
          setActionFilters({
            responsableId: e.target.value ? parseInt(e.target.value) : undefined,
          })
        }
        className="w-44"
      >
        <SelectOption value="">Tous responsables</SelectOption>
        {users.map((user) => (
          <SelectOption key={user.id} value={user.id}>
            {user.prenom} {user.nom}
          </SelectOption>
        ))}
      </Select>

      {/* Building filter */}
      <Select
        value={actionFilters.buildingCode ?? ''}
        onChange={(e) =>
          setActionFilters({
            buildingCode: e.target.value ? (e.target.value as typeof actionFilters.buildingCode) : undefined,
          })
        }
        className="w-44"
      >
        <SelectOption value="">Tous bâtiments</SelectOption>
        {BUILDING_CODES.map((code) => (
          <SelectOption key={code} value={code}>
            {BUILDING_CODE_LABELS[code]}
          </SelectOption>
        ))}
      </Select>

      {/* Date range filter */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-primary-400" />
        <span className="text-sm text-primary-500">Du</span>
        <Input
          type="date"
          value={actionFilters.dateDebut ?? ''}
          onChange={(e) =>
            setActionFilters({
              dateDebut: e.target.value || undefined,
            })
          }
          className="w-36"
        />
        <span className="text-sm text-primary-500">au</span>
        <Input
          type="date"
          value={actionFilters.dateFin ?? ''}
          onChange={(e) =>
            setActionFilters({
              dateFin: e.target.value || undefined,
            })
          }
          className="w-36"
        />
      </div>

      {/* Clear filters */}
      {activeFiltersCount > 0 && (
        <Button variant="ghost" size="sm" onClick={resetActionFilters}>
          <X className="h-4 w-4 mr-1" />
          Effacer ({activeFiltersCount})
        </Button>
      )}
    </div>
  );
}
