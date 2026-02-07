import { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Mail,
  Send,
  User,
  Clock,
  History,
  RefreshCw,
  LayoutGrid,
  TableProperties,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores';
import {
  Card,
  Button,
  Badge,
  Select,
  SelectOption,
  EmptyState,
  Tabs,
  TabsList,
  TabsTrigger,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui';
import {
  useAlertes,
  markAlerteLue,
  markAlerteTraitee,
  markAllAlertesLues,
  envoyerEmailAlerte,
  useAlerteEmailStats,
  envoyerTousEmailsAlertes,
  envoyerRelancesAlertes,
} from '@/hooks';
import { AlerteEmailHistoriqueList } from '@/components/alertes/AlerteEmailHistorique';
import { formatDateRelative } from '@/lib/utils';
import {
  ALERTE_TYPES,
  ALERTE_TYPE_LABELS,
  CRITICITES,
  CRITICITE_LABELS,
  type Alerte,
  type Criticite,
} from '@/types';

const criticiteColors: Record<Criticite, string> = {
  low: 'bg-primary-100 text-primary-700',
  medium: 'bg-info-100 text-info-700',
  high: 'bg-warning-100 text-warning-700',
  critical: 'bg-error-100 text-error-700',
};

function AlerteCard({
  alerte,
  onMarkRead,
  onMarkDone,
  onSendEmail,
  isSendingEmail,
}: {
  alerte: Alerte;
  onMarkRead: () => void;
  onMarkDone: () => void;
  onSendEmail: () => void;
  isSendingEmail: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Auto-marquer comme lu quand l'alerte devient visible
  useEffect(() => {
    if (alerte.lu) return; // Déjà lu

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Attendre 1 seconde pour éviter les faux positifs (scroll rapide)
          const timeout = setTimeout(() => {
            onMarkRead();
          }, 1000);
          return () => clearTimeout(timeout);
        }
      },
      { threshold: 0.5 } // Au moins 50% visible
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [alerte.lu, onMarkRead]);

  return (
    <Card
      ref={cardRef}
      className={cn('card-hover', !alerte.lu && 'border-l-4 border-l-info-500')}
      padding="md"
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'mt-1 h-3 w-3 rounded-full shrink-0',
            alerte.criticite === 'critical' && 'bg-error-500',
            alerte.criticite === 'high' && 'bg-warning-500',
            alerte.criticite === 'medium' && 'bg-info-500',
            alerte.criticite === 'low' && 'bg-primary-400'
          )}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-primary-900">{alerte.titre}</h4>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge className={criticiteColors[alerte.criticite]}>
                  {CRITICITE_LABELS[alerte.criticite]}
                </Badge>
                <Badge variant="secondary">
                  {ALERTE_TYPE_LABELS[alerte.type]}
                </Badge>
                {alerte.emailEnvoye && (
                  <Badge className="bg-blue-100 text-blue-700">
                    <Mail className="h-3 w-3 mr-1" />
                    Email envoyé
                  </Badge>
                )}
              </div>
            </div>

            <span className="text-xs text-primary-400 shrink-0">
              {formatDateRelative(alerte.createdAt)}
            </span>
          </div>

          <p className="text-sm text-primary-600 mt-2">{alerte.message}</p>

          {/* Responsable */}
          {alerte.responsableNom && (
            <div className="flex items-center gap-2 mt-2 text-sm text-primary-500">
              <User className="h-4 w-4" />
              <span>
                {alerte.responsableNom}
                {alerte.responsableEmail && (
                  <span className="text-primary-400 ml-1">({alerte.responsableEmail})</span>
                )}
              </span>
            </div>
          )}

          {/* Traité par */}
          {alerte.traitee && alerte.traiteeParNom && (
            <div className="flex items-center gap-2 mt-1 text-xs text-green-600">
              <CheckCheck className="h-3 w-3" />
              <span>
                Traité par {alerte.traiteeParNom} le{' '}
                {alerte.traiteeAt && new Date(alerte.traiteeAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 mt-4 flex-wrap">
            {!alerte.lu && (
              <Button variant="ghost" size="sm" onClick={onMarkRead}>
                <Check className="h-4 w-4 mr-1" />
                Marquer lu
              </Button>
            )}
            {!alerte.traitee && (
              <>
                <Button variant="secondary" size="sm" onClick={onMarkDone}>
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Traiter
                </Button>
                {alerte.responsableEmail && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSendEmail}
                    disabled={isSendingEmail}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    {alerte.emailEnvoye ? 'Relancer' : 'Envoyer email'}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

const CRITICITE_ORDER: Record<Criticite, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const criticiteDotColors: Record<Criticite, string> = {
  critical: 'bg-error-500',
  high: 'bg-warning-500',
  medium: 'bg-info-500',
  low: 'bg-primary-400',
};

function AlerteTableView({
  alertes,
  onMarkRead,
  onMarkDone,
  onSendEmail,
  sendingEmailId,
}: {
  alertes: Alerte[];
  onMarkRead: (id: number) => void;
  onMarkDone: (id: number) => void;
  onSendEmail: (id: number, type: 'initial' | 'relance') => void;
  sendingEmailId: number | null;
}) {
  const sorted = [...alertes].sort((a, b) => {
    const critDiff = CRITICITE_ORDER[a.criticite] - CRITICITE_ORDER[b.criticite];
    if (critDiff !== 0) return critDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <Card padding="none">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[130px]">Criticité</TableHead>
            <TableHead>Titre</TableHead>
            <TableHead className="w-[160px]">Type</TableHead>
            <TableHead className="w-[180px]">Responsable</TableHead>
            <TableHead className="w-[110px]">Date</TableHead>
            <TableHead className="w-[50px] text-center">Email</TableHead>
            <TableHead className="w-[220px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((alerte) => (
            <TableRow
              key={alerte.id}
              className={cn(
                !alerte.lu && 'border-l-4 border-l-info-500 font-medium'
              )}
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', criticiteDotColors[alerte.criticite])} />
                  <Badge className={cn(criticiteColors[alerte.criticite], 'text-xs')}>
                    {CRITICITE_LABELS[alerte.criticite]}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <span className="line-clamp-1 text-primary-900">{alerte.titre}</span>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {ALERTE_TYPE_LABELS[alerte.type]}
                </Badge>
              </TableCell>
              <TableCell>
                {alerte.responsableNom ? (
                  <div>
                    <div className="text-sm text-primary-900">{alerte.responsableNom}</div>
                    {alerte.responsableEmail && (
                      <div className="text-xs text-primary-400">{alerte.responsableEmail}</div>
                    )}
                  </div>
                ) : (
                  <span className="text-primary-400">—</span>
                )}
              </TableCell>
              <TableCell>
                <span className="text-xs text-primary-500">{formatDateRelative(alerte.createdAt)}</span>
              </TableCell>
              <TableCell className="text-center">
                {alerte.emailEnvoye && <Mail className="h-4 w-4 text-blue-500 mx-auto" />}
              </TableCell>
              <TableCell>
                {alerte.traitee ? (
                  <div className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCheck className="h-3 w-3 shrink-0" />
                    <span>
                      Traité{alerte.traiteeParNom ? ` par ${alerte.traiteeParNom}` : ''}{' '}
                      {alerte.traiteeAt && `le ${new Date(alerte.traiteeAt).toLocaleDateString('fr-FR')}`}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    {!alerte.lu && (
                      <Button variant="ghost" size="sm" onClick={() => alerte.id && onMarkRead(alerte.id)}>
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Lu
                      </Button>
                    )}
                    <Button variant="secondary" size="sm" onClick={() => alerte.id && onMarkDone(alerte.id)}>
                      <CheckCheck className="h-3.5 w-3.5 mr-1" />
                      Traiter
                    </Button>
                    {alerte.responsableEmail && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => alerte.id && onSendEmail(alerte.id, alerte.emailEnvoye ? 'relance' : 'initial')}
                        disabled={sendingEmailId === alerte.id}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

export function AlertesPage() {
  const { alerteFilters, setAlerteFilters } = useAppStore();
  const [activeTab, setActiveTab] = useState<'active' | 'treated' | 'emails'>('active');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [sendingEmailId, setSendingEmailId] = useState<number | null>(null);
  const [isSendingAll, setIsSendingAll] = useState(false);
  const emailStats = useAlerteEmailStats();

  const alertes = useAlertes({
    ...alerteFilters,
    traitee: activeTab === 'treated',
  });

  const handleMarkRead = async (id: number) => {
    await markAlerteLue(id);
  };

  const handleMarkDone = async (id: number) => {
    await markAlerteTraitee(id);
  };

  const handleMarkAllRead = async () => {
    await markAllAlertesLues();
  };

  const handleSendEmail = async (alerteId: number, type: 'initial' | 'relance' = 'initial') => {
    setSendingEmailId(alerteId);
    try {
      await envoyerEmailAlerte(alerteId, type);
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleSendAllEmails = async () => {
    setIsSendingAll(true);
    try {
      await envoyerTousEmailsAlertes();
    } finally {
      setIsSendingAll(false);
    }
  };

  const handleSendRelances = async () => {
    setIsSendingAll(true);
    try {
      await envoyerRelancesAlertes(3);
    } finally {
      setIsSendingAll(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary-900">Alertes</h2>
          <p className="text-sm text-primary-500">
            Notifications et alertes du projet
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'active' && alertes.some((a) => !a.lu) && (
            <Button variant="secondary" onClick={handleMarkAllRead}>
              <Check className="h-4 w-4 mr-2" />
              Tout marquer lu
            </Button>
          )}
          {activeTab === 'active' && alertes.some((a) => a.responsableEmail && !a.emailEnvoye) && (
            <Button
              variant="primary"
              onClick={handleSendAllEmails}
              disabled={isSendingAll}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSendingAll ? 'Envoi...' : 'Envoyer tous les emails'}
            </Button>
          )}
        </div>
      </div>

      {/* Email Stats */}
      {activeTab === 'emails' && (
        <div className="grid grid-cols-4 gap-3">
          <Card padding="sm" className="text-center">
            <div className="text-2xl font-bold text-blue-700">{emailStats.total}</div>
            <div className="text-xs text-primary-500">Total envoyés</div>
          </Card>
          <Card padding="sm" className="text-center">
            <div className="text-2xl font-bold text-green-700">{emailStats.ouverts}</div>
            <div className="text-xs text-primary-500">Ouverts</div>
          </Card>
          <Card padding="sm" className="text-center">
            <div className="text-2xl font-bold text-gray-700">{emailStats.envoyes}</div>
            <div className="text-xs text-primary-500">En attente</div>
          </Card>
          <Card padding="sm" className="text-center">
            <div className="text-2xl font-bold text-red-700">{emailStats.echecs}</div>
            <div className="text-xs text-primary-500">Échecs</div>
          </Card>
        </div>
      )}

      {/* Tabs and filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg border">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'active' | 'treated' | 'emails')}>
          <TabsList>
            <TabsTrigger value="active">
              <Bell className="h-4 w-4 mr-1" />
              Actives
            </TabsTrigger>
            <TabsTrigger value="treated">
              <CheckCheck className="h-4 w-4 mr-1" />
              Traitées
            </TabsTrigger>
            <TabsTrigger value="emails">
              <History className="h-4 w-4 mr-1" />
              Historique Emails
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex-1" />

        {activeTab !== 'emails' && (
          <>
            <Select
              value={alerteFilters.type ?? ''}
              onChange={(e) =>
                setAlerteFilters({
                  type: e.target.value
                    ? (e.target.value as typeof alerteFilters.type)
                    : undefined,
                })
              }
              className="w-44"
            >
              <SelectOption value="">Tous les types</SelectOption>
              {ALERTE_TYPES.map((type) => (
                <SelectOption key={type} value={type}>
                  {ALERTE_TYPE_LABELS[type]}
                </SelectOption>
              ))}
            </Select>

            <Select
              value={alerteFilters.criticite ?? ''}
              onChange={(e) =>
                setAlerteFilters({
                  criticite: e.target.value
                    ? (e.target.value as typeof alerteFilters.criticite)
                    : undefined,
                })
              }
              className="w-36"
            >
              <SelectOption value="">Toutes criticités</SelectOption>
              {CRITICITES.map((crit) => (
                <SelectOption key={crit} value={crit}>
                  {CRITICITE_LABELS[crit]}
                </SelectOption>
              ))}
            </Select>

            <div className="flex items-center border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('cards')}
                className={cn(
                  'p-2 transition-colors',
                  viewMode === 'cards' ? 'bg-primary-100 text-primary-700' : 'text-primary-400 hover:text-primary-600'
                )}
                title="Vue cartes"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  'p-2 transition-colors',
                  viewMode === 'table' ? 'bg-primary-100 text-primary-700' : 'text-primary-400 hover:text-primary-600'
                )}
                title="Vue table"
              >
                <TableProperties className="h-4 w-4" />
              </button>
            </div>
          </>
        )}

        {activeTab === 'emails' && (
          <Button
            variant="secondary"
            onClick={handleSendRelances}
            disabled={isSendingAll}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isSendingAll && 'animate-spin')} />
            Envoyer relances
          </Button>
        )}
      </div>

      {/* Content */}
      {activeTab === 'emails' ? (
        <Card padding="md">
          <AlerteEmailHistoriqueList />
        </Card>
      ) : alertes.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-12 w-12" />}
          title={activeTab === 'active' ? 'Aucune alerte active' : 'Aucune alerte traitée'}
          description={
            activeTab === 'active'
              ? 'Tout va bien pour le moment'
              : 'Les alertes traitées apparaîtront ici'
          }
        />
      ) : viewMode === 'table' ? (
        <AlerteTableView
          alertes={alertes}
          onMarkRead={handleMarkRead}
          onMarkDone={handleMarkDone}
          onSendEmail={handleSendEmail}
          sendingEmailId={sendingEmailId}
        />
      ) : (
        <div className="space-y-3">
          {alertes.map((alerte) => (
            <AlerteCard
              key={alerte.id}
              alerte={alerte}
              onMarkRead={() => alerte.id && handleMarkRead(alerte.id)}
              onMarkDone={() => alerte.id && handleMarkDone(alerte.id)}
              onSendEmail={() => alerte.id && handleSendEmail(alerte.id, alerte.emailEnvoye ? 'relance' : 'initial')}
              isSendingEmail={sendingEmailId === alerte.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
