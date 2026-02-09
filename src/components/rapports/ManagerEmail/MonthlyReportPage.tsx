/**
 * MonthlyReportPage — Rapport d'Actions Mensuel
 * Design unifié avec le design system COSMOS (constantes C)
 */

import { useState } from "react";
import { C } from '@/components/rapports/ExcoMensuelV5/constants';

// ============================================================================
// DATA (statique pour ce rapport — sera remplacé par hooks live ultérieurement)
// ============================================================================

const d = {
  month: "Février 2026",
  generated: "9 février 2026 à 19:29",
  daysInMonth: 28, daysPassed: 9, daysRemaining: 19,
  actions: [
    { id: 1, title: "Finaliser et faire valider la note de cadrage", axe: "DIV", axeColor: C.teal, owner: "Pamela ATOKOUNA", ownerInit: "PA", deadline: "9 févr.", deadlineDay: 9, pct: 85, status: "late" as const, priority: "critical" as const, milestone: "Note de cadrage validée", blocker: "En attente signature DG depuis le 5 févr.", dependencies: [] as number[] },
    { id: 2, title: "Lancer l'étude de marché concurrentiel", axe: "MKT", axeColor: C.purple, owner: "Yvan Guehi", ownerInit: "YG", deadline: "10 févr.", deadlineDay: 10, pct: 60, status: "late" as const, priority: "high" as const, milestone: null, blocker: "Données terrain partielles — analyse en cours", dependencies: [] as number[] },
    { id: 3, title: "Valider la stratégie marketing globale", axe: "MKT", axeColor: C.purple, owner: "Pamela ATOKOUNA", ownerInit: "PA", deadline: "15 févr.", deadlineDay: 15, pct: 0, status: "blocked" as const, priority: "critical" as const, milestone: "Phase 1 : Planification stratégique", blocker: "Bloqué par étude de marché (#2)", dependencies: [2] },
    { id: 4, title: "Présenter et valider le budget mobilisation DG", axe: "BUD", axeColor: C.green, owner: "Deborah NTUMY", ownerInit: "DN", deadline: "16 févr.", deadlineDay: 16, pct: 50, status: "inprogress" as const, priority: "critical" as const, milestone: "Budget mobilisation validé", blocker: null, dependencies: [] as number[] },
    { id: 5, title: "Définir l'organigramme cible du centre", axe: "RH", axeColor: C.blue, owner: "Pamela ATOKOUNA", ownerInit: "PA", deadline: "28 févr.", deadlineDay: 28, pct: 15, status: "inprogress" as const, priority: "high" as const, milestone: null, blocker: null, dependencies: [] as number[] },
    { id: 6, title: "Mettre à jour le plan de commercialisation", axe: "COM", axeColor: C.orange, owner: "Deborah NTUMY", ownerInit: "DN", deadline: "20 févr.", deadlineDay: 20, pct: 40, status: "inprogress" as const, priority: "medium" as const, milestone: null, blocker: null, dependencies: [] as number[] },
    { id: 7, title: "Suivre les négociations preneurs en cours", axe: "COM", axeColor: C.orange, owner: "Deborah NTUMY", ownerInit: "DN", deadline: "28 févr.", deadlineDay: 28, pct: 25, status: "inprogress" as const, priority: "high" as const, milestone: null, blocker: "3 LOI en attente retour preneurs", dependencies: [] as number[] },
    { id: 8, title: "Établir le cahier des charges IT & systèmes", axe: "TECH", axeColor: C.red, owner: "Deborah NTUMY", ownerInit: "DN", deadline: "28 févr.", deadlineDay: 28, pct: 0, status: "notstarted" as const, priority: "critical" as const, milestone: null, blocker: "Aucun prestataire IT identifié", dependencies: [] as number[] },
    { id: 9, title: "Rédiger le modèle de bail type OHADA", axe: "JUR", axeColor: C.blue, owner: "Pamela ATOKOUNA", ownerInit: "PA", deadline: "28 févr.", deadlineDay: 28, pct: 20, status: "inprogress" as const, priority: "medium" as const, milestone: null, blocker: null, dependencies: [] as number[] },
    { id: 10, title: "Définir l'identité de marque Cosmos Angré", axe: "MKT", axeColor: C.purple, owner: "Yvan Guehi", ownerInit: "YG", deadline: "28 févr.", deadlineDay: 28, pct: 10, status: "inprogress" as const, priority: "medium" as const, milestone: null, blocker: null, dependencies: [3] },
    { id: 11, title: "Mettre en place le suivi budgétaire", axe: "BUD", axeColor: C.green, owner: "Pamela ATOKOUNA", ownerInit: "PA", deadline: "25 févr.", deadlineDay: 25, pct: 30, status: "inprogress" as const, priority: "medium" as const, milestone: null, blocker: null, dependencies: [4] },
    { id: 12, title: "Souscrire les polices d'assurance", axe: "DIV", axeColor: C.teal, owner: "Pamela ATOKOUNA", ownerInit: "PA", deadline: "28 févr.", deadlineDay: 28, pct: 10, status: "inprogress" as const, priority: "medium" as const, milestone: null, blocker: null, dependencies: [] as number[] },
  ],
  milestones: [
    { name: "Note de cadrage validée", axe: "DIV", owner: "Pamela ATOKOUNA", date: "9 févr.", day: 9, status: "late" as const, actionIds: [1] },
    { name: "Phase 1 : Planification stratégique", axe: "MKT", owner: "Yvan Guehi", date: "15 févr.", day: 15, status: "atrisk" as const, actionIds: [2, 3] },
    { name: "Budget mobilisation validé", axe: "BUD", owner: "Pamela ATOKOUNA", date: "20 févr.", day: 20, status: "ontrack" as const, actionIds: [4] },
  ],
};

const owners = [...new Set(d.actions.map(a => a.owner))];
const axeCodes = [...new Set(d.actions.map(a => a.axe))];

// ============================================================================
// MICRO-COMPOSANTS
// ============================================================================

function PB({ pct, h = 6, color = C.blue }: { pct: number; h?: number; color?: string }) {
  return (
    <div style={{ background: C.gray200, borderRadius: h, height: h, width: "100%", overflow: "hidden" }}>
      <div style={{ background: color, height: "100%", width: `${Math.min(pct, 100)}%`, borderRadius: h }} />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const m: Record<string, { c: string; bg: string; l: string }> = {
    completed: { c: C.green, bg: C.greenBg, l: "✅ Terminé" },
    inprogress: { c: C.blue, bg: C.blueBg, l: "En cours" },
    late: { c: C.red, bg: C.redBg, l: "🔴 En retard" },
    notstarted: { c: C.gray500, bg: C.gray100, l: "Non démarré" },
    blocked: { c: C.pink, bg: C.pinkBg, l: "🚫 Bloqué" },
    ontrack: { c: C.green, bg: C.greenBg, l: "🟢 On track" },
    atrisk: { c: C.orange, bg: C.orangeBg, l: "🟡 À risque" },
  };
  const s = m[status] || m.inprogress;
  return <span style={{ fontSize: 10, fontWeight: 600, color: s.c, background: s.bg, padding: "3px 8px", borderRadius: 10, whiteSpace: "nowrap" }}>{s.l}</span>;
}

function PriorityTag({ p }: { p: string }) {
  const m: Record<string, { c: string; l: string }> = {
    critical: { c: C.red, l: "URGENT" },
    high: { c: C.orange, l: "ÉLEVÉ" },
    medium: { c: C.blue, l: "MOYEN" },
    low: { c: C.gray500, l: "FAIBLE" },
  };
  const s = m[p] || m.medium;
  return <span style={{ fontSize: 8, fontWeight: 700, color: C.white, background: s.c, padding: "2px 6px", borderRadius: 3, letterSpacing: 0.5 }}>{s.l}</span>;
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.white, borderRadius: 10, padding: 16, border: `1px solid ${C.gray200}`, ...style }}>{children}</div>
  );
}

function Sec({ title, icon, children, accent = C.navy, right = null }: { title: string; icon: string; children: React.ReactNode; accent?: string; right?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingBottom: 8, borderBottom: `2px solid ${accent}` }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: accent, textTransform: "uppercase" as const, letterSpacing: 0.5, flex: 1 }}>{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );
}

interface ActionData {
  id: number;
  title: string;
  axe: string;
  axeColor: string;
  owner: string;
  ownerInit: string;
  deadline: string;
  deadlineDay: number;
  pct: number;
  status: string;
  priority: string;
  milestone: string | null;
  blocker: string | null;
  dependencies: number[];
}

function ActionRow({ a, isLast, showOwner }: { a: ActionData; isLast: boolean; showOwner: boolean }) {
  const deadlinePassed = a.deadlineDay <= 9;
  const deadlineSoon = a.deadlineDay <= 15 && !deadlinePassed;

  return (
    <Card style={{ marginBottom: isLast ? 0 : 6, borderLeft: `4px solid ${a.axeColor}`, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
            <PriorityTag p={a.priority} />
            <span style={{ fontSize: 9, fontWeight: 600, color: a.axeColor, background: a.axeColor + "15", padding: "2px 6px", borderRadius: 4 }}>{a.axe}</span>
            {a.milestone && <span style={{ fontSize: 9, color: C.orange, background: C.orangeBg, padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>🎯 {a.milestone}</span>}
            <StatusBadge status={a.status} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: a.status === "late" ? C.red : C.navy, marginBottom: 6 }}>{a.title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: a.blocker ? 6 : 0 }}>
            {showOwner && <span style={{ fontSize: 11, color: C.gray500 }}>👤 {a.owner}</span>}
            <span style={{ fontSize: 11, color: deadlinePassed ? C.red : deadlineSoon ? C.orange : C.gray500, fontWeight: deadlinePassed ? 700 : 400 }}>
              📅 {a.deadline} {deadlinePassed && a.status !== "completed" && "(dépassé)"}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, maxWidth: 160 }}>
              <PB pct={a.pct} h={5} color={a.status === "late" ? C.red : a.pct === 0 ? C.gray300 : C.blue} />
              <span style={{ fontSize: 11, fontWeight: 600, color: C.navy, minWidth: 30 }}>{a.pct}%</span>
            </div>
          </div>
          {a.blocker && (
            <div style={{ fontSize: 11, color: C.pink, background: C.pinkBg, padding: "4px 8px", borderRadius: 6, marginTop: 4 }}>
              🚫 {a.blocker}
            </div>
          )}
          {a.dependencies.length > 0 && (
            <div style={{ fontSize: 10, color: C.gray500, marginTop: 3 }}>
              🔗 Dépend de : #{a.dependencies.join(", #")}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function MonthlyReportPage() {
  const [filterAxe, setFilterAxe] = useState("Tous");
  const [filterOwner, setFilterOwner] = useState("Tous");
  const [view, setView] = useState("priority");

  const filtered = d.actions.filter(a => {
    if (filterAxe !== "Tous" && a.axe !== filterAxe) return false;
    if (filterOwner !== "Tous" && a.owner !== filterOwner) return false;
    return true;
  });

  const sortByPriority = (a: ActionData, b: ActionData) => {
    const p: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const s: Record<string, number> = { late: 0, blocked: 1, notstarted: 2, inprogress: 3, completed: 4 };
    if ((p[a.priority] ?? 4) !== (p[b.priority] ?? 4)) return (p[a.priority] ?? 4) - (p[b.priority] ?? 4);
    return (s[a.status] ?? 4) - (s[b.status] ?? 4);
  };

  const sortByDeadline = (a: ActionData, b: ActionData) => a.deadlineDay - b.deadlineDay;
  const sortByOwner = (a: ActionData, b: ActionData) => a.owner.localeCompare(b.owner) || a.deadlineDay - b.deadlineDay;

  const sorted = [...filtered].sort(view === "priority" ? sortByPriority : view === "deadline" ? sortByDeadline : sortByOwner);

  const stats = {
    total: filtered.length,
    late: filtered.filter(a => a.status === "late").length,
    blocked: filtered.filter(a => a.status === "blocked").length,
    inprogress: filtered.filter(a => a.status === "inprogress").length,
    notstarted: filtered.filter(a => a.status === "notstarted").length,
    completed: filtered.filter(a => a.status === "completed").length,
    withBlocker: filtered.filter(a => a.blocker).length,
  };

  const pctMonth = Math.round((d.daysPassed / d.daysInMonth) * 100);
  const urgentThisWeek = filtered.filter(a => a.deadlineDay <= 15 && a.status !== "completed");

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: C.offWhite, minHeight: "100vh", color: C.navy }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyMid} 100%)`, color: C.white, padding: "22px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 3, opacity: 0.5, marginBottom: 4 }}>COCKPIT — Cosmos Angré</div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Rapport d'Actions</h1>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>{d.month}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, opacity: 0.5 }}>CRMC / New Heaven SA</div>
            <div style={{ marginTop: 8, background: "rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 14px" }}>
              <div style={{ fontSize: 10, opacity: 0.7 }}>Mois écoulé à</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <div style={{ flex: 1, background: "rgba(255,255,255,0.2)", borderRadius: 4, height: 6, width: 80 }}>
                  <div style={{ background: C.white, height: "100%", width: `${pctMonth}%`, borderRadius: 4 }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{pctMonth}%</span>
              </div>
              <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>{d.daysRemaining} jours restants</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 28px", maxWidth: 920, margin: "0 auto" }}>

        {/* Filtres */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <select value={filterAxe} onChange={e => setFilterAxe(e.target.value)} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.gray300}`, fontSize: 12, background: C.white }}>
            <option value="Tous">Tous les axes</option>
            {axeCodes.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={filterOwner} onChange={e => setFilterOwner(e.target.value)} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.gray300}`, fontSize: 12, background: C.white }}>
            <option value="Tous">Tous les responsables</option>
            {owners.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
            {([["priority", "Par priorité"], ["deadline", "Par échéance"], ["owner", "Par responsable"]] as const).map(([v, l]) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${C.gray300}`, fontSize: 11, background: view === v ? C.navy : C.white, color: view === v ? C.white : C.navy, cursor: "pointer", fontWeight: view === v ? 600 : 400 }}>{l}</button>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { v: stats.total, l: "Actions", c: C.navy, bg: C.gray100 },
            { v: stats.late, l: "En retard", c: C.red, bg: C.redBg },
            { v: stats.blocked, l: "Bloquées", c: C.pink, bg: C.pinkBg },
            { v: stats.inprogress, l: "En cours", c: C.blue, bg: C.blueBg },
            { v: stats.notstarted, l: "Non démarrées", c: C.gray500, bg: C.gray100 },
            { v: stats.completed, l: "Terminées", c: C.green, bg: C.greenBg },
          ].map((k, i) => (
            <div key={i} style={{ background: k.bg, borderRadius: 8, padding: "10px 8px", textAlign: "center", border: `1px solid ${k.c}15` }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.c }}>{k.v}</div>
              <div style={{ fontSize: 10, color: k.c, opacity: 0.8 }}>{k.l}</div>
            </div>
          ))}
        </div>

        {/* Alertes urgentes */}
        {(stats.late > 0 || stats.blocked > 0) && (
          <div style={{ background: C.redBg, border: `1px solid ${C.red}40`, borderRadius: 10, padding: 14, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.red, marginBottom: 8 }}>⚠️ Actions nécessitant une intervention immédiate</div>
            {filtered.filter(a => a.status === "late" || a.status === "blocked").map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < stats.late + stats.blocked - 1 ? `1px solid ${C.red}15` : "none" }}>
                <StatusBadge status={a.status} />
                <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{a.title}</span>
                <span style={{ fontSize: 10, color: C.gray500 }}>{a.owner}</span>
                <span style={{ fontSize: 10, color: C.red, fontWeight: 600 }}>{a.deadline}</span>
              </div>
            ))}
          </div>
        )}

        {/* Jalons du mois */}
        <Sec title="Jalons du mois" icon="🎯" right={<span style={{ fontSize: 11, fontWeight: 600, color: C.gray500 }}>{d.milestones.length} jalons</span>}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {d.milestones.map((m, i) => {
              const bc: Record<string, string> = { late: C.red, atrisk: C.orange, ontrack: C.green };
              return (
                <Card key={i} style={{ borderTop: `3px solid ${bc[m.status]}`, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: C.white, background: bc[m.status], padding: "2px 8px", borderRadius: 4 }}>{m.axe}</span>
                    <StatusBadge status={m.status} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 6 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: C.gray500 }}>👤 {m.owner}</div>
                  <div style={{ fontSize: 11, color: C.gray500 }}>📅 {m.date}</div>
                  <div style={{ marginTop: 8, fontSize: 10, color: C.gray500 }}>
                    Actions requises :
                    {m.actionIds.map(id => {
                      const ac = d.actions.find(a => a.id === id);
                      return ac ? (
                        <div key={id} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                          <div style={{ width: 40 }}><PB pct={ac.pct} h={4} color={ac.pct === 0 ? C.gray300 : ac.status === "late" ? C.red : C.blue} /></div>
                          <span style={{ fontSize: 10 }}>{ac.pct}% — {ac.title.substring(0, 35)}...</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        </Sec>

        {/* Liste des actions */}
        <Sec title={`Actions du mois — ${filtered.length} actions`} icon="📋" right={
          <span style={{ fontSize: 10, color: C.gray500 }}>Trié par {view === "priority" ? "priorité" : view === "deadline" ? "échéance" : "responsable"}</span>
        }>
          {view === "owner" && owners.map(owner => {
            const ownerActions = sorted.filter(a => a.owner === owner);
            if (ownerActions.length === 0) return null;
            if (filterOwner !== "Tous" && filterOwner !== owner) return null;
            return (
              <div key={owner} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.navy, color: C.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>
                    {owner.split(" ").map(n => n[0]).join("")}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{owner}</span>
                  <span style={{ fontSize: 11, color: C.gray500 }}>- {ownerActions.length} actions</span>
                </div>
                {ownerActions.map((a, i) => (
                  <ActionRow key={a.id} a={a} isLast={i === ownerActions.length - 1} showOwner={false} />
                ))}
              </div>
            );
          })}
          {view !== "owner" && sorted.map((a, i) => (
            <ActionRow key={a.id} a={a} isLast={i === sorted.length - 1} showOwner={true} />
          ))}
        </Sec>

        {/* Blocages actifs */}
        {stats.withBlocker > 0 && (
          <Sec title="Points de blocage actifs" icon="🚧" accent={C.pink}>
            <Card>
              {filtered.filter(a => a.blocker).map((a, i, arr) => (
                <div key={a.id} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.gray100}` : "none" }}>
                  <div style={{ minWidth: 4, borderRadius: 2, background: a.priority === "critical" ? C.red : C.orange }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: C.pink, fontWeight: 500 }}>🚫 {a.blocker}</div>
                    <div style={{ fontSize: 11, color: C.gray500, marginTop: 3 }}>
                      👤 {a.owner} &nbsp;•&nbsp; 📅 {a.deadline} &nbsp;•&nbsp; <span style={{ background: a.axeColor + "20", color: a.axeColor, padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{a.axe}</span>
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          </Sec>
        )}

        {/* Charge par responsable */}
        <Sec title="Charge par Responsable" icon="👥">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {owners.map(owner => {
              const oa = d.actions.filter(a => a.owner === owner);
              const om = d.milestones.filter(m => m.owner === owner);
              const late = oa.filter(a => a.status === "late" || a.status === "blocked").length;
              const load = oa.length >= 5 ? "Charge élevée" : oa.length >= 3 ? "Charge moyenne" : "Charge légère";
              const loadColor = oa.length >= 5 ? C.red : oa.length >= 3 ? C.orange : C.green;
              return (
                <Card key={owner}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.navy, color: C.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                      {owner.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{owner}</div>
                      <div style={{ fontSize: 10, color: loadColor, fontWeight: 600 }}>{load}</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, fontSize: 11, textAlign: "center" }}>
                    <div style={{ background: C.gray100, borderRadius: 6, padding: "6px 4px" }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.navy }}>{oa.length}</div>
                      <div style={{ fontSize: 9, color: C.gray500 }}>Actions</div>
                    </div>
                    <div style={{ background: late > 0 ? C.redBg : C.greenBg, borderRadius: 6, padding: "6px 4px" }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: late > 0 ? C.red : C.green }}>{late}</div>
                      <div style={{ fontSize: 9, color: C.gray500 }}>Retard</div>
                    </div>
                    <div style={{ background: C.blueBg, borderRadius: 6, padding: "6px 4px" }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.blue }}>{om.length}</div>
                      <div style={{ fontSize: 9, color: C.gray500 }}>Jalons</div>
                    </div>
                    <div style={{ background: C.gray100, borderRadius: 6, padding: "6px 4px" }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.gray500 }}>{Math.round(oa.reduce((s, a) => s + a.pct, 0) / (oa.length || 1))}%</div>
                      <div style={{ fontSize: 9, color: C.gray500 }}>Moy.</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 10, borderTop: `1px solid ${C.gray100}`, paddingTop: 8 }}>
                    {oa.map((a) => (
                      <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0", fontSize: 11 }}>
                        <PriorityTag p={a.priority} />
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: a.status === "late" ? C.red : C.navy }}>{a.title}</span>
                        <span style={{ fontSize: 10, color: C.gray500, whiteSpace: "nowrap" }}>{a.deadline}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </Sec>

        {/* Semaine en focus */}
        <Sec title="Focus cette semaine (S7 : 9-15 févr.)" icon="🔥" accent={C.red}>
          <Card style={{ background: C.orangeBg, border: `1px solid ${C.orange}30` }}>
            <div style={{ fontSize: 12, color: C.navyLight, lineHeight: 1.7 }}>
              <strong>Échéances immédiates :</strong>
            </div>
            {urgentThisWeek.sort((a, b) => a.deadlineDay - b.deadlineDay).map((a, i) => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: i < urgentThisWeek.length - 1 ? `1px solid ${C.orange}20` : "none" }}>
                <PriorityTag p={a.priority} />
                <span style={{ fontSize: 12, fontWeight: 600, flex: 1, color: a.status === "late" ? C.red : C.navy }}>{a.title}</span>
                <span style={{ fontSize: 11, color: C.gray500 }}>👤 {a.owner.split(" ")[1]}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: a.deadlineDay <= d.daysPassed ? C.red : C.orange }}>{a.deadline}</span>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </Card>
        </Sec>

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "16px 0", borderTop: `2px solid ${C.navy}`, marginTop: 8 }}>
          <div style={{ fontSize: 11, color: C.gray500 }}>COCKPIT v2.0 — Rapport généré le {d.generated}</div>
          <div style={{ fontSize: 10, color: C.gray400, marginTop: 2 }}>CRMC / New Heaven SA — Cosmos Angré</div>
        </div>
      </div>
    </div>
  );
}

export default MonthlyReportPage;
