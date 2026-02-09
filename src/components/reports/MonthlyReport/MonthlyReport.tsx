/**
 * MonthlyReport — Rapport Mensuel Professionnel (format COPIL)
 * Design unifié avec le design system COSMOS (constantes C)
 */

import { useState } from "react";
import { C } from '@/components/rapports/ExcoMensuelV5/constants';

// ============================================================================
// DATA (statique pour ce rapport — sera remplacé par hooks live ultérieurement)
// ============================================================================

const d = {
  month: "Février 2026",
  generated: "09/02/2026 à 18:57",
  weather: "cloudy",
  weatherLabel: "Vigilance",
  weatherSummary: "Le projet est en phase de démarrage avec un avancement global de 8%. La mobilisation avance plus vite que le chantier (-6.53 pts d'écart), ce qui est normal à ce stade mais nécessite un suivi rapproché. Les axes TECH et EXP à 0% constituent le principal point de vigilance. Le budget n'est pas encore engagé — la validation DG est attendue pour débloquer les premières dépenses.",
  kpis: [
    { label: "Avancement global", value: "8%", sub: "vs 3% en jan.", trend: "+5pts", dir: "up", icon: "📊", target: "12%", onTrack: false },
    { label: "Actions terminées", value: "2 / 117", sub: "1.7% du total", trend: "+2", dir: "up", icon: "✅", target: "10/117", onTrack: false },
    { label: "Jalons atteints", value: "0 / 33", sub: "3 jalons en fév.", trend: "stable", dir: "stable", icon: "🎯", target: "3/33", onTrack: false },
    { label: "Taux d'occupation", value: "41%", sub: "Baux signés/cibles", trend: "+6pts", dir: "up", icon: "🏢", target: "50%", onTrack: false },
    { label: "Budget engagé", value: "0 FCFA", sub: "sur 552M prévus", trend: "stable", dir: "stable", icon: "💰", target: "50M", onTrack: false },
    { label: "Retard projeté", value: "~45j", sub: "à vélocité actuelle", trend: "nouveau", dir: "down", icon: "⏱️", target: "0j", onTrack: false },
  ],
  sync: { construction: 9.86, mobilisation: 16.39, ecart: -6.53, ecartDays: 10, status: "attention" },
  trendMonthly: [
    { m: "Oct", pct: 0 }, { m: "Nov", pct: 0 }, { m: "Déc", pct: 1 },
    { m: "Jan", pct: 3 }, { m: "Fév", pct: 8 },
  ],
  trendIdeal: [
    { m: "Oct", pct: 0 }, { m: "Nov", pct: 2 }, { m: "Déc", pct: 5 },
    { m: "Jan", pct: 8 }, { m: "Fév", pct: 12 },
  ],
  axes: [
    { code: "RH", name: "Ressources Humaines", pct: 17, done: 0, total: 5, late: 1, janPct: 10, status: "progress", keyFact: "Profils clés identifiés, recrutements non lancés", blocker: "Attente validation organigramme et budget" },
    { code: "COM", name: "Communication", pct: 27, done: 0, total: 9, late: 0, janPct: 20, status: "progress", keyFact: "Stratégie COM en cours d'élaboration", blocker: "Charte graphique en attente validation DG" },
    { code: "TECH", name: "Technique & IT", pct: 0, done: 0, total: 9, late: 2, janPct: 0, status: "blocked", keyFact: "Aucune action démarrée", blocker: "Aucun prestataire IT identifié, pas de cahier des charges" },
    { code: "BUD", name: "Budget & Finance", pct: 48, done: 0, total: 4, late: 0, janPct: 35, status: "progress", keyFact: "Budget pré-ouverture finalisé à 398M FCFA", blocker: "En attente de validation DG" },
    { code: "MKT", name: "Marketing & Commercialisation", pct: 3, done: 0, total: 20, late: 1, janPct: 1, status: "slow", keyFact: "Phase planification démarrée", blocker: "Étude de marché non finalisée, ressources limitées" },
    { code: "EXP", name: "Exploitation & Maintenance", pct: 0, done: 0, total: 21, late: 0, janPct: 0, status: "notstarted", keyFact: "Non démarré — conditionné au chantier", blocker: "Dépend de l'avancement construction (>40%)" },
    { code: "JUR", name: "Juridique & Conformité", pct: 12, done: 0, total: 8, late: 0, janPct: 8, status: "progress", keyFact: "Modèles de baux en rédaction", blocker: "Revue juridique OHADA en cours" },
    { code: "DIV", name: "Divers & Transversal", pct: 40, done: 2, total: 7, late: 0, janPct: 25, status: "progress", keyFact: "Note de cadrage finalisée, COCKPIT opérationnel", blocker: "RAS" },
  ],
  budget: {
    prevu: 552, engage: 0, realise: 0, resteAEngager: 552,
    lines: [
      { cat: "Aménagements & Travaux", prevu: 180, engage: 0, pct: 0 },
      { cat: "Équipements techniques", prevu: 120, engage: 0, pct: 0 },
      { cat: "Marketing & Communication", prevu: 85, engage: 0, pct: 0 },
      { cat: "RH & Formation", prevu: 65, engage: 0, pct: 0 },
      { cat: "IT & Systèmes", prevu: 52, engage: 0, pct: 0 },
      { cat: "Juridique & Assurances", prevu: 30, engage: 0, pct: 0 },
      { cat: "Divers & Imprévus", prevu: 20, engage: 0, pct: 0 },
    ]
  },
  risks: [
    { score: 20, title: "Retard livraison chantier", pi: "P4×I5", evolution: "stable" as const, owner: "MOE", mitigation: "Réunions hebdo chantier + escalade promoteur", impact: "Décalage global de l'ouverture" },
    { score: 20, title: "Retard livraison gros œuvre", pi: "P4×I5", evolution: "stable" as const, owner: "MOE", mitigation: "Suivi renforcé planning TCE", impact: "Bloque fit-out et équipements" },
    { score: 16, title: "Retards fit-out preneurs", pi: "P4×I4", evolution: "up" as const, owner: "Hadja", mitigation: "❌ Plan à définir", impact: "Retard ouverture boutiques" },
    { score: 16, title: "Retard second œuvre", pi: "P4×I4", evolution: "stable" as const, owner: "MOE", mitigation: "Intégré suivi chantier", impact: "Décale les finitions et réceptions" },
    { score: 16, title: "Réserves non levées", pi: "P4×I4", evolution: "up" as const, owner: "MOE", mitigation: "Relance formelle entrepreneur", impact: "Non-conformité à la réception" },
  ],
  milestonesFeb: [
    { name: "Note de cadrage validée", axe: "DIV", date: "9 févr.", status: "done" as const },
    { name: "Phase 1 : Planification stratégique", axe: "MKT", date: "15 févr.", status: "atrisk" as const },
    { name: "Budget mobilisation validé", axe: "BUD", date: "20 févr.", status: "ontrack" as const },
  ],
  milestonesMar: [
    { name: "Cahier des charges IT validé", axe: "TECH", date: "1 mars", status: "compromised" as const },
    { name: "Organigramme cible validé", axe: "RH", date: "5 mars", status: "atrisk" as const },
    { name: "Plan COM validé", axe: "COM", date: "5 mars", status: "ontrack" as const },
    { name: "Template bail type validé", axe: "JUR", date: "10 mars", status: "ontrack" as const },
    { name: "Identité de marque validée", axe: "MKT", date: "15 mars", status: "atrisk" as const },
  ],
  actions: [
    { title: "Valider le calendrier de livraison preneurs", axe: "COM", date: "30 mars", owner: "Deborah NTUMY", priority: "critical" as const },
    { title: "Présenter et valider le budget exploitation DG", axe: "BUD", date: "31 mars", owner: "Pamela ATOKOUNA", priority: "critical" as const },
    { title: "Finaliser la charte graphique", axe: "MKT", date: "27 mars", owner: "Yvan Guehi", priority: "high" as const },
    { title: "Souscrire les polices d'assurance", axe: "DIV", date: "31 mars", owner: "Pamela ATOKOUNA", priority: "high" as const },
    { title: "Valider l'identité de marque", axe: "MKT", date: "15 mars", owner: "Yvan Guehi", priority: "high" as const },
    { title: "Cartographier le parcours client", axe: "MKT", date: "31 mars", owner: "Yvan Guehi", priority: "medium" as const },
  ],
  decisions: [
    { urgency: "critical" as const, title: "Validation budget mobilisation (398M FCFA)", context: "Finalisé depuis S5, en attente signature DG. Bloque tous les engagements.", deadline: "20 févr.", owner: "Cheick Sanankoua" },
    { urgency: "critical" as const, title: "Lancement sélection prestataire IT", context: "Axe TECH à 0%. Sans décision, retard cascade sur caisse, sécurité, GTC, parking.", deadline: "28 févr.", owner: "Deborah / DG" },
    { urgency: "high" as const, title: "Validation charte graphique & identité visuelle", context: "Bloque la communication, la signalétique et le marketing. Maquettes prêtes.", deadline: "15 mars", owner: "DG" },
  ],
  achievements: [
    "Note de cadrage projet finalisée et diffusée",
    "Matrice budgétaire pré-ouverture (398M FCFA) complétée",
    "COCKPIT déployé et opérationnel avec les 8 axes",
    "Taux d'occupation commerciale atteint 41%",
    "Stratégie de communication en cours de formalisation",
  ],
  projection: { velocity: 5, estimatedEnd: "Déc. 2026", target: "Oct. 2026", daysLate: 45, requiredVelocity: 8 },
};

// ============================================================================
// MICRO-COMPOSANTS
// ============================================================================

function PB({ pct, h = 8, color = C.blue, bg = C.gray200 }: { pct: number; h?: number; color?: string; bg?: string }) {
  return (
    <div style={{ background: bg, borderRadius: h, height: h, width: "100%", overflow: "hidden" }}>
      <div style={{ background: color, height: "100%", width: `${Math.min(pct, 100)}%`, borderRadius: h, transition: "width 0.5s" }} />
    </div>
  );
}

function Badge({ text, color = C.blue }: { text: string; color?: string }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: C.white, background: color, padding: "2px 8px", borderRadius: 4 }}>{text}</span>
  );
}

function Trend({ trend, dir }: { trend: string; dir: string }) {
  if (dir === "stable") return <span style={{ fontSize: 10, color: C.gray500, background: C.gray100, padding: "2px 6px", borderRadius: 8 }}>— stable</span>;
  if (dir === "down") return <span style={{ fontSize: 10, color: C.red, background: C.redBg, padding: "2px 6px", borderRadius: 8, fontWeight: 600 }}>▼ {trend}</span>;
  return <span style={{ fontSize: 10, color: C.green, background: C.greenBg, padding: "2px 6px", borderRadius: 8, fontWeight: 600 }}>▲ {trend}</span>;
}

function StatusBadge({ s }: { s: string }) {
  const m: Record<string, { c: string; l: string }> = {
    done: { c: C.green, l: "✅ Atteint" },
    ontrack: { c: C.green, l: "🟢 On track" },
    atrisk: { c: C.orange, l: "🟡 À risque" },
    compromised: { c: C.red, l: "🔴 Compromis" },
  };
  const x = m[s] || m.ontrack;
  return <span style={{ fontSize: 10, color: x.c, fontWeight: 600 }}>{x.l}</span>;
}

function AxeStatus({ s }: { s: string }) {
  const m: Record<string, { c: string; l: string }> = {
    progress: { c: C.blue, l: "En cours" },
    blocked: { c: C.red, l: "Bloqué" },
    slow: { c: C.orange, l: "Lent" },
    notstarted: { c: C.gray500, l: "Non démarré" },
  };
  const x = m[s] || m.progress;
  return <span style={{ fontSize: 10, color: C.white, background: x.c, padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>{x.l}</span>;
}

function Sec({ title, icon, children, accent = C.navy, pageBreak = false }: { title: string; icon: string; children: React.ReactNode; accent?: string; pageBreak?: boolean }) {
  return (
    <div style={{ marginBottom: 28, ...(pageBreak ? { pageBreakBefore: "always" as const } : {}) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, paddingBottom: 8, borderBottom: `2px solid ${accent}` }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: accent, textTransform: "uppercase" as const, letterSpacing: 0.5 }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.white, borderRadius: 10, padding: 16, border: `1px solid ${C.gray200}`, ...style }}>{children}</div>
  );
}

function MiniChart() {
  const w = 320, h = 100, px = 35, py = 15;
  const mx = 15;
  const pts = d.trendMonthly.map((p, i) => ({ x: px + (i / (d.trendMonthly.length - 1)) * (w - 2 * px), y: h - py - (p.pct / mx) * (h - 2 * py) }));
  const ideal = d.trendIdeal.map((p, i) => ({ x: px + (i / (d.trendIdeal.length - 1)) * (w - 2 * px), y: h - py - (p.pct / mx) * (h - 2 * py) }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const iLine = ideal.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = line + ` L${pts[pts.length - 1].x},${h - py} L${pts[0].x},${h - py} Z`;
  return (
    <svg width={w} height={h + 20} style={{ overflow: "visible" }}>
      <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.gold} stopOpacity={0.2} /><stop offset="100%" stopColor={C.gold} stopOpacity={0} /></linearGradient></defs>
      <path d={area} fill="url(#ag)" />
      <path d={iLine} fill="none" stroke={C.gray300} strokeWidth={1.5} strokeDasharray="5 3" />
      <path d={line} fill="none" stroke={C.gold} strokeWidth={2.5} strokeLinecap="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill={C.white} stroke={C.gold} strokeWidth={2} />
          <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize={10} fontWeight="700" fill={C.gold}>{d.trendMonthly[i].pct}%</text>
          <text x={p.x} y={h + 14} textAnchor="middle" fontSize={9} fill={C.gray400}>{d.trendMonthly[i].m}</text>
        </g>
      ))}
      <text x={w - 10} y={ideal[ideal.length - 1].y} fontSize={9} fill={C.gray400} textAnchor="end">cible</text>
    </svg>
  );
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function MonthlyReport() {
  const [_tab, setTab] = useState("all");

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: C.offWhite, minHeight: "100vh", color: C.navy }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyLight} 50%, ${C.navyMid} 100%)`, color: C.white, padding: "28px 32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 3, opacity: 0.5, marginBottom: 6 }}>COCKPIT — Cosmos Angré — Format COPIL</div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>Rapport Mensuel</h1>
            <div style={{ fontSize: 16, opacity: 0.85, marginTop: 4, fontWeight: 300 }}>{d.month}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, opacity: 0.5 }}>CRMC / New Heaven SA</div>
            <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>Diffusion : COPIL / Direction Générale</div>
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <button style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: C.white, padding: "8px 16px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>📄 Export PDF</button>
              <button style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: C.white, padding: "8px 16px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>📊 Export Excel</button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 32px", maxWidth: 960, margin: "0 auto" }}>

        {/* Météo */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, background: C.orangeBg, borderRadius: 12, padding: "16px 20px", border: `1px solid ${C.orange}30` }}>
            <span style={{ fontSize: 42 }}>⛅</span>
            <div>
              <div style={{ fontWeight: 800, color: C.orange, fontSize: 13, textTransform: "uppercase", letterSpacing: 1 }}>Météo Projet : {d.weatherLabel}</div>
              <div style={{ fontSize: 13, color: C.navy, lineHeight: 1.6, marginTop: 4 }}>{d.weatherSummary}</div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <Sec title="Tableau de Bord — Indicateurs Clés" icon="📊">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {d.kpis.map((k, i) => (
              <Card key={i} style={{ textAlign: "center", position: "relative" }}>
                <div style={{ fontSize: 22, marginBottom: 2 }}>{k.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: C.navy }}>{k.value}</div>
                <div style={{ fontSize: 11, color: C.gray500, marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontSize: 10, color: C.gray400, marginBottom: 6 }}>{k.sub}</div>
                <Trend trend={k.trend} dir={k.dir} />
                <div style={{ marginTop: 8, fontSize: 10, color: C.gray500, borderTop: `1px solid ${C.gray100}`, paddingTop: 6 }}>
                  Cible : <strong style={{ color: C.navy }}>{k.target}</strong>
                </div>
              </Card>
            ))}
          </div>
        </Sec>

        {/* Courbe + Sync */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 8, textTransform: "uppercase" }}>📈 Évolution mensuelle</div>
            <MiniChart />
            <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 10 }}>
              <span style={{ color: C.gold }}>● Réel</span>
              <span style={{ color: C.gray300 }}>- - Trajectoire cible</span>
            </div>
          </Card>
          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 12, textTransform: "uppercase" }}>🔄 Synchronisation Chantier / Mobilisation</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}><span>🏗️ Construction (chantier)</span><span style={{ fontWeight: 700 }}>{d.sync.construction}%</span></div>
              <PB pct={d.sync.construction} color={C.gray400} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}><span>📋 Mobilisation (COCKPIT)</span><span style={{ fontWeight: 700 }}>{d.sync.mobilisation}%</span></div>
              <PB pct={d.sync.mobilisation} color={C.gold} />
            </div>
            <div style={{ background: C.orangeBg, borderRadius: 8, padding: "10px 14px", border: `1px solid ${C.orange}20` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.orange }}>Écart : {d.sync.ecart} pts (~{d.sync.ecartDays} jours)</div>
              <div style={{ fontSize: 11, color: C.navyLight, marginTop: 2 }}>Mobilisation en avance sur le chantier. Normal à ce stade, mais à surveiller pour éviter les coûts de stockage prématurés.</div>
            </div>
          </Card>
        </div>

        {/* Réalisations du mois */}
        <Sec title="Réalisations du Mois" icon="🏆" accent={C.green}>
          <Card style={{ background: C.greenBg, border: `1px solid ${C.green}20` }}>
            {d.achievements.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: i < d.achievements.length - 1 ? `1px solid ${C.green}15` : "none" }}>
                <span style={{ color: C.green, fontSize: 14 }}>✅</span>
                <span style={{ fontSize: 13, color: C.navy }}>{a}</span>
              </div>
            ))}
          </Card>
        </Sec>

        {/* Décisions requises COPIL */}
        <Sec title="Décisions Requises — COPIL" icon="🔴" accent={C.red}>
          {d.decisions.map((x, i) => (
            <Card key={i} style={{ marginBottom: 10, borderLeft: `4px solid ${x.urgency === "critical" ? C.red : C.orange}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Badge text={x.urgency === "critical" ? "URGENT" : "IMPORTANT"} color={x.urgency === "critical" ? C.red : C.orange} />
                <span style={{ fontSize: 14, fontWeight: 700 }}>{x.title}</span>
              </div>
              <div style={{ fontSize: 12, color: C.gray600, lineHeight: 1.6 }}>{x.context}</div>
              <div style={{ display: "flex", gap: 20, fontSize: 11, color: C.gray500, marginTop: 6 }}>
                <span>👤 {x.owner}</span>
                <span>📅 {x.deadline}</span>
              </div>
            </Card>
          ))}
        </Sec>

        {/* Axes */}
        <Sec title="Avancement Détaillé par Axe Stratégique" icon="📈" pageBreak>
          {d.axes.map((a, i) => {
            const delta = a.pct - a.janPct;
            const barColor = a.status === "blocked" ? C.red : a.status === "slow" ? C.orange : a.status === "notstarted" ? C.gray300 : C.blue;
            return (
              <Card key={i} style={{ marginBottom: 10, borderLeft: `4px solid ${barColor}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ background: C.navy, color: C.white, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4 }}>{a.code}</span>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{a.name}</span>
                    <AxeStatus s={a.status} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: C.navy }}>{a.pct}%</span>
                    <Trend trend={`${delta > 0 ? "+" : ""}${delta}pts`} dir={delta > 0 ? "up" : delta < 0 ? "down" : "stable"} />
                  </div>
                </div>
                <PB pct={a.pct} color={barColor} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 10, fontSize: 12, color: C.gray600, lineHeight: 1.5 }}>
                  <div><strong>Actions :</strong> {a.done}/{a.total} terminées {a.late > 0 && <span style={{ color: C.red, fontWeight: 600 }}>({a.late} en retard)</span>}</div>
                  <div><strong>Janv. :</strong> {a.janPct}% → <strong>Févr. :</strong> {a.pct}%</div>
                  <div><strong>Fait marquant :</strong> {a.keyFact}</div>
                  <div><strong>Bloquant :</strong> <span style={{ color: a.blocker === "RAS" ? C.green : C.orange }}>{a.blocker}</span></div>
                </div>
              </Card>
            );
          })}
        </Sec>

        {/* Jalons */}
        <Sec title="Jalons — Février & Mars" icon="🎯">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 10 }}>Février 2026</div>
              {d.milestonesFeb.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < d.milestonesFeb.length - 1 ? `1px solid ${C.gray100}` : "none" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{m.name}</div>
                    <div style={{ fontSize: 10, color: C.gray500 }}>{m.axe} • {m.date}</div>
                  </div>
                  <StatusBadge s={m.status} />
                </div>
              ))}
            </Card>
            <Card>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 10 }}>Mars 2026 (à venir)</div>
              {d.milestonesMar.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < d.milestonesMar.length - 1 ? `1px solid ${C.gray100}` : "none" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{m.name}</div>
                    <div style={{ fontSize: 10, color: C.gray500 }}>{m.axe} • {m.date}</div>
                  </div>
                  <StatusBadge s={m.status} />
                </div>
              ))}
            </Card>
          </div>
        </Sec>

        {/* Budget */}
        <Sec title="Exécution Budgétaire" icon="💰" accent={C.green}>
          <Card>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16, textAlign: "center" }}>
              {[
                { l: "Budget prévu", v: `${d.budget.prevu}M`, c: C.navy },
                { l: "Engagé", v: `${d.budget.engage}M`, c: C.orange },
                { l: "Réalisé", v: `${d.budget.realise}M`, c: C.green },
                { l: "Reste à engager", v: `${d.budget.resteAEngager}M`, c: C.red },
              ].map((b, i) => (
                <div key={i} style={{ padding: 12, background: C.gray50, borderRadius: 8 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: b.c }}>{b.v}</div>
                  <div style={{ fontSize: 10, color: C.gray500, marginTop: 2 }}>{b.l}</div>
                </div>
              ))}
            </div>
            <PB pct={0} h={12} color={C.green} bg={C.gray200} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.gray500, marginTop: 4 }}>
              <span>Réalisé 0%</span><span>Engagé 0%</span><span>100%</span>
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Ventilation par catégorie (M FCFA)</div>
              {d.budget.lines.map((l, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", borderBottom: `1px solid ${C.gray100}`, fontSize: 12 }}>
                  <span style={{ flex: 1 }}>{l.cat}</span>
                  <span style={{ width: 60, textAlign: "right", fontWeight: 600 }}>{l.prevu}M</span>
                  <div style={{ width: 120 }}><PB pct={l.pct} h={6} color={C.green} /></div>
                  <span style={{ width: 30, textAlign: "right", fontSize: 10, color: C.gray500 }}>{l.pct}%</span>
                </div>
              ))}
            </div>
            <div style={{ background: C.orangeBg, borderRadius: 8, padding: "10px 14px", marginTop: 12, fontSize: 12 }}>
              <strong style={{ color: C.orange }}>⚠️ Note :</strong> <span style={{ color: C.navyLight }}>Aucun engagement budgétaire à date. La validation du budget mobilisation (décision #1) est le prérequis pour débloquer les premiers engagements.</span>
            </div>
          </Card>
        </Sec>

        {/* Risques */}
        <Sec title="Cartographie des Risques" icon="⚠️" accent={C.orange}>
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            {[
              { l: "Critiques (≥16)", n: 5, c: C.red },
              { l: "Élevés (9-15)", n: 12, c: C.orange },
              { l: "Modérés (≤8)", n: 58, c: C.blue },
            ].map((r, i) => (
              <div key={i} style={{ flex: 1, background: `${r.c}10`, borderRadius: 8, padding: "10px 14px", textAlign: "center", border: `1px solid ${r.c}20` }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: r.c }}>{r.n}</div>
                <div style={{ fontSize: 10, color: C.gray500 }}>{r.l}</div>
              </div>
            ))}
          </div>
          <Card>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.navy, marginBottom: 10 }}>Top 5 — Risques Critiques</div>
            {d.risks.map((r, i) => {
              const sc = r.score >= 20 ? C.red : C.orange;
              const evIc: Record<string, string> = { stable: "— Stable", up: "▲ En hausse", down: "▼ En baisse" };
              const evCl: Record<string, string> = { stable: C.gray500, up: C.red, down: C.green };
              return (
                <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < d.risks.length - 1 ? `1px solid ${C.gray100}` : "none" }}>
                  <div style={{ background: sc, color: C.white, fontSize: 14, fontWeight: 800, minWidth: 40, height: 40, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>{r.score}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{r.title}</span>
                      <span style={{ fontSize: 10, color: C.gray500 }}>({r.pi})</span>
                      <span style={{ fontSize: 10, color: evCl[r.evolution], fontWeight: 600 }}>{evIc[r.evolution]}</span>
                    </div>
                    <div style={{ fontSize: 11, color: C.gray600 }}>Impact : {r.impact}</div>
                    <div style={{ fontSize: 11, color: C.gray500, marginTop: 2 }}>
                      👤 {r.owner} &nbsp;|&nbsp; Mitigation : <span style={{ color: r.mitigation.startsWith("❌") ? C.red : C.gray600 }}>{r.mitigation}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>
        </Sec>

        {/* Plan d'action M+1 */}
        <Sec title="Plan d'Action — Mars 2026" icon="📋" accent={C.purple}>
          <Card>
            {d.actions.map((a, i) => {
              const pc: Record<string, string> = { critical: C.red, high: C.orange, medium: C.blue };
              const pl: Record<string, string> = { critical: "P1", high: "P2", medium: "P3" };
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < d.actions.length - 1 ? `1px solid ${C.gray100}` : "none" }}>
                  <Badge text={pl[a.priority]} color={pc[a.priority]} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{a.title}</div>
                    <div style={{ fontSize: 11, color: C.gray500, marginTop: 2 }}>
                      <span style={{ background: C.blueBg, padding: "1px 6px", borderRadius: 4 }}>{a.axe}</span> &nbsp;•&nbsp; 📅 {a.date} &nbsp;•&nbsp; 👤 {a.owner}
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>
        </Sec>

        {/* Projection */}
        <Sec title="Projection & Trajectoire" icon="🔮" accent={C.purple}>
          <Card style={{ background: `linear-gradient(135deg, ${C.purpleBg} 0%, ${C.purpleBg} 100%)`, border: `1px solid ${C.purple}` }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, textAlign: "center", marginBottom: 16 }}>
              {[
                { l: "Vélocité mensuelle", v: `${d.projection.velocity} pts/mois`, c: C.purple },
                { l: "Vélocité requise", v: `${d.projection.requiredVelocity} pts/mois`, c: C.orange },
                { l: "Fin estimée", v: d.projection.estimatedEnd, c: C.red },
                { l: "Cible ouverture", v: d.projection.target, c: C.green },
              ].map((p, i) => (
                <div key={i}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: p.c }}>{p.v}</div>
                  <div style={{ fontSize: 10, color: C.gray500, marginTop: 2 }}>{p.l}</div>
                </div>
              ))}
            </div>
            <div style={{ background: C.redBg, borderRadius: 8, padding: "12px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 14, color: C.red, fontWeight: 700 }}>⚠️ Retard projeté : ~{d.projection.daysLate} jours</div>
              <div style={{ fontSize: 12, color: C.navy, marginTop: 4 }}>La vélocité doit passer de {d.projection.velocity} à {d.projection.requiredVelocity} pts/mois pour respecter l'ouverture Q4 2026. Cela nécessite le déblocage immédiat du budget et le lancement des axes TECH et EXP.</div>
            </div>
          </Card>
        </Sec>

        {/* PROPH3T */}
        <Sec title="Analyse PROPH3T — Intelligence Artificielle" icon="🤖" accent={C.purple}>
          <Card style={{ background: `linear-gradient(135deg, ${C.blueBg} 0%, ${C.purpleBg} 100%)`, border: `1px solid ${C.blue}` }}>
            <div style={{ fontSize: 13, lineHeight: 1.7, color: C.navy, marginBottom: 12 }}>
              <strong>Synthèse IA :</strong> Le projet Cosmos Angré affiche un avancement de 8% à M+5, en-deçà de la trajectoire cible (12%). Deux axes critiques (TECH et EXP) restent à 0%, créant un risque d'effet falaise au S2 2026. Le budget non engagé constitue le verrou principal. La concentration de 5 jalons sur mars nécessite une accélération significative dès février. À vélocité constante, l'ouverture glisserait à décembre 2026.
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.purple, marginBottom: 8 }}>Recommandations prioritaires :</div>
            {[
              "Débloquer la validation budget immédiatement — chaque semaine de retard repousse l'ouverture de 3 jours",
              "Lancer un appel d'offres IT express (fast-track) — l'axe TECH est le chemin critique du projet",
              "Anticiper les recrutements clés (Directeur Centre, Responsable Technique) — délai moyen de recrutement = 3 mois en CI",
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 12, color: C.navy }}>
                <span style={{ color: C.purple, fontWeight: 700 }}>{i + 1}.</span>
                <span>{r}</span>
              </div>
            ))}
            <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center", fontSize: 11 }}>
              <span style={{ background: C.purple, color: C.white, padding: "3px 10px", borderRadius: 12 }}>Confiance : 74%</span>
              <span style={{ color: C.gray500 }}>Analyse générée le {d.generated}</span>
              <button style={{ marginLeft: "auto", background: C.purple, color: C.white, border: "none", padding: "4px 14px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>🔄 Rafraîchir</button>
            </div>
          </Card>
        </Sec>

        {/* Notes COPIL */}
        <Sec title="Notes & Commentaires COPIL" icon="📝">
          <Card>
            <textarea placeholder="Saisissez les notes et décisions du COPIL..." style={{ width: "100%", minHeight: 100, border: `1px solid ${C.gray200}`, borderRadius: 8, padding: 12, fontSize: 13, fontFamily: "inherit", resize: "vertical", color: C.navy }} />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <button style={{ background: C.navy, color: C.white, border: "none", padding: "8px 20px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>💾 Enregistrer</button>
            </div>
          </Card>
        </Sec>

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "20px 0", borderTop: `2px solid ${C.navy}`, marginTop: 16 }}>
          <div style={{ fontSize: 12, color: C.navy, fontWeight: 600 }}>COCKPIT v2.0 — Système de Pilotage Mobilisation</div>
          <div style={{ fontSize: 11, color: C.gray500, marginTop: 4 }}>Généré le {d.generated} — CRMC / New Heaven SA — Cosmos Angré</div>
          <div style={{ fontSize: 10, color: C.gray400, marginTop: 4 }}>Document confidentiel — Diffusion restreinte COPIL & Direction Générale</div>
        </div>
      </div>
    </div>
  );
}

export default MonthlyReport;
