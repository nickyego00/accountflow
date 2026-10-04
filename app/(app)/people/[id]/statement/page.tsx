"use client";
import { useEffect, useState, use } from "react";
import { supabase, usd } from "@/lib/supabase";
export default function Statement({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params), [month, setMonth] = useState(new Date().toISOString().slice(0, 7)), [p, setP] = useState<any>(null), [rows, setRows] = useState<any[]>([]);
  useEffect(() => { (async () => {
    setP((await supabase.from("people").select("name").eq("id", id).single()).data);
    const last = new Date(+month.slice(0, 4), +month.slice(5, 7), 0).getDate();
    const { data } = await supabase.from("work_records").select("work_date, amount_usd, note, accounts!inner(email, rate, person_id)")
      .eq("accounts.person_id", id).gte("work_date", `${month}-01`).lte("work_date", `${month}-${String(last).padStart(2, "0")}`).order("work_date");
    setRows(data ?? []); })(); }, [id, month]);
  const by: Record<string, { work: number; earn: number; items: any[] }> = {};
  rows.forEach((r: any) => { const k = r.accounts.email; by[k] ??= { work: 0, earn: 0, items: [] }; by[k].work += Number(r.amount_usd); by[k].earn += Number(r.amount_usd) * Number(r.accounts.rate); by[k].items.push(r); });
  const work = Object.values(by).reduce((s, x) => s + x.work, 0), earn = Object.values(by).reduce((s, x) => s + x.earn, 0);
  return (<div className="mx-auto max-w-2xl space-y-6">
    <style>{`@media print{aside,header,.noprint{display:none!important}main{margin:0!important}}`}</style>
    <div className="noprint flex items-center justify-between gap-3"><input type="month" value={month} onChange={e => setMonth(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      <button onClick={() => window.print()} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white">Print / Save as PDF</button></div>
    <div><h1 className="text-2xl font-semibold">Statement: {p?.name}</h1><p className="text-sm text-slate-500">{new Date(month + "-01T00:00").toLocaleDateString(undefined, { month: "long", year: "numeric" })}</p></div>
    {Object.keys(by).length === 0 ? <p className="text-slate-500">No work recorded this month.</p> : Object.entries(by).map(([email, v]) =>
      <section key={email} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="mb-2 flex justify-between"><b className="break-all">{email}</b><span className="text-sm text-emerald-600">{usd(v.earn)} earned</span></div>
        {v.items.map((r: any, i: number) => <div key={i} className="flex justify-between border-t border-slate-100 py-1.5 text-sm"><span>{new Date(r.work_date + "T00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}{r.note ? ` · ${r.note}` : ""}</span><span>{usd(Number(r.amount_usd))}</span></div>)}</section>)}
    <div className="flex justify-between rounded-2xl bg-emerald-50 p-5 text-lg font-semibold"><span>Total work {usd(work)}</span><span className="text-emerald-600">Earnings {usd(earn)}</span></div>
  </div>);
}