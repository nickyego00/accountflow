"use client";
import { useEffect, useState, useCallback, use } from "react"; import Link from "next/link"; import { useRouter } from "next/navigation"; import { toast } from "sonner";
import { supabase, usd, Account, editTotal } from "@/lib/supabase"; import { Modal, Stat, StatusBadge, IssueBadge, inputCls } from "@/components/ui";
export default function Person({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params), router = useRouter(); const [p, setP] = useState<any>(null), [acc, setAcc] = useState<Account[]>([]);
  const load = useCallback(async () => { setP((await supabase.from("people").select("*").eq("id",id).single()).data);
    setAcc(((await supabase.from("account_totals").select("*").eq("person_id",id).order("created_at")).data as Account[])??[]); },[id]);
  useEffect(()=>{ load(); },[load]);
  if (!p) return <p className="text-slate-500">Loading…</p>;
  const work=acc.reduce((s,a)=>s+Number(a.total_work),0), earn=acc.reduce((s,a)=>s+Number(a.earnings),0), act=acc.filter(a=>a.status==="Active").length;
  return (<div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-semibold">{p.name}</h1>
      <div className="flex gap-2"><button className="rounded-lg border border-rose-300 px-4 py-2.5 text-sm text-rose-700" onClick={async()=>{ if(!confirm(`Delete ${p.name} and all their accounts?`)) return;
        const {error}=await supabase.from("people").delete().eq("id",id); if(error) toast.error(error.message); else { toast.success("Person deleted"); router.push("/people"); } }}>Delete</button>
      <Modal title="Add account" trigger="Add account">{close=><form className="space-y-3" onSubmit={async e=>{ e.preventDefault(); const f=Object.fromEntries(new FormData(e.currentTarget)) as any;
        const {error}=await supabase.from("accounts").insert({person_id:id,email:f.email,rate:Number(f.rate),status:f.status,issue:f.issue,notes:f.notes||null});
        if(error) toast.error(error.message); else { toast.success("Account added"); close(); load(); } }}>
        <input name="email" type="email" required placeholder="Account email" className={inputCls}/>
        <select name="rate" className={inputCls}><option value="0.10">10%</option><option value="0.15">15%</option></select>
        <select name="status" className={inputCls}><option>Active</option><option>Inactive</option></select>
        <select name="issue" className={inputCls}><option>No Issue</option><option>Account Suspended</option><option>Multimango Suspended</option></select>
        <textarea name="notes" placeholder="Notes (optional)" className={inputCls}/><button className="w-full rounded-lg bg-slate-900 py-2.5 text-sm text-white">Add account</button></form>}</Modal></div></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5"><Stat label="Accounts" value={acc.length}/><Stat label="Total work" value={usd(work)}/><Stat label="Total earnings" value={usd(earn)} accent/><Stat label="Active" value={act}/><Stat label="Inactive" value={acc.length-act}/></div>
    {acc.length===0 ? <p className="text-slate-500">No accounts yet. Use “Add account” above.</p> :
    <div className="grid gap-4 md:grid-cols-2">{acc.map(a=><div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="break-all font-medium">{a.email}</div><div className="mt-2 flex gap-2"><StatusBadge s={a.status}/><IssueBadge i={a.issue}/></div>
      <div className="mt-4 grid grid-cols-3 text-sm"><div><div className="text-slate-500">Work</div>{usd(Number(a.total_work))}</div><div><div className="text-slate-500">Rate</div>{Number(a.rate)*100}%</div><div><div className="text-slate-500">Earnings</div><b className="text-emerald-600">{usd(Number(a.earnings))}</b></div></div>
      <div className="mt-3 text-xs text-slate-500">Updated {new Date(a.updated_at).toLocaleDateString()}</div>
      <button className="mt-4 block w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white" onClick={()=>editTotal(a.id,Number(a.total_work),load)}>Edit amount</button>
      <Link href={`/accounts/${a.id}`} className="mt-2 block rounded-lg border border-slate-300 py-2.5 text-center text-sm font-medium">View account</Link></div>)}</div>}
  </div>);
}