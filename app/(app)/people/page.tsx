"use client";
import { useEffect, useState, useCallback } from "react"; import Link from "next/link"; import { toast } from "sonner";
import { supabase, usd, Account, uploadAvatar } from "@/lib/supabase"; import { Modal, Stat, Avatar, inputCls } from "@/components/ui"; import { ADMIN_NAME } from "@/lib/config";
export default function People() {
  const [rows, setRows] = useState<any[]|null>(null), [q, setQ] = useState(""), [sort, setSort] = useState("name");
  const load = useCallback(async () => {
    const { data: ppl } = await supabase.from("people").select("*"); const { data: acc } = await supabase.from("account_totals").select("*");
    const all = (acc ?? []) as Account[];
    setRows((ppl??[]).map(p=>{ const a=all.filter(x=>x.person_id===p.id), paid=a.filter(x=>x.issue==="No Issue");
      return { ...p, n:a.length, work:paid.reduce((s,x)=>s+Number(x.total_work),0), earn:paid.reduce((s,x)=>s+Number(x.earnings),0), notPaid:a.length-paid.length,
        isNick: p.name.trim().toLowerCase() === ADMIN_NAME.toLowerCase(), act:a.filter(x=>x.status==="Active").length, upd:a.map(x=>x.updated_at).sort().pop()??p.updated_at }; })); }, []);
  useEffect(()=>{ load(); },[load]);
  const all = rows ?? [];
  const list = all.filter(r=>r.name.toLowerCase().includes(q.toLowerCase())).sort((a,b)=>sort==="name"?a.name.localeCompare(b.name):sort==="work"?b.work-a.work:sort==="earn"?b.earn-a.earn:b.upd.localeCompare(a.upd));
  return (<div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">People</h1><p className="text-sm text-slate-500">Everyone you manage, with their totals.</p></div>
    <Modal title="Add person" trigger="+ Add person">{close=><form className="space-y-3" onSubmit={async e=>{ e.preventDefault();
      const fd=new FormData(e.currentTarget), name=fd.get("name") as string, file=fd.get("photo") as File;
      const { data, error }=await supabase.from("people").insert({name}).select().single();
      if(error||!data){ toast.error(error?.message??"Could not add person"); return; }
      if(file && file.size>0) await uploadAvatar(data.id,file);
      toast.success("Person added"); close(); load(); }}>
      <input name="name" required placeholder="Full name" className={inputCls}/>
      <label className="block text-sm text-slate-600">Profile photo (optional)<input name="photo" type="file" accept="image/*" className="mt-1 block w-full text-sm"/></label>
      <button className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white">Add person</button></form>}</Modal></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat label="People" value={all.length}/><Stat label="Total work (paid)" value={usd(all.reduce((s,r)=>s+r.work,0))}/>
      <Stat label="Everyone's earnings" value={usd(all.reduce((s,r)=>s+r.earn,0))} accent/><Stat label="Active accounts" value={all.reduce((s,r)=>s+r.act,0)}/></div>
    <div className="flex gap-3"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search people" className={inputCls}/>
      <select value={sort} onChange={e=>setSort(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="name">Name</option><option value="work">Work</option><option value="earn">Earnings</option><option value="upd">Last updated</option></select></div>
    {!rows ? <p className="text-slate-500">Loading…</p> : list.length===0 ? <p className="text-slate-500">No people yet. Add your first person.</p> :
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{list.map(p=>
      <Link key={p.id} href={`/people/${p.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-center gap-4"><Avatar name={p.name} url={p.avatar_url} size={60}/>
          <div className="min-w-0"><div className="flex items-center gap-2"><b className="truncate text-lg">{p.name}</b>{p.isNick && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">Admin</span>}</div>
            <div className="text-xs text-slate-500">{p.n} {p.n===1?"account":"accounts"} · {p.act} active, {p.n-p.act} inactive</div></div></div>
        <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3">
          <div className="text-xs text-emerald-700">{p.name.split(" ")[0]}'s earnings</div>
          <div className="text-2xl font-semibold text-emerald-600">{usd(p.earn)}</div></div>
        <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-sm text-slate-600"><span>{usd(p.work)} work</span>{p.notPaid>0 ? <span className="font-medium text-rose-600">{p.notPaid} not paid</span> : <span>{usd(p.earn)} earned</span>}</div></Link>)}</div>}
  </div>);
}