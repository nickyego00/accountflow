"use client";
import { useEffect, useState } from "react"; import Link from "next/link";
import { CheckCircle2, AlertTriangle, MinusCircle } from "lucide-react";
import { supabase, usd } from "@/lib/supabase";
export default function Accounts() {
  const [rows, setRows] = useState<any[]|null>(null), [q, setQ] = useState(""), [viewer, setViewer] = useState(true);
  useEffect(()=>{ supabase.rpc("is_viewer").then(r=>setViewer(r.data===true));
    supabase.from("account_holdings").select("*").order("total_work",{ascending:false}).then(r=>setRows(r.data??[])); },[]);
  const all = rows ?? [], match = (r: any) => r.email.toLowerCase().includes(q.toLowerCase());
  const active = all.filter(r=>r.status==="Active"), inactive = all.filter(r=>r.status!=="Active");
  const activeList = active.filter(match), inactiveList = inactive.filter(match);
  const withIssue = inactive.filter(r=>r.issue!=="No Issue").length;
  const tiles: [string, string|number, boolean][] = [["Accounts",all.length,false],["Active",active.length,false],["Inactive",inactive.length,false],["With issues",withIssue,withIssue>0]];
  const card = (r: any, off: boolean) => { const bad = r.issue!=="No Issue"; return (
    <div className={`flex items-center justify-between gap-4 rounded-2xl border bg-white p-5 shadow-sm ${off&&bad?"border-rose-200 border-l-4 border-l-rose-500":"border-slate-200"}`}>
      <div className="min-w-0"><div className="truncate font-medium">{r.email}</div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {off
            ? <><span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600"><MinusCircle size={12}/>Inactive</span>
                {bad ? <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700"><AlertTriangle size={12}/>{r.issue}</span>
                     : <span className="text-xs text-slate-500">No issue</span>}</>
            : <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700"><CheckCircle2 size={12}/>Active</span>}</div></div>
      <div className="shrink-0 text-right"><div className="text-xs text-slate-500">{off&&bad?"Held":"Holding"}</div><div className={`text-xl font-semibold ${off&&bad?"text-rose-600":""}`}>{usd(Number(r.total_work))}</div></div></div>); };
  const wrap = (r: any, off: boolean) => viewer ? <div key={r.id}>{card(r,off)}</div> : <Link key={r.id} href={`/accounts/${r.id}`} className="block">{card(r,off)}</Link>;
  return (<div className="space-y-6"><h1 className="text-2xl font-semibold">Accounts</h1>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{tiles.map(([l,v,red])=><div key={l} className={`rounded-2xl border bg-white p-4 shadow-sm ${red?"border-rose-200":"border-slate-200"}`}><div className="text-sm text-slate-500">{l}</div><div className={`mt-1 text-2xl font-semibold ${red?"text-rose-600":""}`}>{v}</div></div>)}</div>
    <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by email" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"/>
    {!rows ? <p className="text-slate-500">Loading…</p> : <>
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Active accounts</h2><span className="text-sm text-slate-500">{activeList.length}</span></div>
      {activeList.length===0 ? <p className="text-slate-500">No active accounts found.</p> : <div className="space-y-3">{activeList.map(r=>wrap(r,false))}</div>}
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-700">Inactive accounts</h2><span className="text-sm text-slate-500">{inactiveList.length}</span></div>
      {inactiveList.length===0 ? <p className="text-slate-500">No inactive accounts found.</p> : <div className="space-y-3">{inactiveList.map(r=>wrap(r,true))}</div>}</>}
  </div>);
}