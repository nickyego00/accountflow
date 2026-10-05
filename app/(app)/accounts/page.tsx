"use client";
import { useEffect, useState } from "react"; import Link from "next/link";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase, usd } from "@/lib/supabase"; import PayBadge from "@/components/PayBadge";
export default function Accounts() {
  const [rows, setRows] = useState<any[]|null>(null), [q, setQ] = useState(""), [f, setF] = useState("all"), [viewer, setViewer] = useState(true);
  useEffect(()=>{ supabase.rpc("is_viewer").then(r=>setViewer(r.data===true));
    supabase.from("account_holdings").select("*").order("total_work",{ascending:false}).then(r=>setRows(r.data??[])); },[]);
  const all = rows ?? [], match = (r: any) => r.email.toLowerCase().includes(q.toLowerCase());
  const paid = all.filter(r=>r.issue==="No Issue"), unpaid = all.filter(r=>r.issue!=="No Issue");
  const paidList = paid.filter(r=>match(r) && (f==="all"||(f==="active"&&r.status==="Active")||(f==="inactive"&&r.status!=="Active")));
  const unpaidList = unpaid.filter(match);
  const tiles: [string, string|number, boolean][] = [["Accounts",all.length,false],["Held (paid accounts)",usd(paid.reduce((s,r)=>s+Number(r.total_work),0)),false],["Active",paid.filter(r=>r.status==="Active").length,false],["Not paid",unpaid.length,unpaid.length>0]];
  const card = (r: any, bad: boolean) => (
    <div className={`flex items-center justify-between gap-4 rounded-2xl border bg-white p-5 shadow-sm ${bad?"border-rose-200 border-l-4 border-l-rose-500":"border-slate-200"}`}>
      <div className="min-w-0"><div className="truncate font-medium">{r.email}</div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${r.status==="Active"?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-600"}`}><CheckCircle2 size={12}/>{r.status}</span>
          {!bad && <PayBadge s={r.payment_status}/>}
          {bad && <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700"><AlertTriangle size={12}/>{r.issue}</span>}</div></div>
      <div className="shrink-0 text-right"><div className="text-xs text-slate-500">{bad?"Held":"Holding"}</div><div className={`text-xl font-semibold ${bad?"text-rose-600":""}`}>{usd(Number(r.total_work))}</div></div></div>);
  const wrap = (r: any, bad: boolean) => viewer ? <div key={r.id}>{card(r,bad)}</div> : <Link key={r.id} href={`/accounts/${r.id}`} className="block">{card(r,bad)}</Link>;
  return (<div className="space-y-6"><h1 className="text-2xl font-semibold">Accounts</h1>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{tiles.map(([l,v,red])=><div key={l} className={`rounded-2xl border bg-white p-4 shadow-sm ${red?"border-rose-200":"border-slate-200"}`}><div className="text-sm text-slate-500">{l}</div><div className={`mt-1 text-2xl font-semibold ${red?"text-rose-600":""}`}>{v}</div></div>)}</div>
    <div className="flex flex-wrap items-center gap-2">
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by email" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm"/>
      {[["all","All"],["active","Active"],["inactive","Inactive"]].map(([k,l])=><button key={k} onClick={()=>setF(k)} className={`rounded-full px-4 py-2 text-sm ${f===k?"bg-blue-600 text-white":"border border-slate-200 bg-white text-slate-600"}`}>{l}</button>)}</div>
    {!rows ? <p className="text-slate-500">Loading…</p> : <>
      <h2 className="text-lg font-semibold">Paid accounts</h2>
      {paidList.length===0 ? <p className="text-slate-500">No accounts found.</p> : <div className="space-y-3">{paidList.map(r=>wrap(r,false))}</div>}
      {unpaidList.length>0 && <><h2 className="text-lg font-semibold text-rose-700">Not paid (accounts with issues)</h2><div className="space-y-3">{unpaidList.map(r=>wrap(r,true))}</div></>}</>}
  </div>);
}