"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Users, Wallet, TrendingUp, CheckCircle2, List, Table2, ChevronRight } from "lucide-react";
import { supabase, usd, Account, uploadAvatar } from "@/lib/supabase";
import { Modal, Avatar, inputCls } from "@/components/ui";
import { ADMIN_NAME } from "@/lib/config";
import PeopleTable from "@/components/PeopleTable";
import PageHero from "@/components/PageHero";

type Acc = Account & { held_work: number; paid_work: number };

export default function People() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("name");
  const [view, setView] = useState<"list" | "table">("list");

  useEffect(() => {
    try { if (localStorage.getItem("people-view") === "table") setView("table"); } catch {}
  }, []);
  const chooseView = (v: "list" | "table") => {
    setView(v);
    try { localStorage.setItem("people-view", v); } catch {}
  };

  const load = useCallback(async () => {
    const { data: ppl } = await supabase.from("people").select("*");
    const { data: acc } = await supabase.from("account_totals").select("*");
    const all = (acc ?? []) as Acc[];
    setRows((ppl ?? []).map(p => {
      const a = all.filter(x => x.person_id === p.id);
      return {
        ...p, n: a.length,
        work: a.reduce((s, x) => s + Number(x.paid_work), 0),
        earn: a.reduce((s, x) => s + Number(x.earnings), 0),
        held: a.reduce((s, x) => s + Number(x.held_work), 0),
        isNick: p.name.trim().toLowerCase() === ADMIN_NAME.toLowerCase(),
        act: a.filter(x => x.status === "Active").length,
        upd: a.map(x => x.updated_at).sort().pop() ?? p.updated_at,
      };
    }));
  }, []);
  useEffect(() => { load(); }, [load]);

  const all = rows ?? [];
  const list = all.filter(r => r.name.toLowerCase().includes(q.toLowerCase())).sort((a, b) =>
    sort === "name" ? a.name.localeCompare(b.name)
    : sort === "work" ? b.work - a.work
    : sort === "earn" ? b.earn - a.earn
    : b.upd.localeCompare(a.upd));
  const tab = (on: boolean) =>
    `flex h-11 w-11 items-center justify-center rounded-lg ${on ? "bg-blue-600 text-white shadow-sm" : "border border-slate-300 bg-white text-slate-500"}`;

  const add = (
    <Modal title="Add person" trigger="+ Add person">
      {close => (
        <form className="space-y-3" onSubmit={async e => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const name = fd.get("name") as string;
          const file = fd.get("photo") as File;
          const { data, error } = await supabase.from("people").insert({ name }).select().single();
          if (error || !data) { toast.error(error?.message ?? "Could not add person"); return; }
          if (file && file.size > 0) await uploadAvatar(data.id, file);
          toast.success("Person added"); close(); load();
        }}>
          <input name="name" required placeholder="Full name" className={inputCls} />
          <label className="block text-sm text-slate-600">Profile photo (optional)
            <input name="photo" type="file" accept="image/*" className="mt-1 block w-full text-sm" />
          </label>
          <button className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white">Add person</button>
        </form>
      )}
    </Modal>
  );

  return (
    <div className="space-y-6">
      <PageHero
        title="People"
        description="Everyone you manage, with what they have earned."
        action={add}
        banner={{ label: "Everyone's earnings", value: usd(all.reduce((s, r) => s + r.earn, 0)) }}
        stats={[
          { label: "People", value: String(all.length), Icon: Users },
          { label: "Paid out", value: usd(all.reduce((s, r) => s + r.work, 0)), Icon: Wallet },
          { label: "Held", value: usd(all.reduce((s, r) => s + r.held, 0)), Icon: TrendingUp },
          { label: "Active accounts", value: String(all.reduce((s, r) => s + r.act, 0)), Icon: CheckCircle2 },
        ]}
      />

      <div className="flex gap-3">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search people" className={inputCls} />
        <select value={sort} onChange={e => setSort(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 text-sm">
          <option value="name">Name</option><option value="work">Work</option><option value="earn">Earnings</option><option value="upd">Last updated</option>
        </select>
        <button onClick={() => chooseView("list")} aria-label="List view" className={tab(view === "list")}><List size={18} /></button>
        <button onClick={() => chooseView("table")} aria-label="Table view" className={tab(view === "table")}><Table2 size={18} /></button>
      </div>

      {!rows ? <p className="text-slate-500">Loading…</p> : list.length === 0 ? <p className="text-slate-500">No people yet. Add your first person.</p> : view === "table" ? (
        <PeopleTable rows={list} />
      ) : (
        <div className="space-y-3">
          {list.map(p => (
            <Link key={p.id} href={`/people/${p.id}`} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <Avatar name={p.name} url={p.avatar_url} size={52} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <b className="truncate text-base">{p.name}</b>
                  {p.isNick && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">Admin</span>}
                </div>
                <div className="text-xs text-slate-500">{p.n} {p.n === 1 ? "account" : "accounts"} · {p.act} active, {p.n - p.act} inactive</div>
              </div>
              <div className="hidden text-right text-sm text-slate-500 sm:block">
                <div className="text-xs">Paid out</div>
                <div className="font-medium text-slate-700">{usd(p.work)}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-emerald-600">{usd(p.earn)}</div>
                {p.held > 0 && <div className="text-xs font-medium text-rose-600">{usd(p.held)} held</div>}
              </div>
              <ChevronRight size={18} className="shrink-0 text-slate-300" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}