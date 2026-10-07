"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Wallet, AlertTriangle, FileText, CalendarDays, ChevronRight } from "lucide-react";
import { supabase, usd } from "@/lib/supabase";
import { Avatar } from "@/components/ui";
import PageHero from "@/components/PageHero";

const ymd = (d: Date) => d.toLocaleDateString("en-CA");
const short = (d: string) => new Date(d + "T00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
const dayName = (d: string) => new Date(d + "T00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric" });

function startOf(p: string): string {
  const t = new Date();
  if (p === "week") {
    const s = new Date(t);
    s.setDate(t.getDate() - ((t.getDay() + 5) % 7));
    return ymd(s);
  }
  if (p === "month") return ymd(t).slice(0, 8) + "01";
  return "0000-01-01";
}

const periods = [["all", "All time"], ["week", "This pay week"], ["month", "This month"]];
const kinds = [["all", "All"], ["paid", "Paid"], ["held", "Held"]];
type Week = { start: string; pay: string; items: any[] };

export default function WorkHistory() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [q, setQ] = useState("");
  const [p, setP] = useState("all");
  const [kind, setKind] = useState("all");
  const [shown, setShown] = useState(4);

  useEffect(() => {
    supabase.from("work_payable").select("*").order("work_date", { ascending: false }).order("created_at", { ascending: false }).then(r => setRows(r.data ?? []));
  }, []);
  if (!rows) return <p className="text-slate-500">Loading…</p>;

  const from = startOf(p);
  const list = rows.filter(r => {
    if (r.work_date < from) return false;
    if (kind === "paid" && !r.payable) return false;
    if (kind === "held" && r.payable) return false;
    return (r.email + r.person_name + (r.note ?? "")).toLowerCase().includes(q.toLowerCase());
  });
  const weeks: Week[] = [];
  list.forEach(r => {
    const last = weeks[weeks.length - 1];
    if (last && last.start === r.week_start) last.items.push(r);
    else weeks.push({ start: r.week_start, pay: r.pay_date, items: [r] });
  });
  const sum = (l: any[]) => l.reduce((s, r) => s + Number(r.amount_usd), 0);
  const weekEnd = (start: string) => { const d = new Date(start + "T00:00"); d.setDate(d.getDate() + 6); return ymd(d); };
  const reset = (fn: () => void) => { fn(); setShown(4); };
  const chip = (on: boolean, dark?: boolean) =>
    `rounded-full px-4 py-2 text-sm ${on ? (dark ? "bg-slate-900 text-white shadow-sm" : "bg-blue-600 text-white shadow-sm") : "border border-slate-200 bg-white text-slate-600"}`;

  return (
    <div className="space-y-6">
      <PageHero
        title="Work history"
        description="Weeks run Tuesday to Monday and are paid the Wednesday after."
        banner={{ label: "Total recorded", value: usd(sum(list)) }}
        stats={[
          { label: "Paid", value: usd(sum(list.filter(r => r.payable))), Icon: Wallet },
          { label: "Held", value: usd(sum(list.filter(r => !r.payable))), Icon: AlertTriangle },
          { label: "Entries", value: String(list.length), Icon: FileText },
          { label: "Pay weeks", value: String(weeks.length), Icon: CalendarDays },
        ]}
      />

      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={e => reset(() => setQ(e.target.value))} placeholder="Search by person, email or note" className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {periods.map(([k, l]) => <button key={k} onClick={() => reset(() => setP(k))} className={chip(p === k)}>{l}</button>)}
          <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />
          {kinds.map(([k, l]) => <button key={k} onClick={() => reset(() => setKind(k))} className={chip(kind === k, true)}>{l}</button>)}
        </div>
      </div>

      {weeks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">No work entries match these filters.</div>
      ) : (
        <div className="space-y-6">
          {weeks.slice(0, shown).map(w => {
            const held = sum(w.items.filter(r => !r.payable));
            return (
              <section key={w.start} className="rise-in overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
                  <div>
                    <div className="text-sm font-semibold">{short(w.start)} to {short(weekEnd(w.start))}</div>
                    <div className="text-xs text-slate-500">Pays {short(w.pay)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-semibold">{usd(sum(w.items))}</div>
                    {held > 0 && <div className="text-xs font-medium text-rose-600">{usd(held)} held</div>}
                  </div>
                </header>
                <div className="divide-y divide-slate-100">
                  {w.items.map(r => (
                    <Link key={r.id} href={`/accounts/${r.account_id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                      <div className="w-12 shrink-0 text-xs font-medium text-slate-400">{dayName(r.work_date)}</div>
                      <Avatar name={r.person_name} url={r.avatar_url} size={38} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{r.person_name}</div>
                        <div className="truncate text-xs text-slate-500">{r.email}{r.note && r.note !== "Manual adjustment" ? ` · ${r.note}` : ""}{r.note === "Manual adjustment" ? " · Adjustment" : ""}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className={`text-sm font-semibold ${Number(r.amount_usd) < 0 ? "text-rose-600" : ""}`}>{usd(Number(r.amount_usd))}</div>
                        <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${r.payable ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{r.payable ? "Paid" : "Held"}</span>
                      </div>
                      <ChevronRight size={16} className="shrink-0 text-slate-300" />
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
          {weeks.length > shown && (
            <div className="text-center">
              <button onClick={() => setShown(shown + 4)} className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm">Show more weeks ({weeks.length - shown} left)</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}