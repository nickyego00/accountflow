"use client";
import { useEffect, useState, useCallback, use } from "react"; import Link from "next/link"; import { useRouter } from "next/navigation"; import { toast } from "sonner"; import { Camera } from "lucide-react";
import { supabase, usd, Account, editTotal, uploadAvatar } from "@/lib/supabase"; import { Modal, Stat, StatusBadge, IssueBadge, Avatar, inputCls } from "@/components/ui"; import { ADMIN_NAME } from "@/lib/config";
import PersonTools from "@/components/PersonTools";
export default function Person({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params), router = useRouter(); const [p, setP] = useState<any>(null), [acc, setAcc] = useState<Account[]>([]), [every, setEvery] = useState<any[]>([]);
  const load = useCallback(async () => {
    const person = (await supabase.from("people").select("*").eq("id",id).single()).data; setP(person);
    setAcc(((await supabase.from("account_totals").select("*").eq("person_id",id).order("created_at")).data as Account[])??[]);
    if (person && person.name.trim().toLowerCase()===ADMIN_NAME.toLowerCase())
      setEvery(((await supabase.from("account_totals").select("*, people(name)").order("total_work",{ascending:false})).data as any)??[]);
    else setEvery([]); },[id]);
  useEffect(()=>{ load(); },[load]);
  if (!p) return <p className="text-slate-500">Loading…</p>;
  const isNick = p.name.trim().toLowerCase()===ADMIN_NAME.toLowerCase();
  const work=acc.reduce((s,a)=>s+Number(a.total_work),0), earn=acc.reduce((s,a)=>s+Number(a.earnings),0), act=acc.filter(a=>a.status==="Active").length;
  const shareSum = every.reduce((s,a)=>s+Number(a.admin_share),0);
  const others = every.filter(a=>a.person_id!==id);
  const rate = (a: any, r: number) => Math.abs(Number(a.rate)-r) < 0.001;
  return (<div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-5"><Avatar name={p.name} url={p.avatar_url} size={84}/>
        <div><h1 className="text-2xl font-semibold">{p.name}</h1><div className="text-sm text-slate-500">{acc.length} {acc.length===1?"account":"accounts"} · {act} active</div>
          <label className="mt-2 inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-blue-600"><Camera size={14}/>{p.avatar_url?"Change photo":"Add photo"}
            <input type="file" accept="image/*" className="hidden" onChange={async e=>{ const f=e.target.files?.[0]; if(f && await uploadAvatar(id,f)){ toast.success("Photo updated"); load(); } }}/></label></div></div>
      <div className="flex gap-2"><button className="rounded-xl border border-rose-300 px-4 py-2.5 text-sm text-rose-700" onClick={async()=>{ if(!confirm(`Delete ${p.name} and all their accounts?`)) return;
        const {error}=await supabase.from("people").delete().eq("id",id); if(error) toast.error(error.message); else { toast.success("Person deleted"); router.push("/people"); } }}>Delete</button>
      <Modal title="Add account" trigger="+ Add account">{close=><form className="space-y-3" onSubmit={async e=>{ e.preventDefault(); const f=Object.fromEntries(new FormData(e.currentTarget)) as any;
        const {error}=await supabase.from("accounts").insert({person_id:id,email:f.email,rate:Number(f.rate),status:f.status,issue:f.issue,notes:f.notes||null});
        if(error) toast.error(error.message); else { toast.success("Account added"); close(); load(); } }}>
        <input name="email" type="email" required placeholder="Account email" className={inputCls}/>
        <select name="rate" className={inputCls}><option value="0.10">10%</option><option value="0.15">15%</option></select>
        <select name="status" className={inputCls}><option>Active</option><option>Inactive</option></select>
        <select name="issue" className={inputCls}><option>No Issue</option><option>Account Suspended</option><option>Multimango Suspended</option></select>
        <textarea name="notes" placeholder="Notes (optional)" className={inputCls}/><button className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white">Add account</button></form>}</Modal></div></div>
    <PersonTools person={p} accounts={acc} isNick={isNick} reload={load}/>
    <div className={`grid grid-cols-2 gap-3 ${isNick?"lg:grid-cols-5":"lg:grid-cols-4"}`}>
      <Stat label="Total work" value={usd(work)}/>
      {isNick ? <Stat label={`${ADMIN_NAME}'s total`} value={usd(shareSum+earn)} gold/> : <Stat label="Total earnings" value={usd(earn)} accent/>}
      {isNick && <Stat label="Own accounts' earnings" value={usd(earn)} accent/>}
      <Stat label="Active" value={act}/><Stat label="Inactive" value={acc.length-act}/></div>
    {isNick && <section className="space-y-4">
      <h2 className="text-lg font-semibold">Other people's accounts by rate</h2>
      {[0.15,0.10].map(r=>{ const list=others.filter(a=>rate(a,r)), is10=r===0.10, mine=list.reduce((s,a)=>s+Number(a.admin_share),0);
        return (<div key={r} className={`rounded-2xl border p-5 shadow-sm ${is10?"border-violet-200 bg-gradient-to-br from-violet-50 to-white":"border-slate-200 bg-white"}`}>
          <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">{r*100}% accounts <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{list.length}</span></h3>
            {is10 && <span className="text-sm text-violet-700">My 5%: <b className="text-violet-600">{usd(mine)}</b></span>}</div>
          {list.length===0 ? <p className="text-sm text-slate-500">No {r*100}% accounts yet.</p> : list.map(a=>
            <Link key={a.id} href={`/accounts/${a.id}`} className={`flex items-center justify-between gap-3 border-t py-2.5 text-sm first:border-0 ${is10?"border-violet-100":"border-slate-100"}`}>
              <div className="min-w-0"><div className="truncate font-medium">{a.people.name} · {a.email}</div><div className="text-xs text-slate-500">{usd(Number(a.total_work))} made · {r*100}% rate · earns {usd(Number(a.earnings))}</div></div>
              {is10 ? <b className="shrink-0 text-violet-600">{usd(Number(a.admin_share))}</b> : <span className="shrink-0 text-xs text-slate-400">no share</span>}</Link>)}</div>); })}</section>}
    <h2 className="text-lg font-semibold">{isNick?"My own accounts":"Accounts"}</h2>
    {acc.length===0 ? <p className="text-slate-500">No accounts yet. Use “Add account” above.</p> :
    <div className="grid gap-5 md:grid-cols-2">{acc.map(a=>{ const bad=a.issue!=="No Issue"; return (
      <div key={a.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${bad?"border-rose-200 border-l-4 border-l-rose-500":"border-slate-200"}`}>
        <div className="break-all font-medium">{a.email}</div><div className="mt-2 flex flex-wrap gap-2"><StatusBadge s={a.status}/><IssueBadge i={a.issue}/></div>
        <div className={`mt-4 grid gap-2 text-sm ${isNick?"grid-cols-3":"grid-cols-2"}`}>
          <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">Work</div><b>{usd(Number(a.total_work))}</b></div>
          {isNick && <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">Rate</div><b>{Number(a.rate)*100}%</b></div>}
          <div className="rounded-xl bg-emerald-50 p-3"><div className="text-xs text-emerald-700">Earnings</div><b className="text-emerald-600">{usd(Number(a.earnings))}</b></div></div>
        <div className="mt-3 text-xs text-slate-500">Updated {new Date(a.updated_at).toLocaleDateString()}</div>
        <div className="mt-4 grid grid-cols-2 gap-2"><button className="rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white" onClick={()=>editTotal(a.id,Number(a.total_work),load)}>Edit amount</button>
          <Link href={`/accounts/${a.id}`} className="rounded-xl border border-slate-300 py-2.5 text-center text-sm font-medium">View account</Link></div></div>); })}</div>}
  </div>);
}