/**
 * MonthlyReportPage — Rapport d'Actions Mensuel
 * Design unifié avec le design system COSMOS (constantes C)
 * Données 100% live depuis la base de données Dexie
 */

import { useState, useRef, useCallback, useMemo } from "react";
import { C, AXES_V5 } from '@/components/rapports/ExcoMensuelV5/constants';
import { SendReportModal } from '@/components/rapports/ExcoMensuelV5/SendReportModal';
import { useActions } from '@/hooks/useActions';
import { useJalons } from '@/hooks/useJalons';
import { useUsers, getUserFullName } from '@/hooks/useUsers';
import type { Action, Jalon } from '@/types';

// ============================================================================
// HELPERS
// ============================================================================

const MONTHS_FR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

/** Map axe dbCode → AXES_V5 entry */
const axeMap = Object.fromEntries(AXES_V5.map(a => [a.dbCode, a]));

/** Map DB statut → display status */
function mapActionStatus(a: Action, today: string): string {
  if (a.statut === 'termine') return 'completed';
  if (a.statut === 'bloque') return 'blocked';
  if (a.statut === 'annule') return 'completed'; // treat as done
  if (a.statut === 'a_planifier' || a.statut === 'planifie') {
    if (a.date_fin_prevue && a.date_fin_prevue < today) return 'late';
    return 'notstarted';
  }
  // en_cours, en_attente, en_validation, a_faire, reporte
  if (a.date_fin_prevue && a.date_fin_prevue < today && a.avancement < 100) return 'late';
  return 'inprogress';
}

/** Map DB priorite → display priority */
function mapPriority(p: string | undefined): string {
  const m: Record<string, string> = { critique: 'critical', haute: 'high', moyenne: 'medium', basse: 'low' };
  return m[p ?? ''] ?? 'medium';
}

/** Map Jalon statut → display status */
function mapJalonStatus(j: Jalon, today: string): string {
  if (j.statut === 'atteint') return 'completed';
  if (j.statut === 'depasse' || j.statut === 'en_danger') return 'late';
  if (j.statut === 'en_approche') return 'atrisk';
  // a_venir — check if date is past
  if (j.date_prevue && j.date_prevue < today) return 'late';
  return 'ontrack';
}

/** Format ISO date → "9 févr." */
function fmtShort(iso: string | undefined): string {
  if (!iso) return '—';
  const dt = new Date(iso + 'T00:00:00');
  if (isNaN(dt.getTime())) return '—';
  const day = dt.getDate();
  const monthNames = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
  return `${day} ${monthNames[dt.getMonth()]}`;
}

/** Get day-of-month from ISO date */
function dayOf(iso: string | undefined): number {
  if (!iso) return 31;
  const dt = new Date(iso + 'T00:00:00');
  return isNaN(dt.getTime()) ? 31 : dt.getDate();
}

/** Get owner initials */
function initials(name: string): string {
  return name.split(' ').map(n => n[0] || '').join('').toUpperCase().slice(0, 2);
}

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
  const deadlinePassed = a.deadlineDay <= new Date().getDate();
  const deadlineSoon = a.deadlineDay <= new Date().getDate() + 7 && !deadlinePassed;

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
  const reportRef = useRef<HTMLDivElement>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const presentationDate = new Date().toISOString().split('T')[0];

  // Live data from DB
  const allActions = useActions();
  const allJalons = useJalons();
  const users = useUsers();

  const d = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.toISOString().split('T')[0];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysPassed = now.getDate();
    const daysRemaining = daysInMonth - daysPassed;
    const monthLabel = `${MONTHS_FR[month].charAt(0).toUpperCase() + MONTHS_FR[month].slice(1)} ${year}`;
    const generated = `${daysPassed} ${MONTHS_FR[month]} ${year} à ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

    const usersById = Object.fromEntries(users.map(u => [u.id, u]));
    const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    // Filter ALL actions (not just current month - include active ones too)
    const activeActions = (allActions ?? []).filter(a => {
      if (a.statut === 'annule') return false;
      // Include if deadline is in current month
      if (a.date_fin_prevue && a.date_fin_prevue >= monthStart && a.date_fin_prevue <= monthEnd) return true;
      // Include if active (not done) and deadline has passed (late)
      if (a.statut !== 'termine' && a.date_fin_prevue && a.date_fin_prevue < monthStart) return true;
      return false;
    });

    const actions = activeActions.map(a => {
      const axeInfo = axeMap[a.axe] || { labelCourt: a.axe, color: C.gray500 };
      const user = a.responsableId ? usersById[a.responsableId] : undefined;
      const ownerName = user ? getUserFullName(user) : (a.responsable || 'Non assigné');
      const status = mapActionStatus(a, today);
      const linkedJalon = a.jalonId ? (allJalons ?? []).find(j => j.id === a.jalonId) : undefined;
      return {
        id: a.id as number,
        title: a.titre,
        axe: axeInfo.labelCourt,
        axeColor: axeInfo.color,
        owner: ownerName,
        ownerInit: initials(ownerName),
        deadline: fmtShort(a.date_fin_prevue),
        deadlineDay: dayOf(a.date_fin_prevue),
        pct: a.avancement ?? 0,
        status,
        priority: mapPriority(a.priorite),
        milestone: linkedJalon ? linkedJalon.titre : null,
        blocker: a.points_blocage || null,
        dependencies: [] as number[],
      };
    });

    // Milestones for current month
    const monthJalons = (allJalons ?? []).filter(j => j.date_prevue && j.date_prevue >= monthStart && j.date_prevue <= monthEnd);
    const milestones = monthJalons.map(j => {
      const axeInfo = axeMap[j.axe] || { labelCourt: j.axe, color: C.gray500 };
      const user = j.responsableId ? usersById[j.responsableId] : undefined;
      const ownerName = user ? getUserFullName(user) : (j.responsable || 'Non assigné');
      const linkedActionIds = activeActions.filter(a => a.jalonId === j.id).map(a => a.id as number);
      return {
        name: j.titre,
        axe: axeInfo.labelCourt,
        owner: ownerName,
        date: fmtShort(j.date_prevue),
        day: dayOf(j.date_prevue),
        status: mapJalonStatus(j, today),
        actionIds: linkedActionIds,
      };
    });

    return { month: monthLabel, generated, daysInMonth, daysPassed, daysRemaining, actions, milestones };
  }, [allActions, allJalons, users]);

  const owners = useMemo(() => [...new Set(d.actions.map(a => a.owner))], [d.actions]);
  const axeCodes = useMemo(() => [...new Set(d.actions.map(a => a.axe))], [d.actions]);

  const generateReportHtml = useCallback(() => {
    if (!reportRef.current) return '';
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Rapport d'Actions - Cosmos Angré - ${d.month}</title>
<style>@import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;500;600;700&display=swap');body{font-family:'Exo 2',Inter,system-ui,sans-serif;margin:0;padding:0;background:#f8f9fa;}
@media print{body{background:#fff;}}</style>
</head><body>${reportRef.current.innerHTML}</body></html>`;
  }, [d.month]);

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
  const urgentThisWeek = filtered.filter(a => a.deadlineDay <= new Date().getDate() + 7 && a.status !== "completed");

  return (
    <div ref={reportRef} style={{ fontFamily: "'Exo 2', Inter, system-ui, sans-serif", background: C.offWhite, minHeight: "100vh", color: C.navy }}>
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
            <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
              <button onClick={() => window.print()} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: C.white, padding: "6px 14px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>PDF</button>
              <button onClick={() => setShowSendModal(true)} style={{ background: C.gold, border: "none", color: C.navy, padding: "6px 14px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontWeight: 700 }}>Envoyer</button>
            </div>
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
        <Sec title={`Focus cette semaine (${new Date().getDate()}-${Math.min(new Date().getDate()+7, d.daysInMonth)} ${MONTHS_FR[new Date().getMonth()].slice(0,4)}.)`} icon="🔥" accent={C.red}>
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

      {/* Send Report Modal */}
      <SendReportModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        presentationDate={presentationDate}
        generateHtml={generateReportHtml}
      />
    </div>
  );
}

export default MonthlyReportPage;
