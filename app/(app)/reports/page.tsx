"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, CheckCircle2, MinusCircle, AlertTriangle, Wallet, TrendingUp, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { supabase, usd } from "@/lib/supabase";
import { Avatar, StatusBadge, IssueBadge, inputCls } from "@/components/ui";
import PageHero from "@/components/PageHero";

const ymd = (d: Date) => d.toLocaleDateString("en-CA");
function range(p: string, from: string, to: string): [string, string] {
  const t = new Date();
  const today = ymd(t);
  if (p === "today") return [today, today];
  if (p === "week") {
    const s = new Date(t);
    s.setDate(t.getDate() - ((t.getDay() + 6) % 7));
    return [ymd(s), today];
  }
  if (p === "month") return [today.slice(0, 8) + "01", today];
  if (p === "custom") return [from || "0000-01-01", to || "9999-12-31"];
  return ["0000-01-01", "9999-12-31"];
}

type Row = { key: string; name: string; sub?: string; avatar?: string | null; work: number; earn: number; href: string };

const Ranked = ({ title, rows, showAvatar }: { title: string; rows: Row[]; showAvatar?: boolean }) => {
  const max = Math.max(...rows.map(r => r.work), 1);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 font-semibold">{title}</h2>
      {rows.length === 0 ? <p className="text-sm text-slate-500">No work in this period.</p> : (
        <div className="space-y-1">
          {rows.map((r, i) => (
            <Link key={r.key} href={r.href} className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50">
              {showAvatar
                ? <Avatar name={r.name} url={r.avatar} size={40} />
                : <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600">{i + 1}</div>}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium">{r.name}</span>
                  <b className="shrink-0 text-sm text-emerald-600">{usd(r.earn)}</b>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="grow-x h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500" style={{ width: `${(r.work / max) * 100}%`, animationDelay: `${i * 60}ms` }} />
                </div>
                <div className="mt-1 text-xs text-slate-500">{usd(r.work)} work{r.sub ? ` · ${r.sub}` : ""}</div>
              </div>
              <ChevronRight size={16} className="shrink-0 text-slate-300" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

export default function Reports() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [accs, setAccs] = useState<any[]>([]);
  const [p, setP] = useState("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("work_records").select("work_date, amount_usd, accounts(id,email,rate,issue,people(id,name,avatar_url))").then(r => setRows(r.data ?? []));
    supabase.from("account_totals").select("id,email,status,issue,total_work,people(name)").order("total_work", { ascending: false }).then(r => setAccs(r.data ?? []));
  }, []);
  if (!rows) return <p className="text-slate-500">Loading…</p>;

  const [a, b] = range(p, from, to);
  const list = rows.filter(r => r.work_date >= a && r.work_date <= b && r.accounts.issue === "No Issue");
  const work = list.reduce((s, r) => s + Number(r.amount_usd), 0);
  const earn = list.reduce((s, r) => s + Number(r.amount_usd) * Number(r.accounts.rate), 0);

  const rank = (pick: (r: any) => Row): Row[] => {
    const m: Record<string, Row> = {};
    list.forEach(r => {
      const x = pick(r);
      m[x.key] ??= x;
      m[x.key].work += Number(r.amount_usd);
      m[x.key].earn += Number(r.amount_usd) * Number(r.accounts.rate);
    });
    return Object.values(m).sort((x, y) => y.work - x.work);
  };
  const people = rank(r => ({ key: r.accounts.people.id, name: r.accounts.people.name, avatar: r.accounts.people.avatar_url, work: 0, earn: 0, href: `/people/${r.accounts.people.id}` }));
  const accounts = rank(r => ({ key: r.accounts.id, name: r.accounts.email, sub: r.accounts.people.name, work: 0, earn: 0, href: `/accounts/${r.accounts.id}` }));

  const dates = list.map(r => r.work_date).sort();
  const span = dates.length ? (new Date(dates[dates.length - 1]).getTime() - new Date(dates[0]).getTime()) / 864e5 : 0;
  const monthly = span > 45;
  const buckets: Record<string, number> = {};
  list.forEach(r => { const k = monthly ? r.work_date.slice(0, 7) : r.work_date; buckets[k] = (buckets[k] || 0) + Number(r.amount_usd); });
  const series = Object.entries(buckets).sort((x, y) => x[0].localeCompare(y[0])).slice(-14);
  const maxS = Math.max(...series.map(s => s[1]), 1);
  const label = (k: string) => monthly
    ? new Date(k + "-01T00:00").toLocaleDateString(undefined, { month: "short" })
    : new Date(k + "T00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" });

  const periods = [["today", "Today"], ["week", "This week"], ["month", "This month"], ["all", "All time"], ["custom", "Custom"]];
  const groups: [string, string, any[], any, string][] = [
    ["all", "All accounts", accs, Users, "bg-slate-100 text-slate-600"],
    ["active", "Active accounts", accs.filter(x => x.status === "Active"), CheckCircle2, "bg-emerald-50 text-emerald-600"],
    ["inactive", "Inactive accounts", accs.filter(x => x.status !== "Active"), MinusCircle, "bg-slate-100 text-slate-500"],
    ["issues", "With issues", accs.filter(x => x.issue !== "No Issue"), AlertTriangle, "bg-rose-50 text-rose-600"],
  ];

  return (
    <div className="space-y-6">
      <PageHero
        title="Reports"
        description="Paid accounts only. Accounts with issues are left out of the money figures."
        banner={{ label: `Total earnings · ${periods.find(x => x[0] === p)?.[1]}`, value: usd(earn) }}
        stats={[
          { label: "Work done", value: usd(work), Icon: Wallet },
          { label: "Work entries", value: String(list.length), Icon: FileText },
          { label: "Avg per entry", value: usd(list.length ? work / list.length : 0), Icon: TrendingUp },
          { label: "Accounts", value: String(accs.length), Icon: Users },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2">
        {periods.map(([k, l]) => (
          <button key={k} onClick={() => setP(k)} className={`rounded-full px-4 py-2 text-sm ${p === k ? "bg-blue-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600"}`}>{l}</button>
        ))}
        {p === "custom" && (
          <>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={inputCls + " !w-auto"} />
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className={inputCls + " !w-auto"} />
          </>
        )}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold">Work over time</h2>
        <p className="mb-4 text-sm text-slate-500">{monthly ? "Per month" : "Per day"}, latest {series.length}</p>
        {series.length === 0 ? <p className="text-sm text-slate-500">No work in this period.</p> : (
          <div className="flex h-52 items-end gap-2">
            {series.map(([k, v], i) => (
              <div key={k} className="flex flex-1 flex-col items-center justify-end gap-1.5">
                <span className="text-[10px] font-medium text-slate-500">{usd(v)}</span>
                <div className={`grow-y w-full rounded-t-lg ${i === series.length - 1 ? "bg-gradient-to-t from-blue-600 to-violet-500" : "bg-gradient-to-t from-blue-300 to-blue-200"}`} style={{ height: Math.max(Math.round((v / maxS) * 150), 6), animationDelay: `${i * 60}ms` }} />
                <span className="text-[10px] text-slate-500">{label(k)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {groups.map(([k, l, items, Icon, tone]) => (
          <div key={k}>
            <button onClick={() => setSel(sel === k ? null : k)} className="flex w-full items-center gap-4 rounded-xl p-3 text-left hover:bg-slate-50">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tone}`}><Icon size={20} /></div>
              <div className="flex-1"><div className="font-medium">{l}</div><div className="text-xs text-slate-500">{sel === k ? "Click to hide" : "Click to view"}</div></div>
              <div className="text-xl font-semibold">{items.length}</div>
              <ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform ${sel === k ? "rotate-180" : ""}`} />
            </button>
            {sel === k && (
              <div className="rise-in mx-3 mb-3 border-t border-slate-100">
                {items.length === 0 ? <p className="py-3 text-sm text-slate-500">Nothing here.</p> : items.map((x: any) => (
                  <Link key={x.id} href={`/accounts/${x.id}`} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-2.5 text-sm last:border-0 hover:bg-slate-50">
                    <div className="min-w-0"><div className="truncate font-medium">{x.email}</div><div className="text-xs text-slate-500">{x.people?.name}</div></div>
                    <div className="flex items-center gap-2"><StatusBadge s={x.status} />{x.issue !== "No Issue" && <IssueBadge i={x.issue} />}<b>{usd(Number(x.total_work))}</b></div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>

      <div className="space-y-6">
        <Ranked title="By person" rows={people} showAvatar />
        <Ranked title="By account" rows={accounts} />
      </div>
    </div>
  );
}