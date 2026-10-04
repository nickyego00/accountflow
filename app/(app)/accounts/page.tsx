"use client";
import { useEffect, useState } from "react"; import Link from "next/link";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase, usd } from "@/lib/supabase";
export default function Accounts() {
  const [rows, setRows] = useState<any[]|null>(null), [q, setQ] = useState(""), [f, setF] = useState("all"), [viewer, setViewer] = useState(true);
  useEffect(()=>{ supabase.rpc("is_viewer").then(r=>setViewer(r.data===true));
    supabase.from("account_holdings").select("*").order("total_work",{ascending:false}).then(r=>setRows(r.data??[])); },[]);
  const all = rows ?? [];
  const list = all.filter(r=>r.email.toLowerCase().includes(q.toLowerCase()) && (f==="all"||(f==="active"&&r.status==="Active")||(f==="inactive"&&r.status!=="Active")||(f==="issues"&&r.issue!=="No Issue")));
  const issues = all.filter(r=>r.issue!=="No Issue").length;
  const tiles: [string, string|number, boolean][] = [["Accounts",all.length,false],["Total held",usd(all.reduce((s,r)=>s+Number(r.total_work),0)),false],["Active",all.filter(r=>r.status==="Active").length,false],["With issues",issues,issues>0]];
  const card = (r: any) => { const bad = r.issue!=="No Issue"; return (
    <div className={`flex items-center justify-between gap-4 rounded-2xl border bg-white p-5 shadow-sm ${bad?"border-rose-200 border-l-4 border-l-rose-500":"border-slate-200"}`}>
      <div className="min-w-0"><div className="truncate font-medium">{r.email}</div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${r.status==="Active"?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-600"}`}><CheckCircle2 size={12}/>{r.status}</span>
          {bad && <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700"><AlertTriangle size={12}/>{r.issue}</span>}</div></div>
      <div className="shrink-0 text-right"><div className="text-xs text-slate-500">Holding</div><div className="text-xl font-semibold">{usd(Number(r.total_work))}</div></div></div>); };
  return (<div className="space-y-6"><h1 className="text-2xl font-semibold">Accounts</h1>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{tiles.map(([l,v,red])=><div key={l} className={`rounded-xl border bg-white p-4 ${red?"border-rose-200":"border-slate-200"}`}><div className="text-sm text-slate-500">{l}</div><div className={`mt-1 text-2xl font-semibold ${red?"text-rose-600":""}`}>{v}</div></div>)}</div>
    <div className="flex flex-wrap items-center gap-2">
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by email" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm"/>
      {[["all","All"],["active","Active"],["inactive","Inactive"],["issues","Issues"]].map(([k,l])=><button key={k} onClick={()=>setF(k)} className={`rounded-full px-4 py-2 text-sm ${f===k?"bg-slate-900 text-white":"bg-white text-slate-600 border border-slate-200"}`}>{l}</button>)}</div>
    {!rows ? <p className="text-slate-500">Loading…</p> : list.length===0 ? <p className="text-slate-500">No accounts found.</p> :
    <div className="space-y-3">{list.map(r=> viewer ? <div key={r.id}>{card(r)}</div> : <Link key={r.id} href={`/accounts/${r.id}`} className="block">{card(r)}</Link>)}</div>}
  </div>);
}