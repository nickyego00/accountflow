"use client";
import { useEffect, useState } from "react"; import Link from "next/link";
import { Users, CheckCircle2, MinusCircle, AlertTriangle } from "lucide-react";
import { supabase, usd } from "@/lib/supabase"; import { Stat, StatusBadge, IssueBadge, inputCls } from "@/components/ui";
const ymd = (d: Date) => d.toLocaleDateString("en-CA");
function range(p: string, from: string, to: string): [string, string] {
  const t = new Date(), today = ymd(t);
  if (p === "today") return [today, today];
  if (p === "week") { const s = new Date(t); s.setDate(t.getDate() - ((t.getDay() + 6) % 7)); return [ymd(s), today]; }
  if (p === "month") return [today.slice(0, 8) + "01", today];
  if (p === "custom") return [from || "0000-01-01", to || "9999-12-31"];
  return ["0000-01-01", "9999-12-31"];
}
type G = [string, { work: number; earn: number; href?: string }][];
const Sec = ({ title, data }: { title: string; data: G }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-3 font-semibold">{title}</h2>
    {data.length === 0 ? <p className="text-sm text-slate-500">No work in this period.</p> : data.map(([k, v]) => {
      const inner = <><span className="min-w-0 truncate">{k}</span><span className="flex gap-4"><span>{usd(v.work)}</span><b className="text-emerald-600">{usd(v.earn)}</b></span></>;
      const cls = "flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-2 py-2 text-sm first:border-0";
      return v.href ? <Link key={k} href={v.href} className={`${cls} rounded-lg hover:bg-slate-50`}>{inner}</Link> : <div key={k} className={cls}>{inner}</div>; })}
  </section>);
export default function Reports() {
  const [rows, setRows] = useState<any[] | null>(null), [accs, setAccs] = useState<any[]>([]), [p, setP] = useState("month"), [from, setFrom] = useState(""), [to, setTo] = useState(""), [sel, setSel] = useState<string | null>(null);
  useEffect(() => {
    supabase.from("work_records").select("work_date, amount_usd, accounts(id,email,rate,issue,people(id,name))").then(r => setRows(r.data ?? []));
    supabase.from("account_totals").select("id,email,status,issue,total_work,people(name)").order("total_work", { ascending: false }).then(r => setAccs(r.data ?? [])); }, []);
  if (!rows) return <p className="text-slate-500">Loading…</p>;
  const [a, b] = range(p, from, to), list = rows.filter(r => r.work_date >= a && r.work_date <= b && r.accounts.issue === "No Issue");
  const group = (key: (r: any) => string, href?: (r: any) => string): G => {
    const m: Record<string, { work: number; earn: number; href?: string }> = {};
    list.forEach(r => { const k = key(r), amt = Number(r.amount_usd), rate = Number(r.accounts.rate);
      m[k] ??= { work: 0, earn: 0, href: href?.(r) }; m[k].work += amt; m[k].earn += amt * rate; });
    return Object.entries(m).sort((x, y) => y[1].work - x[1].work); };
  const t = group(() => "all")[0]?.[1] ?? { work: 0, earn: 0 };
  const periods = [["today", "Today"], ["week", "This week"], ["month", "This month"], ["all", "All time"], ["custom", "Custom"]];
  const act = accs.filter(x => x.status === "Active"), off = accs.filter(x => x.status !== "Active"), iss = accs.filter(x => x.issue !== "No Issue");
  const tiles: [string, string, any[], any, string][] = [["all", "Accounts", accs, Users, "text-slate-700"], ["active", "Active accounts", act, CheckCircle2, "text-emerald-600"], ["inactive", "Inactive accounts", off, MinusCircle, "text-slate-500"], ["issues", "With issues", iss, AlertTriangle, "text-rose-600"]];
  const open = tiles.find(x => x[0] === sel);
  return (<div className="space-y-6"><div><h1 className="text-2xl font-semibold">Reports</h1><p className="text-sm text-slate-500">Paid accounts only. Accounts with issues are left out of the money figures.</p></div>
    <div className="flex flex-wrap items-center gap-2">{periods.map(([k, l]) => <button key={k} onClick={() => setP(k)} className={`rounded-full px-4 py-2 text-sm ${p === k ? "bg-blue-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600"}`}>{l}</button>)}
      {p === "custom" && <><input type="date" value={from} onChange={e => setFrom(e.target.value)} className={inputCls + " !w-auto"} /><input type="date" value={to} onChange={e => setTo(e.target.value)} className={inputCls + " !w-auto"} /></>}</div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3"><Stat label="Total work" value={usd(t.work)} /><Stat label="Total earnings" value={usd(t.earn)} accent /><Stat label="Work records" value={list.length} /></div>
    <div><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{tiles.map(([k, l, items, Icon, c]) =>
      <button key={k} onClick={() => setSel(sel === k ? null : k)} className={`rounded-2xl border bg-white p-4 text-left shadow-sm ${sel === k ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"}`}>
        <div className="flex items-center justify-between text-sm text-slate-500">{l}<Icon size={16} className={c} /></div><div className={`mt-1 text-2xl font-semibold ${c}`}>{items.length}</div><div className="mt-1 text-xs text-blue-600">{sel === k ? "Hide list" : "Click to view"}</div></button>)}</div>
      {open && <div key={sel} className="rise-in mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">{open[1]}</h2><button className="text-sm text-slate-500 underline" onClick={() => setSel(null)}>Close</button></div>
        {open[2].length === 0 ? <p className="text-sm text-slate-500">Nothing here.</p> : open[2].map((x: any) =>
          <Link key={x.id} href={`/accounts/${x.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border-t border-slate-100 px-2 py-2.5 text-sm first:border-0 hover:bg-slate-50">
            <div className="min-w-0"><div className="truncate font-medium">{x.email}</div><div className="text-xs text-slate-500">{x.people?.name}</div></div>
            <div className="flex items-center gap-2"><StatusBadge s={x.status} />{x.issue !== "No Issue" && <IssueBadge i={x.issue} />}<b>{usd(Number(x.total_work))}</b></div></Link>)}</div>}</div>
    <div className="grid gap-6 lg:grid-cols-2">
      <Sec title="By person" data={group(r => r.accounts.people.name, r => `/people/${r.accounts.people.id}`)} />
      <Sec title="By account" data={group(r => `${r.accounts.people.name} · ${r.accounts.email}`, r => `/accounts/${r.accounts.id}`)} />
    </div></div>);
}