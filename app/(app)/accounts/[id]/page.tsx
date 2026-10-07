"use client";
import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { supabase, usd, Account, editTotal } from "@/lib/supabase";
import { Modal, Stat, StatusBadge, IssueBadge, inputCls } from "@/components/ui";
import { ADMIN_NAME } from "@/lib/config";
import PayBadge from "@/components/PayBadge";
import WorkAnalysis from "@/components/WorkAnalysis";
import { deletesIn, nextPayday } from "@/lib/time";

type Acc = Account & {
  held_work: number; paid_work: number; balance: number;
  suspended_on: string | null; suspended_at: string | null; people: { name: string };
};
const day = (d: string) => new Date(d + "T00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

export default function AccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [a, setA] = useState<Acc | null>(null);
  const [w, setW] = useState<any[]>([]);
  const load = useCallback(async () => {
    setA((await supabase.from("account_totals").select("*, people(name)").eq("id", id).single()).data as any);
    setW((await supabase.from("work_payable").select("*").eq("account_id", id).order("work_date", { ascending: false })).data ?? []);
  }, [id]);
  useEffect(() => { load(); }, [load]);
  const patch = async (v: object) => {
    const { error } = await supabase.from("accounts").update({ ...v, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Account updated"); load(); }
  };
  if (!a) return <p className="text-slate-500">Loading…</p>;
  const isNick = a.people.name.trim().toLowerCase() === ADMIN_NAME.toLowerCase();
  const hasIssue = a.issue !== "No Issue";
  const changeRate = () => {
    const v = prompt("New rate: type 10 or 15");
    if (v === null) return;
    if (v.trim() === "10" || v.trim() === "15") patch({ rate: Number(v) / 100 }); else toast.error("Rate must be 10 or 15");
  };
  const box = "rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm";

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/people/${a.person_id}`} className="text-sm text-slate-500">{a.people.name}</Link>
        <h1 className="break-all text-2xl font-semibold">{a.email}</h1>
        <button className="text-sm text-slate-500 underline" onClick={() => { const v = prompt("Account email", a.email); if (v && v !== a.email) patch({ email: v }); }}>Edit email</button>
        <div className="mt-2 flex flex-wrap gap-2"><StatusBadge s={a.status} /><IssueBadge i={a.issue} /><PayBadge s={a.payment_status} issue={a.issue} /></div>
        {hasIssue && (
          <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
            <b>{deletesIn(a.suspended_at)}.</b> This account is deleted automatically 24 hours after it was suspended, together with its work history (a summary is kept).
            Set the issue back to No Issue to keep it. Work in weeks paid before the suspension date was paid out; later weeks are held.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm">
          <div className="text-sm text-blue-700">Balance</div>
          <div className="mt-1 text-2xl font-semibold text-blue-600">{usd(Number(a.balance))}</div>
          <div className="mt-1 text-xs text-slate-500">{Number(a.balance) > 0 ? `Next payday ${nextPayday()}` : "Nothing waiting for payment"}</div>
        </div>
        <div className={box}>
          <div className="text-slate-500">Total made</div>
          <div className="mt-1 text-2xl font-semibold">{usd(Number(a.total_work))}</div>
          <button className="mt-2 text-xs text-blue-600 underline" onClick={() => editTotal(a.id, Number(a.total_work), load)}>Edit amount</button>
        </div>
        <Stat label={hasIssue ? "Paid before suspension" : "Total earnings"} value={usd(Number(a.earnings))} accent />
        {hasIssue && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-sm">
            <div className="text-sm text-rose-700">Held (not paid)</div>
            <div className="mt-1 text-2xl font-semibold text-rose-600">{usd(Number(a.held_work))}</div>
          </div>
        )}
        {isNick ? (
          <div className={box}>
            <div className="text-slate-500">Rate</div>
            <select className="mt-1 text-xl font-semibold" value={String(Number(a.rate))} onChange={e => patch({ rate: Number(e.target.value) })}>
              <option value="0.1">10%</option><option value="0.15">15%</option>
            </select>
          </div>
        ) : (
          <div className={box}>
            <div className="text-slate-500">Rate</div>
            <button className="mt-2 text-sm text-blue-600 underline" onClick={changeRate}>Change rate</button>
          </div>
        )}
        <div className={box}>
          <div className="text-slate-500">Status / issue</div>
          <select className="mt-1 block" value={a.status} onChange={e => patch({ status: e.target.value })}><option>Active</option><option>Inactive</option></select>
          <select className="block" value={a.issue} onChange={e => patch({ issue: e.target.value })}>
            <option>No Issue</option><option>Account Suspended</option><option>Multimango Suspended</option>
          </select>
          {hasIssue && (
            <label className="mt-2 block text-xs text-slate-500">Suspended on
              <input type="date" className="mt-1 block rounded border border-slate-300 px-2 py-1 text-sm text-slate-900"
                value={a.suspended_on ?? ""} onChange={e => patch({ suspended_on: e.target.value || null })} />
            </label>
          )}
        </div>
        <div className={box}>
          <div className="text-slate-500">Payment</div>
          {hasIssue
            ? <div className="mt-2 text-lg font-semibold text-rose-600">Stopped</div>
            : <select className="mt-1 text-lg font-semibold" value={a.payment_status} onChange={e => patch({ payment_status: e.target.value })}><option>Unpaid</option><option>Pending</option><option>Paid</option></select>}
        </div>
      </div>

      <WorkAnalysis records={w} />

      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Work history</h2>
        <Modal title="Add work" trigger="Add work">
          {close => (
            <form className="space-y-3" onSubmit={async e => {
              e.preventDefault();
              const f = Object.fromEntries(new FormData(e.currentTarget)) as any;
              const { error } = await supabase.from("work_records").insert({ account_id: id, work_date: f.date, amount_usd: Number(f.amount), note: f.note || null });
              if (error) toast.error(error.message); else { toast.success("Work added"); close(); load(); }
            }}>
              <input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputCls} />
              <input name="amount" type="number" step="0.01" min="0" required placeholder="Amount (USD)" className={inputCls} />
              <input name="note" placeholder="Note (optional)" className={inputCls} />
              <button className="w-full rounded-lg bg-blue-600 py-2.5 text-sm text-white">Add work</button>
            </form>
          )}
        </Modal>
      </div>
      {w.length === 0 ? <p className="text-slate-500">No work recorded yet.</p> : (
        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
          {w.map(r => (
            <div key={r.id} className="flex items-center justify-between gap-3 p-4 text-sm">
              <div className="min-w-0">
                <b>{new Date(r.work_date + "T00:00").toLocaleDateString(undefined, { month: "long", day: "numeric" })}</b>
                {r.note && <div className="text-slate-500">{r.note}</div>}
                <div className={`text-xs ${r.awaiting ? "text-blue-600" : r.payable ? "text-slate-400" : "font-medium text-rose-600"}`}>
                  {r.awaiting ? `Balance · pays ${day(r.pay_date)}` : r.payable ? `Paid ${day(r.pay_date)}` : `Held · would have paid ${day(r.pay_date)}`}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <b>{usd(Number(r.amount_usd))}</b>
                <button className="text-rose-600" onClick={async () => {
                  if (!confirm("Delete this work record?")) return;
                  await supabase.from("work_records").delete().eq("id", r.id);
                  toast.success("Work deleted"); load();
                }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}