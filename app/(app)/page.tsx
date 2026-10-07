"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase, usd, Account } from "@/lib/supabase";
import { Stat, IssueBadge } from "@/components/ui";
import { ADMIN_NAME } from "@/lib/config";
import DashboardHero from "@/components/DashboardHero";

type Acc = Account & { held_work: number; paid_work: number; people: { name: string } };

export default function Dashboard() {
  const router = useRouter();
  useEffect(() => { supabase.rpc("is_viewer").then(r => { if (r.data === true) router.replace("/accounts"); }); }, [router]);
  const [acc, setAcc] = useState<Acc[] | null>(null);
  const [people, setPeople] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const a = await supabase.from("account_totals").select("*, people(name)").order("updated_at", { ascending: false });
      const p = await supabase.from("people").select("id,name,avatar_url").order("name");
      setAcc((a.data as any) ?? []);
      setPeople(p.data ?? []);
    })();
  }, []);
  if (!acc) return <p className="text-slate-500">Loading…</p>;

  const issues = acc.filter(a => a.issue !== "No Issue");
  const work = acc.reduce((s, a) => s + Number(a.paid_work), 0);
  const earn = acc.reduce((s, a) => s + Number(a.earnings), 0);
  const held = acc.reduce((s, a) => s + Number(a.held_work), 0);
  const active = acc.filter(a => a.status === "Active").length;
  const top = Object.values(acc.reduce((m: any, a) => { const k = a.person_id; m[k] ??= { name: a.people.name, id: k, w: 0 }; m[k].w += Number(a.paid_work); return m; }, {})).sort((a: any, b: any) => b.w - a.w).slice(0, 5) as any[];
  const byPerson = Object.values(acc.reduce((m: any, a) => { const k = a.person_id; m[k] ??= { name: a.people.name, e: 0 }; m[k].e += Number(a.earnings); return m; }, {})).sort((a: any, b: any) => b.e - a.e) as any[];
  const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

  return (
    <div className="space-y-8">
      <DashboardHero name={ADMIN_NAME} people={people} accounts={acc.length} earnings={earn} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="People" value={people.length} />
        <Stat label="Accounts" value={acc.length} />
        <Stat label="Active accounts" value={active} />
        <Stat label="Inactive accounts" value={acc.length - active} />
        <Stat label="Total work (paid out)" value={usd(work)} />
        <Stat label="Total earnings" value={usd(earn)} accent />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className={card}>
          <h2 className="mb-3 font-semibold">Recent activity</h2>
          {acc.length === 0 && <p className="text-sm text-slate-500">No accounts yet. Add a person to get started.</p>}
          {acc.slice(0, 5).map(a => (
            <Link key={a.id} href={`/accounts/${a.id}`} className="flex justify-between rounded-lg px-2 py-2 text-sm hover:bg-slate-50">
              <span>{a.people.name} · {a.email}</span>
              <span className="text-slate-500">{new Date(a.updated_at).toLocaleDateString()}</span>
            </Link>
          ))}
        </section>
        <section className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-rose-700">Accounts with issues</h2>
            <b className="text-rose-600">{usd(held)} held</b>
          </div>
          {issues.length === 0 && <p className="text-sm text-slate-500">No issues.</p>}
          {issues.map(a => (
            <Link key={a.id} href={`/accounts/${a.id}`} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm hover:bg-white">
              <div className="min-w-0">
                <div className="truncate">{a.email}</div>
                <div className="mt-1"><IssueBadge i={a.issue} /></div>
              </div>
              <div className="shrink-0 text-right text-xs">
                <div className="text-slate-500">Paid {usd(Number(a.earnings))}</div>
                <b className="text-sm text-rose-600">Held {usd(Number(a.held_work))}</b>
              </div>
            </Link>
          ))}
        </section>
        <section className={card}>
          <h2 className="mb-3 font-semibold">Top performers</h2>
          {top.map((t, i) => (
            <Link key={t.id} href={`/people/${t.id}`} className="flex justify-between rounded-lg px-2 py-2 text-sm hover:bg-slate-50">
              <span>{i + 1}. {t.name}</span><b>{usd(t.w)}</b>
            </Link>
          ))}
        </section>
        <section className={card}>
          <h2 className="mb-3 font-semibold">Earnings by person</h2>
          {byPerson.length === 0 && <p className="text-sm text-slate-500">Nothing yet.</p>}
          {byPerson.map(t => (
            <div key={t.name} className="mb-3 text-sm">
              <div className="mb-1 flex justify-between"><span>{t.name}</span><span className="text-emerald-600">{usd(t.e)}</span></div>
              <div className="h-2 rounded bg-slate-100"><div className="h-2 rounded bg-emerald-500" style={{ width: `${earn ? (t.e / earn) * 100 : 0}%` }} /></div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}