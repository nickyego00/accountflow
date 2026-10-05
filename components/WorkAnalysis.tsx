"use client";
import { usd } from "@/lib/supabase";
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const monday = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
export default function WorkAnalysis({ records }: { records: { work_date: string; amount_usd: number | string }[] }) {
  const box = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  const recs = records.map(r => ({ d: new Date(r.work_date + "T00:00"), v: Number(r.amount_usd) })).filter(r => r.v > 0);
  if (recs.length === 0) return <section className={box}><h2 className="font-semibold">Work analysis</h2><p className="mt-2 text-sm text-slate-500">No work recorded yet, so there is nothing to analyse.</p></section>;
  const byDay = DAYS.map(() => ({ sum: 0 }));
  recs.forEach(r => { byDay[(r.d.getDay() + 6) % 7].sum += r.v; });
  const total = recs.reduce((s, r) => s + r.v, 0), maxDay = Math.max(...byDay.map(x => x.sum)), best = byDay.findIndex(x => x.sum === maxDay);
  const daysWorked = new Set(recs.map(r => r.d.toDateString())).size, last = new Date(Math.max(...recs.map(r => r.d.getTime())));
  const thisWeek = monday(new Date());
  const weeks = Array.from({ length: 8 }, (_, i) => { const s = new Date(thisWeek); s.setDate(s.getDate() - 7 * (7 - i)); return { s, sum: 0 }; });
  recs.forEach(r => { const m = monday(r.d).getTime(), w = weeks.find(w => w.s.getTime() === m); if (w) w.sum += r.v; });
  const maxWeek = Math.max(...weeks.map(w => w.sum), 1);
  const tiles: [string, string][] = [["Total made", usd(total)], ["Days worked", String(daysWorked)], ["Average per day", usd(total / daysWorked)], ["Best weekday", `${DAYS[best]} · ${usd(maxDay)}`], ["Last work", last.toLocaleDateString(undefined, { month: "short", day: "numeric" })]];
  const bar = (v: number, max: number, hi: boolean) => <div className={`w-full rounded-t-md ${hi ? "bg-blue-600" : "bg-blue-300"}`} style={{ height: v > 0 ? Math.max(Math.round((v / max) * 110), 4) : 0 }} />;
  return (<section className={`${box} space-y-6`}><h2 className="font-semibold">Work analysis</h2>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{tiles.map(([l, v]) => <div key={l} className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">{l}</div><div className="mt-1 text-sm font-semibold">{v}</div></div>)}</div>
    <div><div className="mb-2 text-sm font-medium text-slate-600">By day of the week</div>
      <div className="flex h-40 items-end gap-2">{byDay.map((x, i) => <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
        <span className="text-[10px] text-slate-500">{x.sum > 0 ? usd(x.sum) : ""}</span>{bar(x.sum, maxDay, i === best)}<span className="text-xs text-slate-600">{DAYS[i]}</span></div>)}</div></div>
    <div><div className="mb-2 text-sm font-medium text-slate-600">Last 8 weeks</div>
      <div className="flex h-40 items-end gap-2">{weeks.map((w, i) => <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
        <span className="text-[10px] text-slate-500">{w.sum > 0 ? usd(w.sum) : ""}</span>{bar(w.sum, maxWeek, i === 7)}<span className="text-[10px] text-slate-600">{w.s.toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span></div>)}</div></div>
  </section>);
}