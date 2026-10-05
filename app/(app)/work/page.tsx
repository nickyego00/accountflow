"use client";
import { useEffect, useState } from "react"; import Link from "next/link";
import { supabase, usd } from "@/lib/supabase"; import { inputCls } from "@/components/ui";
export default function WorkHistory() {
  const [rows, setRows] = useState<any[]|null>(null), [q, setQ] = useState("");
  useEffect(()=>{ supabase.from("work_records").select("*, accounts(id,email,rate,issue,people(name))").order("work_date",{ascending:false}).order("created_at",{ascending:false}).then(r=>setRows(r.data??[])); },[]);
  if (!rows) return <p className="text-slate-500">Loading…</p>;
  const list = rows.filter(r=>(r.accounts.email+r.accounts.people.name+(r.note??"")).toLowerCase().includes(q.toLowerCase()));
  return (<div className="space-y-6"><div><h1 className="text-2xl font-semibold">Work history</h1>
    <p className="text-sm text-slate-500">{list.length} records totalling {usd(list.reduce((s,r)=>s+Number(r.amount_usd),0))}</p></div>
    <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by person, email or note" className={inputCls}/>
    {list.length===0 ? <p className="text-slate-500">No work recorded yet.</p> : <div className="space-y-3">{list.map(r=>
      <Link key={r.id} href={`/accounts/${r.accounts.id}`} className={`flex items-center justify-between gap-3 rounded-2xl border bg-white p-4 shadow-sm hover:border-slate-400 ${r.accounts.issue==="No Issue"?"border-slate-200":"border-rose-200 border-l-4 border-l-rose-500"}`}>
        <div className="min-w-0"><div className="truncate text-sm font-medium">{r.accounts.people.name} · {r.accounts.email}</div>
          <div className="text-xs text-slate-500">{new Date(r.work_date+"T00:00").toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}{r.note?` · ${r.note}`:""}</div></div>
        <div className="shrink-0 text-right"><b>{usd(Number(r.amount_usd))}</b>
          <div className={`text-xs ${r.accounts.issue==="No Issue"?"text-emerald-600":"text-rose-600"}`}>{r.accounts.issue==="No Issue" ? `${usd(Number(r.amount_usd)*Number(r.accounts.rate))} earned` : `Not paid · ${r.accounts.issue}`}</div></div></Link>)}</div>}
  </div>);
}