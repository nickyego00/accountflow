"use client";
import { useEffect, useState, useCallback, use } from "react"; import Link from "next/link"; import { toast } from "sonner";
import { supabase, usd, Account, editTotal } from "@/lib/supabase"; import { Modal, Stat, StatusBadge, IssueBadge, inputCls } from "@/components/ui"; import { ADMIN_NAME } from "@/lib/config";
export default function AccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); const [a, setA] = useState<(Account & { people: { name: string } })|null>(null), [w, setW] = useState<any[]>([]);
  const load = useCallback(async () => { setA((await supabase.from("account_totals").select("*, people(name)").eq("id",id).single()).data as any);
    setW((await supabase.from("work_records").select("*").eq("account_id",id).order("work_date",{ascending:false})).data ?? []); },[id]);
  useEffect(()=>{ load(); },[load]);
  const patch = async (v: object) => { const {error}=await supabase.from("accounts").update({...v,updated_at:new Date().toISOString()}).eq("id",id); if(error) toast.error(error.message); else { toast.success("Account updated"); load(); } };
  if (!a) return <p className="text-slate-500">Loading…</p>;
  const isNick = a.people.name.trim().toLowerCase()===ADMIN_NAME.toLowerCase();
  const changeRate = () => { const v=prompt("New rate: type 10 or 15"); if(v===null) return; if(v.trim()==="10"||v.trim()==="15") patch({rate:Number(v)/100}); else toast.error("Rate must be 10 or 15"); };
  return (<div className="space-y-6">
    <div><Link href={`/people/${a.person_id}`} className="text-sm text-slate-500">{a.people.name}</Link><h1 className="break-all text-2xl font-semibold">{a.email}</h1><button className="text-sm text-slate-500 underline" onClick={()=>{ const v=prompt("Account email", a.email); if(v&&v!==a.email) patch({email:v}); }}>Edit email</button>
      <div className="mt-2 flex gap-2"><StatusBadge s={a.status}/><IssueBadge i={a.issue}/></div></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="text-sm text-slate-500">Total made</div><div className="mt-1 text-2xl font-semibold">{usd(Number(a.total_work))}</div><button className="mt-2 text-xs text-blue-600 underline" onClick={()=>editTotal(a.id,Number(a.total_work),load)}>Edit amount</button></div>
      <Stat label="Total earnings" value={usd(Number(a.earnings))} accent/>
      {isNick
        ? <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm"><div className="text-slate-500">Rate</div><select className="mt-1 text-xl font-semibold" value={String(Number(a.rate))} onChange={e=>patch({rate:Number(e.target.value)})}><option value="0.1">10%</option><option value="0.15">15%</option></select></div>
        : <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm"><div className="text-slate-500">Rate</div><button className="mt-2 text-sm text-blue-600 underline" onClick={changeRate}>Change rate</button></div>}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm"><div className="text-slate-500">Status / issue</div>
        <select className="mt-1 block" value={a.status} onChange={e=>patch({status:e.target.value})}><option>Active</option><option>Inactive</option></select>
        <select className="block" value={a.issue} onChange={e=>patch({issue:e.target.value})}><option>No Issue</option><option>Account Suspended</option><option>Multimango Suspended</option></select></div></div>
    <div className="flex items-center justify-between"><h2 className="font-semibold">Work history</h2>
      <Modal title="Add work" trigger="Add work">{close=><form className="space-y-3" onSubmit={async e=>{ e.preventDefault(); const f=Object.fromEntries(new FormData(e.currentTarget)) as any;
        const {error}=await supabase.from("work_records").insert({account_id:id,work_date:f.date,amount_usd:Number(f.amount),note:f.note||null});
        if(error) toast.error(error.message); else { toast.success("Work added"); close(); load(); } }}>
        <input name="date" type="date" required defaultValue={new Date().toISOString().slice(0,10)} className={inputCls}/>
        <input name="amount" type="number" step="0.01" min="0" required placeholder="Amount (USD)" className={inputCls}/>
        <input name="note" placeholder="Note (optional)" className={inputCls}/><button className="w-full rounded-lg bg-blue-600 py-2.5 text-sm text-white">Add work</button></form>}</Modal></div>
    {w.length===0 ? <p className="text-slate-500">No work recorded yet.</p> : <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">{w.map(r=>
      <div key={r.id} className="flex items-center justify-between p-4 text-sm"><div><b>{new Date(r.work_date+"T00:00").toLocaleDateString(undefined,{month:"long",day:"numeric"})}</b>{r.note&&<div className="text-slate-500">{r.note}</div>}</div>
        <div className="flex items-center gap-4"><b>{usd(Number(r.amount_usd))}</b><button className="text-rose-600" onClick={async()=>{ if(!confirm("Delete this work record?")) return; await supabase.from("work_records").delete().eq("id",r.id); toast.success("Work deleted"); load(); }}>Delete</button></div></div>)}</div>}
  </div>);
}