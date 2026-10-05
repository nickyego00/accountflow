"use client";
import { useEffect, useState } from "react"; import Link from "next/link";
import { Layers, CheckCircle2, MinusCircle, AlertTriangle, Search } from "lucide-react";
import { supabase, usd } from "@/lib/supabase";
export default function Accounts() {
  const [rows, setRows] = useState<any[]|null>(null), [q, setQ] = useState(""), [sel, setSel] = useState("all"), [viewer, setViewer] = useState(true);
  useEffect(()=>{ supabase.rpc("is_viewer").then(r=>setViewer(r.data===true));
    supabase.from("account_holdings").select("*").order("total_work",{ascending:false}).then(r=>setRows(r.data??[])); },[]);
  if (!rows) return <p className="text-slate-500">Loading…</p>;
  const match = (r: any) => r.email.toLowerCase().includes(q.toLowerCase());
  const active = rows.filter(r=>r.status==="Active"), inactive = rows.filter(r=>r.status!=="Active"), issues = rows.filter(r=>r.issue!=="No Issue");
  const sum = (l: any[]) => l.reduce((s,r)=>s+Number(r.total_work),0), max = Math.max(...rows.map(r=>Number(r.total_work)), 1);
  const tiles: [string, string, number, any, string][] = [["all","All accounts",rows.length,Layers,"from-slate-500 to-slate-700"],["active","Active",active.length,CheckCircle2,"from-emerald-500 to-emerald-600"],["inactive","Inactive",inactive.length,MinusCircle,"from-slate-400 to-slate-500"],["issues","With issues",issues.length,AlertTriangle,"from-rose-500 to-rose-600"]];
  const showActive = sel==="all"||sel==="active", showInactive = sel==="all"||sel==="inactive"||sel==="issues";
  const activeList = active.filter(match), inactiveList = (sel==="issues"?issues:inactive).filter(match);
  const card = (r: any, off: boolean) => { const bad = r.issue!=="No Issue", pct = (Number(r.total_work)/max)*100; return (
    <div className={`h-full rounded-2xl border bg-white p-5 shadow-sm ${bad?"border-rose-200 border-l-4 border-l-rose-500":"border-slate-200"}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-semibold text-white ${bad?"bg-rose-500":off?"bg-slate-400":"bg-emerald-500"}`}>{r.email[0].toUpperCase()}</div>
        <div className="min-w-0 flex-1"><div className="truncate font-medium">{r.email}</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {off ? <><span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600"><MinusCircle size={12}/>Inactive</span>
                {bad ? <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700"><AlertTriangle size={12}/>{r.issue}</span> : <span className="text-xs text-slate-500">No issue</span>}</>
              : <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700"><CheckCircle2 size={12}/>Active</span>}</div></div></div>
      <div className="mt-4"><div className="text-xs text-slate-500">{bad?"Held":"Holding"}</div><div className={`text-2xl font-semibold ${bad?"text-rose-600":""}`}>{usd(Number(r.total_work))}</div></div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`grow-x h-full rounded-full ${bad?"bg-rose-400":"bg-gradient-to-r from-blue-500 to-violet-500"}`} style={{width:`${pct}%`}}/></div></div>); };
  const wrap = (r: any, off: boolean) => viewer ? <div key={r.id}>{card(r,off)}</div> : <Link key={r.id} href={`/accounts/${r.id}`} className="block h-full">{card(r,off)}</Link>;
  return (<div className="space-y-6"><h1 className="text-2xl font-semibold">Accounts</h1>
    <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-blue-600 to-violet-600 p-6 text-white shadow-lg sm:p-8">
      <div className="text-sm text-blue-100">Total held across all accounts</div><div className="mt-1 text-4xl font-semibold sm:text-5xl">{usd(sum(rows))}</div>
      <div className="mt-6 grid grid-cols-2 gap-3 text-sm"><div className="rounded-2xl bg-white/15 p-3 backdrop-blur"><div className="text-xs text-blue-100">In active accounts</div><div className="mt-1 text-lg font-semibold">{usd(sum(active))}</div></div>
        <div className="rounded-2xl bg-white/15 p-3 backdrop-blur"><div className="text-xs text-blue-100">In inactive accounts</div><div className="mt-1 text-lg font-semibold">{usd(sum(inactive))}</div></div></div></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{tiles.map(([k,l,n,Icon,g])=>
      <button key={k} onClick={()=>setSel(k)} className={`flex items-center gap-3 rounded-2xl border bg-white p-4 text-left shadow-sm ${sel===k?"border-blue-500 ring-2 ring-blue-100":"border-slate-200"}`}>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${g} text-white shadow-sm`}><Icon size={20}/></div>
        <div><div className="text-2xl font-semibold leading-none">{n}</div><div className="mt-1 text-xs text-slate-500">{l}</div></div></button>)}</div>
    <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by email" className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"/></div>
    {showActive && <><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Active accounts</h2><span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">{activeList.length}</span></div>
      {activeList.length===0 ? <p className="text-slate-500">No active accounts found.</p> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{activeList.map(r=>wrap(r,false))}</div>}</>}
    {showInactive && <><div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-700">{sel==="issues"?"Accounts with issues":"Inactive accounts"}</h2><span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">{inactiveList.length}</span></div>
      {inactiveList.length===0 ? <p className="text-slate-500">No accounts found.</p> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{inactiveList.map(r=>wrap(r,true))}</div>}</>}
  </div>);
}