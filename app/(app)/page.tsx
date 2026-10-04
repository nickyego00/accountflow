"use client";
import { useEffect, useState } from "react"; import Link from "next/link"; import { useRouter } from "next/navigation";
import { supabase, usd, Account } from "@/lib/supabase"; import { Stat, IssueBadge } from "@/components/ui";
export default function Dashboard() {
  const router = useRouter();
  useEffect(()=>{ supabase.rpc("is_viewer").then(r=>{ if(r.data===true) router.replace("/accounts"); }); },[router]);
  const [acc, setAcc] = useState<(Account & { people: { name: string } })[]|null>(null), [people, setPeople] = useState(0);
  useEffect(() => { (async () => {
    const a = await supabase.from("account_totals").select("*, people(name)").order("updated_at",{ascending:false});
    const p = await supabase.from("people").select("id",{count:"exact",head:true});
    setAcc((a.data as any) ?? []); setPeople(p.count ?? 0); })(); }, []);
  if (!acc) return <p className="text-slate-500">Loading…</p>;
  const work = acc.reduce((s,a)=>s+Number(a.total_work),0), earn = acc.reduce((s,a)=>s+Number(a.earnings),0);
  const active = acc.filter(a=>a.status==="Active").length, issues = acc.filter(a=>a.issue!=="No Issue");
  const top = Object.values(acc.reduce((m:any,a)=>{ const k=a.person_id; m[k]??={name:a.people.name,id:k,w:0}; m[k].w+=Number(a.total_work); return m; },{})).sort((a:any,b:any)=>b.w-a.w).slice(0,5) as any[];
  return (<div className="space-y-8"><h1 className="text-2xl font-semibold">Dashboard</h1>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      <Stat label="People" value={people}/><Stat label="Accounts" value={acc.length}/><Stat label="Active accounts" value={active}/>
      <Stat label="Inactive accounts" value={acc.length-active}/><Stat label="Total work" value={usd(work)}/><Stat label="Total earnings" value={usd(earn)} accent/></div>
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="mb-3 font-semibold">Recent activity</h2>
        {acc.length===0 && <p className="text-sm text-slate-500">No accounts yet. Add a person to get started.</p>}
        {acc.slice(0,5).map(a=><Link key={a.id} href={`/accounts/${a.id}`} className="flex justify-between py-2 text-sm"><span>{a.people.name} · {a.email}</span><span className="text-slate-500">{new Date(a.updated_at).toLocaleDateString()}</span></Link>)}</section>
      <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="mb-3 font-semibold">Accounts with issues</h2>
        {issues.length===0 && <p className="text-sm text-slate-500">No issues.</p>}
        {issues.map(a=><Link key={a.id} href={`/accounts/${a.id}`} className="flex items-center justify-between py-2 text-sm"><span>{a.email}</span><IssueBadge i={a.issue}/></Link>)}</section>
      <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="mb-3 font-semibold">Top performers</h2>
        {top.map((t,i)=><Link key={t.id} href={`/people/${t.id}`} className="flex justify-between py-2 text-sm"><span>{i+1}. {t.name}</span><b>{usd(t.w)}</b></Link>)}</section>
      <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="mb-3 font-semibold">Earnings overview</h2>
        {[0.10,0.15].map(r=>{ const e=acc.filter(a=>Number(a.rate)===r).reduce((s,a)=>s+Number(a.earnings),0);
          return <div key={r} className="mb-3 text-sm"><div className="mb-1 flex justify-between"><span>{r*100}% accounts</span><span className="text-emerald-600">{usd(e)}</span></div>
          <div className="h-2 rounded bg-slate-100"><div className="h-2 rounded bg-emerald-500" style={{width:`${earn?e/earn*100:0}%`}}/></div></div>;})}</section>
    </div></div>);
}