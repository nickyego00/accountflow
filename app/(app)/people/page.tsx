"use client";
import { useEffect, useState, useCallback } from "react"; import Link from "next/link"; import { toast } from "sonner";
import { supabase, usd, Account } from "@/lib/supabase"; import { Modal, inputCls } from "@/components/ui";
export default function People() {
  const [rows, setRows] = useState<any[]|null>(null), [q, setQ] = useState(""), [sort, setSort] = useState("name");
  const load = useCallback(async () => {
    const { data: ppl } = await supabase.from("people").select("*"); const { data: acc } = await supabase.from("account_totals").select("*");
    setRows((ppl??[]).map(p=>{ const a=(acc as Account[]).filter(x=>x.person_id===p.id);
      return { ...p, n:a.length, work:a.reduce((s,x)=>s+Number(x.total_work),0), earn:a.reduce((s,x)=>s+Number(x.earnings),0), act:a.filter(x=>x.status==="Active").length, upd:a.map(x=>x.updated_at).sort().pop()??p.updated_at }; })); }, []);
  useEffect(()=>{ load(); },[load]);
  const list = (rows??[]).filter(r=>r.name.toLowerCase().includes(q.toLowerCase())).sort((a,b)=>sort==="name"?a.name.localeCompare(b.name):sort==="work"?b.work-a.work:sort==="earn"?b.earn-a.earn:b.upd.localeCompare(a.upd));
  return (<div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-semibold">People</h1>
    <Modal title="Add person" trigger="Add person">{close=><form className="space-y-3" onSubmit={async e=>{ e.preventDefault();
      const name=new FormData(e.currentTarget).get("name") as string; const { error }=await supabase.from("people").insert({name});
      if(error) toast.error(error.message); else { toast.success("Person added"); close(); load(); } }}>
      <input name="name" required placeholder="Full name" className={inputCls}/><button className="w-full rounded-lg bg-slate-900 py-2.5 text-sm text-white">Add person</button></form>}</Modal></div>
    <div className="flex gap-3"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search people" className={inputCls}/>
      <select value={sort} onChange={e=>setSort(e.target.value)} className="rounded-lg border border-slate-300 px-3 text-sm"><option value="name">Name</option><option value="work">Work</option><option value="earn">Earnings</option><option value="upd">Last updated</option></select></div>
    {!rows ? <p className="text-slate-500">Loading…</p> : list.length===0 ? <p className="text-slate-500">No people yet. Add your first person.</p> :
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{list.map(p=>
      <Link key={p.id} href={`/people/${p.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-400">
        <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-sm font-medium text-white">{p.name.split(" ").map((w:string)=>w[0]).join("").slice(0,2).toUpperCase()}</div><b>{p.name}</b></div>
        <div className="mt-4 text-sm text-slate-500">{p.n} {p.n===1?"account":"accounts"}</div>
        <div className="mt-1 flex justify-between"><span>{usd(p.work)} work</span><span className="font-semibold text-emerald-600">{usd(p.earn)} earnings</span></div>
        <div className="mt-3 text-xs text-slate-500">{p.act} active, {p.n-p.act} inactive</div></Link>)}</div>}
  </div>);
}
