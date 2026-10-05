"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Wallet, AlertTriangle, FileText } from "lucide-react";
import { supabase, usd } from "@/lib/supabase";
import { Avatar } from "@/components/ui";

const ymd = (d: Date) => d.toLocaleDateString("en-CA");

function startOf(p: string): string {
  const t = new Date();
  if (p === "today") return ymd(t);
  if (p === "week") {
    const s = new Date(t);
    s.setDate(t.getDate() - ((t.getDay() + 6) % 7));
    return ymd(s);
  }
  if (p === "month") return ymd(t).slice(0, 8) + "01";
  return "0000-01-01";
}

const periods = [["all", "All time"], ["today", "Today"], ["week", "This week"], ["month", "This month"]];
const kinds = [["all", "All"], ["paid", "Paid accounts"], ["unpaid", "Not paid"]];

export default function WorkHistory() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [q, setQ] = useState("");
  const [p, setP] = useState("all");
  const [kind, setKind] = useState("all");
  const [shown, setShown] = useState(30);

  useEffect(() => {
    supabase
      .from("work_records")
      .select("*, accounts(id,email,rate,issue,people(id,name,avatar_url))")
      .order("work_date", { ascending: false })
      .order("created_at", { ascending: false })
      .then(r => setRows(r.data ?? []));
  }, []);

  if (!rows) return <p className="text-slate-500">Loading…</p>;

  const from = startOf(p);
  const list = rows.filter(r => {
    const bad = r.accounts.issue !== "No Issue";
    if (r.work_date < from) return false;
    if (kind === "paid" && bad) return false;
    if (kind === "unpaid" && !bad) return false;
    const text = (r.accounts.email + r.accounts.people.name + (r.note ?? "")).toLowerCase();
    return text.includes(q.toLowerCase());
  });

  const sum = (l: any[]) => l.reduce((s, r) => s + Number(r.amount_usd), 0);
  const paidTotal = sum(list.filter(r => r.accounts.issue === "No Issue"));
  const heldTotal = sum(list.filter(r => r.accounts.issue !== "No Issue"));

  const visible = list.slice(0, shown);
  const groups: [string, any[]][] = [];
  visible.forEach(r => {
    const last = groups[groups.length - 1];
    if (last && last[0] === r.work_date) last[1].push(r);
    else groups.push([r.work_date, [r]]);
  });

  const dayLabel = (d: string) =>
    new Date(d + "T00:00").toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  const pick = (fn: () => void) => { fn(); setShown(30); };

  const banner: [string, string, any][] = [
    ["Paid accounts", usd(paidTotal), Wallet],
    ["Not paid (held)", usd(heldTotal), AlertTriangle],
    ["Entries", String(list.length), FileText],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Work history</h1>
        <p className="text-sm text-slate-500">Every work entry across all accounts, newest first.</p>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-blue-600 to-violet-600 p-6 text-white shadow-lg sm:p-8">
        <div className="text-sm text-blue-100">Total recorded</div>
        <div className="mt-1 text-4xl font-semibold sm:text-5xl">{usd(sum(list))}</div>
        <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
          {banner.map(([l, v, Icon]) => (
            <div key={l} className="rounded-2xl bg-white/15 p-3 backdrop-blur">
              <div className="flex items-center gap-1.5 text-xs text-blue-100"><Icon size={13} />{l}</div>
              <div className="mt-1 text-base font-semibold sm:text-lg">{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={e => pick(() => setQ(e.target.value))}
            placeholder="Search by person, email or note"
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {periods.map(([k, l]) => (
            <button
              key={k}
              onClick={() => pick(() => setP(k))}
              className={`rounded-full px-4 py-2 text-sm ${p === k ? "bg-blue-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600"}`}
            >
              {l}
            </button>
          ))}
          <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />
          {kinds.map(([k, l]) => (
            <button
              key={k}
              onClick={() => pick(() => setKind(k))}
              className={`rounded-full px-4 py-2 text-sm ${kind === k ? "bg-slate-900 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No work entries match these filters.
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([date, items]) => (
            <section key={date} className="rise-in">
              <div className="mb-2 flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold text-slate-700">{dayLabel(date)}</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">{usd(sum(items))}</span>
              </div>
              <div className="space-y-3">
                {items.map(r => {
                  const bad = r.accounts.issue !== "No Issue";
                  const adjust = r.note === "Manual adjustment";
                  return (
                    <Link
                      key={r.id}
                      href={`/accounts/${r.accounts.id}`}
                      className={`flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm ${bad ? "border-rose-200 border-l-4 border-l-rose-500" : "border-slate-200"}`}
                    >
                      <Avatar name={r.accounts.people.name} url={r.accounts.people.avatar_url} size={44} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{r.accounts.people.name}</div>
                        <div className="truncate text-xs text-slate-500">{r.accounts.email}</div>
                        {r.note && !adjust && <div className="mt-1 truncate text-xs text-slate-600">{r.note}</div>}
                        {adjust && (
                          <span className="mt-1 inline-block rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">Adjustment</span>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <div className={`text-base font-semibold ${Number(r.amount_usd) < 0 ? "text-rose-600" : ""}`}>{usd(Number(r.amount_usd))}</div>
                        {bad ? (
                          <div className="text-xs font-medium text-rose-600">Not paid · {r.accounts.issue}</div>
                        ) : (
                          <div className="text-xs