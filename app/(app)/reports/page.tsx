"use client";
import { useEffect, useState } from "react";
import { supabase, usd } from "@/lib/supabase"; import { Stat, inputCls } from "@/components/ui";
const ymd = (d: Date) => d.toLocaleDateString("en-CA");
function range(p: string, from: string, to: string): [string, string] {
  const t = new Date(), today = ymd(t);
  if (p === "today") return [today, today];
  if (p === "week") { const s = new Date(t); s.setDate(t.getDate() - ((t.getDay() + 6) % 7)); return [ymd(s), today]; }
  if (p === "month") return [today.slice(0, 8) + "01", today];
  if (p === "custom") return [from || "0000-01-01", to || "9999-12-31"];
  return ["0000-01-01", "9999-12-31"];
}
type G = [string, { work: number; earn: number; nick: number }][];
const Sec = ({ title, data }: { title: string; data: G }) => (
  <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="mb-3 font-semibold">{title}</h2>
    {data.length === 0 ? <p className="text-sm text-slate-500">No work in this period.</p> : data.map(([k, v]) => (
      <div key={k} className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 py-2 text-sm first:border-0">
        <span className="min-w-0 truncate">{k}</span>
        <span className="flex gap-4"><span>{usd(v.work)}</span><b className="text-emerald-600">{usd(v.earn)}</b>{v.nick > 0 && <span className="text-indigo-600">Nick {usd(v.nick)}</span>}</span></div>))}
  </section>);
export default function Reports() {
  const [rows, setRows] = useState<any[] | null>(null), [accs, setAccs] = useState<any[]>([]), [p, setP] = useState("month"), [from, setFrom] = useState(""), [to, setTo] = useState("");
  useEffect(() => {
    supabase.from("work_records").select("work_date, amount_usd, accounts(id,email,rate,people(id,name))").then(r => setRows(r.data ?? []));
    supabase.from("account_totals").select("status,issue").then(r => setAccs(r.data ?? [])); }, []);
  if (!rows) return <p className="text-slate-500">Loading…</p>;
  const [a, b] = range(p, from, to), list = rows.filter(r => r.work_date >= a && r.work_date <= b);
  const group = (key: (r: any) => string): G => {
    const m: Record<string, { work: number; earn: number; nick: number }> = {};
    list.forEach(r => { const k = key(r), amt = Number(r.amount_usd), rate = Number(r.accounts.rate);
      m[k] ??= { work: 0, earn: 0, nick: 0 }; m[k].work += amt; m[k].earn += amt * rate; if (Math.abs(rate - 0.1) < 0.001) m[k].nick += amt * 0.05; });
    return Object.entries(m).sort((x, y) => y[1].work - x[1].work); };
  const t = group(() => "all")[0]?.[1] ?? { work: 0, earn: 0, nick: 0 };
  const periods = [["today", "Today"], ["week", "This week"], ["month", "This month"], ["all", "All time"], ["custom", "Custom"]];
  return (<div className="space-y-6"><h1 className="text-2xl font-semibold">Reports</h1>
    <div className="flex flex-wrap items-center gap-2">{periods.map(([k, l]) => <button key={k} onClick={() => setP(k)} className={`rounded-full px-4 py-2 text-sm ${p === k ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600"}`}>{l}</button>)}
      {p === "custom" && <><input type="date" value={from} onChange={e => setFrom(e.target.value)} className={inputCls + " !w-auto"} /><input type="date" value={to} onChange={e => setTo(e.target.value)} className={inputCls + " !w-auto"} /></>}</div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Stat label="Total work" value={usd(t.work)} /><Stat label="Total earnings" value={usd(t.earn)} accent /><Stat label="Nick's share (5% of 10% accounts)" value={usd(t.nick)} accent /><Stat label="Work records" value={list.length} /></div>
    <div className="grid grid-cols-3 gap-3"><Stat label="Accounts" value={accs.length} /><Stat label="Active" value={accs.filter(x => x.status === "Active").length} /><Stat label="With issues" value={accs.filter(x => x.issue !== "No Issue").length} /></div>
    <div className="grid gap-6 lg:grid-cols-2">
      <Sec title="By person" data={group(r => r.accounts.people.name)} />
      <Sec title="By rate" data={group(r => `${Math.round(Number(r.accounts.rate) * 100)}% accounts`)} />
      <Sec title="By account" data={group(r => `${r.accounts.people.name} · ${r.accounts.email}`)} />
    </div></div>);
}