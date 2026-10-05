"use client";
import { Wallet, CalendarDays, TrendingUp, Trophy } from "lucide-react";
import { usd } from "@/lib/supabase";
const SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const monday = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
export default function WorkAnalysis({ records }: { records: { work_date: string; amount_usd: number | string }[] }) {
  const box = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  const recs = records.map(r => ({ d: new Date(r.work_date + "T00:00"), v: Number(r.amount_usd) })).filter(r => r.v > 0);
  if (recs.length === 0) return <section className={box}><h2 className="font-semibold">Work analysis</h2><p className="mt-2 text-sm text-slate-500">No work recorded yet, so there is nothing to analyse.</p></section>;
  const byDay = SHORT.map(() => 0);
  recs.forEach(r => { byDay[(r.d.getDay() + 6) % 7] += r.v; });
  const total = recs.reduce((s, r) => s + r.v, 0), maxDay = Math.max(...byDay), best = byDay.indexOf(maxDay);
  const daysWorked = new Set(recs.map(r => r.d.toDateString())).size;
  const thisWeek = monday(new Date());
  const weeks = Array.from({ length: 8 }, (_, i) => { const s = new Date(thisWeek); s.setDate(s.getDate() - 7 * (7 - i)); return { s, sum: 0 }; });
  recs.forEach(r => { const w = weeks.find(w => w.s.getTime() === monday(r.d).getTime()); if (w) w.sum += r.v; });
  const maxWeek = Math.max(...weeks.map(w => w.sum), 1), now = weeks[7].sum, prev = weeks[6].sum;
  const change = prev > 0 ? Math.round(((now - prev) / prev) * 100) : null;
  const tiles = [
    { l: "Total made", v: usd(total), Icon: Wallet, c: "from-blue-500 to-blue-600" },
    { l: "Days worked", v: String(daysWorked), Icon: CalendarDays, c: "from-violet-500 to-violet-600" },
    { l: "Average per day", v: usd(total / daysWorked), Icon: TrendingUp, c: "from-emerald-500 to-emerald-600" },
    { l: "Best weekday", v: FULL[best], Icon: Trophy, c: "from-rose-500 to-rose-600" }];
  return (<section className={`${box} space-y-7`}>
    <div><h2 className="font-semibold">Work analysis</h2><p className="text-sm text-slate-500">Based on {recs.length} work {recs.length === 1 ? "entry" : "entries"}</p></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{tiles.map(({ l, v, Icon, c }) =>
      <div key={l} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${c} text-white shadow-sm`}><Icon size={18} /></div>
        <div className="min-w-0"><div className="text-xs text-slate-500">{l}</div><div className="truncate text-base font-semibold">{v}</div></div></div>)}</div>
    <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">Most of the work lands on <b>{FULL[best]}</b>, which brings in <b>{usd(maxDay)}</b> ({Math.round((maxDay / total) * 100)}% of everything made).
      {change !== null && <> This week is <b className={change >= 0 ? "text-emerald-700" : "text-rose-700"}>{change >= 0 ? "up" : "down"} {Math.abs(change)}%</b> on last week.</>}</div>
    <div><div className="mb-3 text-sm font-medium text-slate-600">By day of the week</div>
      <div className="space-y-2.5">{SHORT.map((d, i) => { const pct = maxDay ? (byDay[i] / maxDay) * 100 : 0;
        return (<div key={d} className="flex items-center gap-3 text-sm"><span className="w-9 shrink-0 text-slate-600">{d}</span>
          <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className={`grow-x h-full rounded-full ${i === best ? "bg-gradient-to-r from-blue-500 to-violet-500" : "bg-blue-300"}`} style={{ width: `${pct}%`, animationDelay: `${i * 70}ms` }} /></div>
          <span className="w-24 shrink-0 text-right font-medium">{usd(byDay[i])}</span><span className="w-9 shrink-0 text-right text-xs text-slate-400">{Math.round((byDay[i] / total) * 100)}%</span></div>); })}</div></div>
    <div><div className="mb-3 text-sm font-medium text-slate-600">Last 8 weeks</div>
      <div className="flex h-48 items-end gap-2">{weeks.map((w, i) => { const h = w.sum > 0 ? Math.max(Math.round((w.sum / maxWeek) * 140), 8) : 3;
        return (<div key={i} className="flex flex-1 flex-col items-center justify-end gap-1.5"><span className="text-[10px] font-medium text-slate-500">{w.sum > 0 ? usd(w.sum) : ""}</span>
          <div className={`grow-y w-full rounded-t-lg ${w.sum === 0 ? "bg-slate-200" : i === 7 ? "bg-gradient-to-t from-blue-600 to-violet-500" : "bg-gradient-to-t from-blue-300 to-blue-200"}`} style={{ height: h, animationDelay: `${i * 80}ms` }} />
          <span className={`text-[10px] ${i === 7 ? "font-semibold text-blue-600" : "text-slate-500"}`}>{i === 7 ? "This week" : w.s.toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span></div>); })}</div></div>
  </section>);
}