"use client";
import { useEffect, useState, useCallback } from "react"; import Link from "next/link"; import { toast } from "sonner";
import { supabase, usd, Account } from "@/lib/supabase"; import { Modal, Stat, inputCls } from "@/components/ui"; import { downloadCsv } from "@/lib/export";
export default function PersonTools({ person, accounts, isNick, reload }: { person: any; accounts: Account[]; isNick: boolean; reload: () => void }) {
  const [pay, setPay] = useState<any[]>([]);
  const loadPay = useCallback(async () => { setPay((await supabase.from("payments").select("*").eq("person_id", person.id).order("paid_on", { ascending: false })).data ?? []); }, [person.id]);
  useEffect(() => { if (!isNick) loadPay(); }, [isNick, loadPay]);
  const earned = accounts.reduce((s, a) => s + Number(a.earnings), 0), paid = pay.reduce((s, x) => s + Number(x.amount_usd), 0);
  const btn = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50";
  return (<div className="space-y-4">
    <div className="flex flex-wrap gap-2">
      <button className={btn} onClick={async () => { const v = prompt("Person's name", person.name); if (!v || v.trim() === person.name) return;
        const { error } = await supabase.from("people").update({ name: v.trim(), updated_at: new Date().toISOString() }).eq("id", person.id);
        if (error) toast.error(error.message); else { toast.success("Name updated"); reload(); } }}>Rename</button>
      <Link href={`/people/${person.id}/statement`} className={btn}>Monthly statement</Link>
      <button className={btn} onClick={() => downloadCsv(`${person.name}-accounts.csv`, [["Email", "Status", "Issue", "Work", "Earnings"], ...accounts.map(a => [a.email, a.status, a.issue, Number(a.total_work), Number(a.earnings)])])}>Export CSV</button></div>
    {!isNick && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">Payments</h2>
        <Modal title="Record payment" trigger="+ Record payment">{close => <form className="space-y-3" onSubmit={async e => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.currentTarget)) as any;
          const { error } = await supabase.from("payments").insert({ person_id: person.id, amount_usd: Number(f.amount), paid_on: f.date, note: f.note || null });
          if (error) toast.error(error.message); else { toast.success("Payment recorded"); close(); loadPay(); } }}>
          <input name="amount" type="number" step="0.01" min="0.01" required placeholder="Amount (USD)" className={inputCls} />
          <input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputCls} />
          <input name="note" placeholder="Note (optional)" className={inputCls} />
          <button className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white">Save payment</button></form>}</Modal></div>
      <div className="grid grid-cols-3 gap-3"><Stat label="Earned" value={usd(earned)} /><Stat label="Paid" value={usd(paid)} /><Stat label="Balance owed" value={usd(earned - paid)} accent /></div>
      {pay.length === 0 ? <p className="mt-4 text-sm text-slate-500">No payments recorded yet.</p> : <div className="mt-4 divide-y divide-slate-100">{pay.map(x =>
        <div key={x.id} className="flex items-center justify-between py-2.5 text-sm"><div><b>{usd(Number(x.amount_usd))}</b><div className="text-xs text-slate-500">{new Date(x.paid_on + "T00:00").toLocaleDateString()}{x.note ? ` · ${x.note}` : ""}</div></div>
          <button className="text-rose-600" onClick={async () => { if (!confirm("Delete this payment?")) return; await supabase.from("payments").delete().eq("id", x.id); toast.success("Payment deleted"); loadPay(); }}>Delete</button></div>)}</div>}
    </section>}
  </div>);
}