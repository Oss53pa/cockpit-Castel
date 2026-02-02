import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  User,
  Building,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  DollarSign,
  Printer,
  Share2,
  ArrowUp,
  MessageSquare,
  Quote,
  Lightbulb,
  Flag,
  ChevronRight,
  Star,
  Zap,
  Shield,
} from 'lucide-react';
import {
  useDashboardKPIs,
  useActions,
  useJalons,
  useBudgetSynthese,
  useRisques,
} from '@/hooks';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts';

const COLORS = {
  primary: '#1C3163',
  secondary: '#D4AF37',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  gray: '#6b7280',
};

// Type pour les données de rapport partagé
interface SharedReportData {
  id: string;
  title: string;
  type: string;
  author: string;
  createdAt: string;
  period: string;
  executiveSummary?: string;
  comments: {
    section: string;
    author: string;
    date: string;
    content: string;
  }[];
}

// Fonction pour charger les données du rapport depuis localStorage uniquement (pas de données mock)
function loadReportData(shareId: string): SharedReportData | null {
  const storedData = localStorage.getItem(`shared-report-${shareId}`);
  if (storedData) {
    try {
      const parsed = JSON.parse(storedData);
      return {
        id: shareId,
        title: parsed.reportTitle || 'Rapport',
        type: parsed.reportType || 'RAPPORT_MENSUEL',
        author: parsed.author || 'Utilisateur',
        createdAt: parsed.createdAt || new Date().toISOString(),
        period: parsed.period || new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        executiveSummary: parsed.executiveSummary,
        comments: parsed.comments || [],
      };
    } catch {
      // Ignorer les erreurs de parsing
    }
  }

  // Pas de données mock - retourner null si pas trouvé
  return null;
}

export function SharedReportPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportMeta, setReportMeta] = useState<SharedReportData | null>(null);

  const kpis = useDashboardKPIs();
  const actions = useActions();
  const jalons = useJalons();
  const budget = useBudgetSynthese();
  const risques = useRisques();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (shareId) {
        const data = loadReportData(shareId);
        if (data) {
          setReportMeta(data);
          setIsLoading(false);
        } else {
          setError('Rapport non trouvé ou lien expiré');
          setIsLoading(false);
        }
      } else {
        setError('Lien invalide');
        setIsLoading(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [shareId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1C3163] mx-auto"></div>
          <p className="mt-3 text-gray-600 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !reportMeta) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-sm">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="h-6 w-6 text-primary-600" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Rapport non disponible</h1>
          <p className="text-sm text-gray-600">{error || 'Lien invalide ou expiré.'}</p>
        </div>
      </div>
    );
  }

  // Calculs
  const actionsTerminees = actions.filter(a => a.statut === 'termine').length;
  const actionsEnCours = actions.filter(a => a.statut === 'en_cours').length;
  const actionsAFaire = actions.filter(a => a.statut === 'a_faire').length;
  const actionsBloquees = actions.filter(a => a.statut === 'bloque').length;
  const avancementGlobal = 68;
  const budgetConsomme = Math.round((budget.realise / budget.prevu) * 100);
  const risquesCritiques = risques.filter(r => (r.score || 0) > 15).length;

  const actionsParStatut = [
    { name: 'Terminées', value: actionsTerminees, color: COLORS.success },
    { name: 'En cours', value: actionsEnCours, color: COLORS.info },
    { name: 'À faire', value: actionsAFaire, color: COLORS.gray },
    { name: 'Bloquées', value: actionsBloquees, color: COLORS.danger },
  ];

  const avancementParAxe = [
    { axe: 'AXE 1', nom: 'Performance Financière', avancement: 75 },
    { axe: 'AXE 2', nom: 'Excellence Opérationnelle', avancement: 62 },
    { axe: 'AXE 3', nom: 'Gouvernance', avancement: 80 },
    { axe: 'AXE 4', nom: 'Développement Commercial', avancement: 55 },
    { axe: 'AXE 5', nom: 'Capital Humain', avancement: 70 },
    { axe: 'AXE 6', nom: 'Relations Stakeholders', avancement: 65 },
  ];

  const jalonsList = jalons.slice(0, 7).map(j => ({
    nom: j.titre,
    statut: j.statut === 'atteint' ? 'atteint' : j.statut === 'en_approche' || j.statut === 'en_danger' ? 'en_cours' : 'planifie',
    avancement: j.avancement_prealables || 0,
    date: j.date_prevue ? new Date(j.date_prevue).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-',
  }));

  const topRisques = risques.slice(0, 5).map(r => ({
    titre: r.titre,
    categorie: r.categorie,
    score: r.score || 0,
    statut: r.status,
  }));

  // Helper pour parser le markdown simple
  const parseMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={i} className={i > 0 ? 'mt-2' : ''}>
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j}>{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  // Récupérer le commentaire pour une section
  const getComment = (section: string) => {
    return reportMeta.comments?.find(c => c.section === section);
  };

  // Composant pour afficher un commentaire
  const CommentBlock = ({ section, className = '' }: { section: string; className?: string }) => {
    const comment = getComment(section);
    if (!comment) return null;

    return (
      <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 rounded-r-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
            <MessageSquare className="h-4 w-4 text-primary-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <User className="h-3 w-3" />
              <span className="font-medium">{comment.author}</span>
              <span>•</span>
              <Calendar className="h-3 w-3" />
              <span>{new Date(comment.date).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Tendance des 6 derniers mois
  const tendanceData = [
    { mois: 'Août', avancement: 35 },
    { mois: 'Sept', avancement: 42 },
    { mois: 'Oct', avancement: 50 },
    { mois: 'Nov', avancement: 58 },
    { mois: 'Déc', avancement: 63 },
    { mois: 'Jan', avancement: 68 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      `}</style>

      {/* Header Magazine Style */}
      <header className="bg-gradient-to-r from-[#1C3163] to-[#2a4a8a] text-white">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-[#D4AF37] text-sm font-medium mb-2">
                <Building className="h-4 w-4" />
                <span>COSMOS ANGRÉ</span>
                <span className="text-white/50">•</span>
                <span className="text-white/70">Projet Handover</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">{reportMeta.title}</h1>
              <div className="flex items-center gap-4 text-sm text-white/70">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {reportMeta.period}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {reportMeta.author}
                </span>
              </div>
            </div>
            <div className="no-print flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm"
              >
                <Printer className="h-4 w-4" />
                Imprimer
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(window.location.href); }}
                className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#c9a432] text-[#1C3163] rounded-lg transition-colors text-sm font-medium"
              >
                <Share2 className="h-4 w-4" />
                Partager
              </button>
            </div>
          </div>

          {/* KPIs dans le header */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/60 uppercase">Avancement</p>
                <TrendingUp className="h-4 w-4 text-[#D4AF37]" />
              </div>
              <p className="text-3xl font-bold mt-1">{avancementGlobal}%</p>
              <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                <ArrowUp className="h-3 w-3" /> +5% ce mois
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/60 uppercase">Actions</p>
                <CheckCircle className="h-4 w-4 text-primary-400" />
              </div>
              <p className="text-3xl font-bold mt-1">{actionsTerminees}<span className="text-lg text-white/50">/{actions.length}</span></p>
              <p className="text-xs text-white/60 mt-1">{actionsEnCours} en cours</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/60 uppercase">Jalons</p>
                <Target className="h-4 w-4 text-primary-400" />
              </div>
              <p className="text-3xl font-bold mt-1">{kpis.jalonsAtteints}<span className="text-lg text-white/50">/{kpis.jalonsTotal}</span></p>
              <p className="text-xs text-blue-400 mt-1">Dans les temps</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/60 uppercase">Budget</p>
                <DollarSign className="h-4 w-4 text-primary-400" />
              </div>
              <p className="text-3xl font-bold mt-1">{budgetConsomme}%</p>
              <p className="text-xs text-white/60 mt-1">consommé</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Synthèse Executive */}
        {reportMeta.executiveSummary && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#1C3163] rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-[#D4AF37]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Synthèse Executive</h2>
                <p className="text-sm text-gray-500">Vue d'ensemble du projet</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                {parseMarkdown(reportMeta.executiveSummary)}
              </div>
            </div>
          </section>
        )}

        {/* Section Avancement */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Avancement du Projet</h2>
              <p className="text-sm text-gray-500">Progression par axe stratégique</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-5 gap-6">
            {/* Graphique tendance */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Évolution sur 6 mois</h3>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tendanceData}>
                    <defs>
                      <linearGradient id="colorAvancement" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1C3163" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#1C3163" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Area type="monotone" dataKey="avancement" stroke="#1C3163" strokeWidth={2} fill="url(#colorAvancement)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Barres par axe */}
            <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Par axe stratégique</h3>
              <div className="space-y-3">
                {avancementParAxe.map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">{item.axe} - {item.nom}</span>
                      <span className="text-sm font-bold text-gray-900">{item.avancement}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.avancement}%`,
                          backgroundColor: item.avancement >= 70 ? COLORS.success : item.avancement >= 50 ? COLORS.warning : COLORS.danger,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Commentaire Avancement */}
          <CommentBlock section="avancement" className="mt-4" />
        </section>

        {/* Section Actions */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Plan d'Actions</h2>
              <p className="text-sm text-gray-500">Suivi des actions du projet</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Répartition */}
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Répartition par statut</h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={actionsParStatut}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {actionsParStatut.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {actionsParStatut.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-gray-600">{item.name}</span>
                    <span className="font-bold ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Métriques clés */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium text-green-100">Terminées</span>
                </div>
                <p className="text-4xl font-bold">{actionsTerminees}</p>
                <p className="text-sm text-green-100 mt-1">{Math.round((actionsTerminees / actions.length) * 100)}% du total</p>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5" />
                  <span className="text-sm font-medium text-blue-100">En cours</span>
                </div>
                <p className="text-4xl font-bold">{actionsEnCours}</p>
                <p className="text-sm text-blue-100 mt-1">Actions actives</p>
              </div>

              <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl p-5 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Flag className="h-5 w-5" />
                  <span className="text-sm font-medium text-gray-200">À faire</span>
                </div>
                <p className="text-4xl font-bold">{actionsAFaire}</p>
                <p className="text-sm text-gray-200 mt-1">Planifiées</p>
              </div>

              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-5 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-sm font-medium text-red-100">Bloquées</span>
                </div>
                <p className="text-4xl font-bold">{actionsBloquees}</p>
                <p className="text-sm text-red-100 mt-1">Attention requise</p>
              </div>
            </div>
          </div>

          {/* Commentaire Actions */}
          <CommentBlock section="actions" className="mt-4" />
        </section>

        {/* Section Jalons + Risques */}
        <div className="grid lg:grid-cols-2 gap-8 mb-10">
          {/* Jalons */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Jalons</h2>
                <p className="text-sm text-gray-500">Étapes clés du projet</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              {jalonsList.map((jalon, index) => (
                <div key={index} className={`flex items-center gap-3 p-4 ${index !== jalonsList.length - 1 ? 'border-b' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    jalon.statut === 'atteint' ? 'bg-green-100' :
                    jalon.statut === 'en_cours' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {jalon.statut === 'atteint' ? (
                      <CheckCircle className="h-5 w-5 text-primary-600" />
                    ) : jalon.statut === 'en_cours' ? (
                      <Clock className="h-5 w-5 text-primary-600" />
                    ) : (
                      <Target className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{jalon.nom}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            jalon.statut === 'atteint' ? 'bg-green-500' :
                            jalon.statut === 'en_cours' ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                          style={{ width: `${jalon.avancement}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-gray-500">{jalon.avancement}%</span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">{jalon.date}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Risques */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Risques Majeurs</h2>
                <p className="text-sm text-gray-500">{risquesCritiques} risques critiques identifiés</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              {topRisques.map((risque, index) => (
                <div key={index} className={`p-4 ${index !== topRisques.length - 1 ? 'border-b' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-1.5 h-full min-h-[40px] rounded-full ${
                      risque.score > 15 ? 'bg-red-500' :
                      risque.score > 10 ? 'bg-amber-500' :
                      risque.score > 5 ? 'bg-blue-500' : 'bg-green-500'
                    }`}></div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{risque.titre}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{risque.categorie}</p>
                        </div>
                        <div className={`text-sm font-bold px-2 py-1 rounded ${
                          risque.score > 15 ? 'bg-red-100 text-red-700' :
                          risque.score > 10 ? 'bg-amber-100 text-amber-700' :
                          risque.score > 5 ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          Score: {risque.score}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Commentaire Risques */}
            <CommentBlock section="risques" className="mt-4" />
          </section>
        </div>

        {/* Section Budget */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Suivi Budgétaire</h2>
              <p className="text-sm text-gray-500">État d'exécution du budget projet</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-[#1C3163] rounded-lg text-white">
                <p className="text-xs text-white/70 uppercase mb-1">Budget Total</p>
                <p className="text-2xl font-bold">{(budget.prevu / 1000000).toFixed(1)} M</p>
                <p className="text-xs text-white/50">FCFA</p>
              </div>
              <div className="text-center p-4 bg-green-600 rounded-lg text-white">
                <p className="text-xs text-white/70 uppercase mb-1">Engagé</p>
                <p className="text-2xl font-bold">{(budget.engage / 1000000).toFixed(1)} M</p>
                <p className="text-xs text-white/50">FCFA</p>
              </div>
              <div className="text-center p-4 bg-blue-600 rounded-lg text-white">
                <p className="text-xs text-white/70 uppercase mb-1">Réalisé</p>
                <p className="text-2xl font-bold">{(budget.realise / 1000000).toFixed(1)} M</p>
                <p className="text-xs text-white/50">FCFA</p>
              </div>
              <div className="text-center p-4 bg-amber-500 rounded-lg text-white">
                <p className="text-xs text-white/70 uppercase mb-1">Disponible</p>
                <p className="text-2xl font-bold">{((budget.prevu - budget.realise) / 1000000).toFixed(1)} M</p>
                <p className="text-xs text-white/50">FCFA</p>
              </div>
            </div>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { poste: 'Études', budget: 150, realise: 145 },
                  { poste: 'Travaux', budget: 450, realise: 320 },
                  { poste: 'Équipements', budget: 200, realise: 180 },
                  { poste: 'Formation', budget: 80, realise: 45 },
                  { poste: 'Conseil', budget: 120, realise: 95 },
                  { poste: 'Divers', budget: 50, realise: 30 },
                ]} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="poste" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={(value) => `${value} M FCFA`} />
                  <Bar dataKey="budget" name="Budget" fill="#e5e7eb" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="realise" name="Réalisé" fill="#1C3163" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Commentaire Budget */}
          <CommentBlock section="budget" className="mt-4" />
        </section>

        {/* Conclusion - Points clés */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Conclusions & Recommandations</h2>
              <p className="text-sm text-gray-500">Points clés à retenir</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <Star className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-bold text-green-800">Points Positifs</h3>
              </div>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-green-700">
                  <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>Progression de <strong>+5%</strong> sur l'avancement global ce mois-ci</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-green-700">
                  <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>Jalon J3 "Formation" en avance à <strong>85%</strong> de complétion</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-green-700">
                  <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>Budget maîtrisé avec <strong>{budgetConsomme}%</strong> de consommation</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-green-700">
                  <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>Équipe projet stable et fortement engagée</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-bold text-amber-800">Points d'Attention</h3>
              </div>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-amber-700">
                  <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>Migration SI à surveiller - <strong>risque de retard</strong> identifié</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-amber-700">
                  <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                  <span><strong>{risquesCritiques} risques critiques</strong> nécessitent une attention immédiate</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-amber-700">
                  <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>AXE 4 en retard (<strong>55%</strong> vs 60% objectif)</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-amber-700">
                  <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                  <span><strong>{actionsBloquees} actions bloquées</strong> à débloquer en priorité</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Citation / Message clé */}
          <div className="mt-6 bg-gradient-to-r from-[#1C3163] to-[#2a4a8a] rounded-xl p-6 text-white">
            <div className="flex items-start gap-4">
              <Quote className="h-8 w-8 text-[#D4AF37] shrink-0" />
              <div>
                <p className="text-lg font-medium leading-relaxed">
                  "Le projet Handover Cosmos Angré maintient une trajectoire positive.
                  Les prochaines semaines seront déterminantes pour sécuriser le jalon J4 (Mise en place SI)
                  et débloquer les actions en attente."
                </p>
                <p className="mt-3 text-sm text-white/70">
                  — {reportMeta.author}, Directeur de Projet
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t pt-6 pb-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-[#1C3163]" />
              <span className="font-semibold text-[#1C3163]">COSMOS ANGRÉ</span>
              <span>•</span>
              <span>Projet Handover</span>
            </div>
            <div className="text-right">
              <p>Généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-xs text-gray-400 mt-1">Document confidentiel - Diffusion restreinte</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
