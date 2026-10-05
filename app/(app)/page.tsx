"use client";
import { useEffect, useState } from "react"; import Link from "next/link"; import { useRouter } from "next/navigation";
import { supabase, usd, Account } from "@/lib/supabase"; import { Stat, IssueBadge } from "@/components/ui"; import { ADMIN_NAME } from "@/lib/config";
export default function Dashboard() {
  const router = useRouter();
  useEffect(()=>{ supabase.rpc("is_viewer").then(r=>{ if(r.data===true) router.replace("/accounts"); }); },[router]);
  const [acc, setAcc] = useState<(Account & { people: { name: string } })[]|null>(null), [people, setPeople] = useState(0);
  useEffect(() => { (async () => {
    const a = await supabase.from("account_totals").select("*, people(name)").order("updated_at",{ascending:false});
    const p = await supabase.from("people").select("id",{count:"exact",head:true});
    setAcc((a.data as any) ?? []); setPeople(p.count ?? 0); })(); }, []);
  if (!acc) return <p className="text-slate-500">Loading…</p>;
  const paid = acc.filter(a=>a.issue==="No Issue"), unpaid = acc.filter(a=>a.issue!=="No Issue");
  const work = paid.reduce((s,a)=>s+Number(a.total_work),0), earn = paid.reduce((s,a)=>s+Number(a.earnings),0);
  const active = acc.filter(a=>a.status==="Active").length, held = unpaid.reduce((s,a)=>s+Number(a.total_work),0);
  const top = Object.values(paid.reduce((m:any,a)=>{ const k=a.person_id; m[k]??={name:a.people.name,id:k,w:0}; m[k].w+=Number(a.total_work); return m; },{})).sort((a:any,b:any)=>b.w-a.w).slice(0,5) as any[];
  const byPerson = Object.values(paid.reduce((m:any,a)=>{ const k=a.person_id; m[k]??={name:a.people.name,e:0}; m[k].e+=Number(a.earnings); return m; },{})).sort((a:any,b:any)=>b.e-a.e) as any[];
  const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  return (<div className="space-y-8"><div><h1 className="text-2xl font-semibold">Welcome back, {ADMIN_NAME}</h1><p className="text-sm text-slate-500">Here is how everything is doing today.</p></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      <Stat label="People" value={people}/><Stat label="Accounts" value={acc.length}/><Stat label="Active accounts" value={active}/>
      <Stat label="Inactive accounts" value={acc.length-active}/><Stat label="Total work (paid accounts)" value={usd(work)}/><Stat label="Total earnings" value={usd(earn)} accent/></div>
    <div className="grid gap-6 lg:grid-cols-2">
      <section className={card}><h2 className="mb-3 font-semibold">Recent activity</h2>
        {acc.length===0 && <p className="text-sm text-slate-500">No accounts yet. Add a person to get started.</p>}
        {acc.slice(0,5).map(a=><Link key={a.id} href={`/accounts/${a.id}`} className="flex justify-between rounded-lg px-2 py-2 text-sm hover:bg-slate-50"><span>{a.people.name} · {a.email}</span><span className="text-slate-500">{new Date(a.updated_at).toLocaleDateString()}</span></Link>)}</section>
      <section className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 shadow-sm"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold text-rose-700">Accounts with issues (not paid)</h2><b className="text-rose-600">{usd(held)}</b></div>
        {unpaid.length===0 && <p className="text-sm text-slate-500">No issues.</p>}
        {unpaid.map(a=><Link key={a.id} href={`/accounts/${a.id}`} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm hover:bg-white">
          <div className="min-w-0"><div className="truncate">{a.email}</div><div className="mt-1"><IssueBadge i={a.issue}/></div></div>
          <div className="shrink-0 text-right"><div className="text-xs text-slate-500">Held</div><b className="text-rose-600">{usd(Number(a.total_work))}</b></div></Link>)}</section>
      <section className={card}><h2 className="mb-3 font-semibold">Top performers</h2>
        {top.map((t,i)=><Link key={t.id} href={`/people/${t.id}`} className="flex justify-between rounded-lg px-2 py-2 text-sm hover:bg-slate-50"><span>{i+1}. {t.name}</span><b>{usd(t.w)}</b></Link>)}</section>
      <section className={card}><h2 className="mb-3 font-semibold">Earnings by person</h2>
        {byPerson.length===0 && <p className="text-sm text-slate-500">Nothing yet.</p>}
        {byPerson.map(t=><div key={t.name} className="mb-3 text-sm"><div className="mb-1 flex justify-between"><span>{t.name}</span><span className="text-emerald-600">{usd(t.e)}</span></div>
          <div className="h-2 rounded bg-slate-100"><div className="h-2 rounded bg-emerald-500" style={{width:`${earn?t.e/earn*100:0}%`}}/></div></div>)}</section>
    </div></div>);
}