"use client";
import { useEffect, useState } from "react";
import { CalendarCheck, Clock } from "lucide-react";
import { supabase, usdRaw, kes } from "@/lib/supabase";
import { ADMIN_NAME } from "@/lib/config";

const ymd = (d: Date) => d.toLocaleDateString("en-CA");
const short = (d: string) => new Date(d + "T00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
const weekEnd = (s: string) => { const d = new Date(s + "T00:00"); d.setDate(d.getDate() + 6); return ymd(d); };

type Wk = { start: string; pay: string; value: number };

export default function PaymentHistory({ personId, isNick }: { personId: string; isNick: boolean }) {
  const [rows, setRows] = useState<any[] | null>(null);
  const [shown, setShown] = useState(8);

  useEffect(() => {
    const base = supabase.from("work_payable").select("amount_usd, rate, person_name, week_start, pay_date, payable, awaiting");
    const q = isNick ? base : base.eq("person_id", personId);
    q.then(r => setRows(r.data ?? []));
  }, [personId, isNick]);

  if (!rows) return null;

  const paid: Record<string, Wk> = {};
  const soon: Record<string, Wk> = {};
  rows.forEach(r => {
    if (!r.payable) return;
    const amt = Number(r.amount_usd);
    const rate = Number(r.rate);
    const own = String(r.person_name).trim().toLowerCase() === ADMIN_NAME.toLowerCase();
    const value = isNick ? (Math.abs(rate - 0.1) < 0.001 ? amt * 0.05 : 0) + (own ? amt * rate : 0) : amt * rate;
    const bucket = r.awaiting ? soon : paid;
    bucket[r.pay_date] ??= { start: r.week_start, pay: r.pay_date, value: 0 };
    bucket[r.pay_date].value += value;
  });
  const paidList = Object.values(paid).filter(w => w.value !== 0).sort((a, b) => b.pay.localeCompare(a.pay));
  const soonList = Object.values(soon).filter(w => w.value !== 0).sort((a, b) => a.pay.localeCompare(b.pay));
  const total = paidList.reduce((s, w) => s + w.value, 0);

  const money = (v: number) => (
    <div className="shrink-0 text-right">
      <div className="font-semibold">{usdRaw(v)}</div>
      <div className="text-xs text-slate-500">{kes(v)}</div>
    </div>
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold">Payment history</h2>
          <p className="text-sm text-slate-500">One row per pay week. Weeks run Tuesday to Monday and pay the Wednesday after.</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Total paid</div>
          <div className="font-semibold text-emerald-600">{usdRaw(total)}</div>
          <div className="text-xs text-slate-500">{kes(total)}</div>
        </div>
      </div>

      {paidList.length === 0 && soonList.length === 0 ? (
        <p className="text-sm text-slate-500">No payments yet.</p>
      ) : (
        <div className="space-y-2">
          {soonList.map(w => (
            <div key={w.pay} className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600"><Clock size={18} /></div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{short(w.start)} to {short(weekEnd(w.start))}</div>
                <div className="text-xs text-blue-700">Upcoming · pays {short(w.pay)}</div>
              </div>
              {money(w.value)}
            </div>
          ))}
          {paidList.slice(0, shown).map(w => (
            <div key={w.pay} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CalendarCheck size={18} /></div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{short(w.start)} to {short(weekEnd(w.start))}</div>
                <div className="text-xs text-slate-500">Paid {short(w.pay)}</div>
              </div>
              {money(w.value)}
            </div>
          ))}
          {paidList.length > shown && (
            <div className="pt-2 text-center">
              <button onClick={() => setShown(shown + 8)} className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700">
                Show more weeks ({paidList.length - shown} left)
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}