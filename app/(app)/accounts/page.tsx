"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Layers, CheckCircle2, MinusCircle, AlertTriangle, Search, ChevronRight, CalendarClock } from "lucide-react";
import { supabase, usd } from "@/lib/supabase";
import PageHero from "@/components/PageHero";
import { deletesIn, nextPayday } from "@/lib/time";

export default function Accounts() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState("all");
  const [viewer, setViewer] = useState(true);
  useEffect(() => {
    supabase.rpc("is_viewer").then(r => setViewer(r.data === true));
    supabase.from("account_holdings").select("*").order("balance", { ascending: false }).then(r => setRows(r.data ?? []));
  }, []);
  if (!rows) return <p className="text-slate-500">Loading…</p>;

  const match = (r: any) => r.email.toLowerCase().includes(q.toLowerCase());
  const active = rows.filter(r => r.status === "Active");
  const inactive = rows.filter(r => r.status !== "Active");
  const issues = rows.filter(r => r.issue !== "No Issue");
  const balance = rows.reduce((s, r) => s + Number(r.balance), 0);
  const filters: [string, string, number][] = [["all", "All", rows.length], ["active", "Active", active.length], ["inactive", "Inactive", inactive.length], ["issues", "With issues", issues.length]];
  const showActive = sel === "all" || sel === "active";
  const showInactive = sel === "all" || sel === "inactive" || sel === "issues";
  const activeList = active.filter(match);
  const inactiveList = (sel === "issues" ? issues : inactive).filter(match);

  const row = (r: any, off: boolean) => {
    const bad = r.issue !== "No Issue";
    const tone = bad ? "bg-rose-50 text-rose-600" : off ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-600";
    const Icon = bad ? AlertTriangle : off ? MinusCircle : CheckCircle2;
    const body = (
      <div className={`flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm ${bad ? "border-rose-200 border-l-4 border-l-rose-500" : "border-slate-200"}`}>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tone}`}><Icon size={20} /></div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{r.email}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className={off ? "text-slate-500" : "font-medium text-emerald-700"}>{off ? "Inactive" : "Active"}</span>
            {bad && <span className="rounded-full bg-rose-100 px-2 py-0.5 font-semibold text-rose-700">{r.issue}</span>}
            {off && !bad && <span className="text-slate-400">No issue</span>}
          </div>
        </div>
        {bad ? (
          <div className="shrink-0 text-right">
            <div className="text-xs text-slate-500">Held</div>
            <div className="text-lg font-semibold text-rose-600">{usd(Number(r.held_work))}</div>
            <div className="text-[11px] font-medium text-rose-500">{deletesIn(r.suspended_at)}</div>
          </div>
        ) : (
          <div className="shrink-0 text-right">
            <div className="text-xs text-slate-500">Balance</div>
            <div className="text-lg font-semibold">{usd(Number(r.balance))}</div>
            <div className="text-[11px] text-slate-400">Total {usd(Number(r.total_work))}</div>
          </div>
        )}
        {!viewer && <ChevronRight size={18} className="shrink-0 text-slate-300" />}
      </div>
    );
    return viewer ? <div key={r.id}>{body}</div> : <Link key={r.id} href={`/accounts/${r.id}`} className="block">{body}</Link>;
  };

  return (
    <div className="space-y-6">
      <PageHero
        title="Accounts"
        description={`Balances clear every Wednesday. Next payday ${nextPayday()}.`}
        banner={{ label: "Balance awaiting payment", value: usd(balance) }}
        stats={[
          { label: "Accounts", value: String(rows.length), Icon: Layers },
          { label: "Active", value: String(active.length), Icon: CheckCircle2 },
          { label: "With issues", value: String(issues.length), Icon: AlertTriangle },
          { label: "Next payday", value: nextPayday(), Icon: CalendarClock },
        ]}
      />

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by email" className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
      </div>
      <div className="flex flex-wrap gap-2">
        {filters.map(([k, l, n]) => (
          <button key={k} onClick={() => setSel(k)} className={`rounded-full px-4 py-2 text-sm ${sel === k ? "bg-blue-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600"}`}>
            {l} <span className="opacity-70">{n}</span>
          </button>
        ))}
      </div>

      {showActive && (
        <>
          <h2 className="text-lg font-semibold">Active accounts <span className="ml-1 text-sm font-normal text-slate-400">{activeList.length}</span></h2>
          {activeList.length === 0 ? <p className="text-slate-500">No active accounts found.</p> : <div className="space-y-3">{activeList.map(r => row(r, false))}</div>}
        </>
      )}
      {showInactive && (
        <>
          <h2 className="text-lg font-semibold text-slate-700">{sel === "issues" ? "Accounts with issues" : "Inactive accounts"} <span className="ml-1 text-sm font-normal text-slate-400">{inactiveList.length}</span></h2>
          {inactiveList.length === 0 ? <p className="text-slate-500">No accounts found.</p> : <div className="space-y-3">{inactiveList.map(r => row(r, true))}</div>}
        </>
      )}
    </div>
  );
}