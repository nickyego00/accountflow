"use client";
import { useEffect, useState } from "react"; import { useRouter } from "next/navigation"; import { toast } from "sonner";
import { supabase } from "@/lib/supabase"; import { downloadCsv } from "@/lib/export";
export default function Settings() {
  const router = useRouter(), [email, setEmail] = useState(""), [log, setLog] = useState<any[]>([]);
  useEffect(() => { supabase.auth.getUser().then(r => setEmail(r.data.user?.email ?? ""));
    supabase.from("audit_log").select("*").order("at", { ascending: false }).limit(50).then(r => setLog(r.data ?? [])); }, []);
  const exp = async (table: string, file: string) => { const { data } = await supabase.from(table).select("*"); if (!data?.length) { toast.error("Nothing to export yet"); return; }
    const cols = Object.keys(data[0]); downloadCsv(file, [cols, ...data.map((r: any) => cols.map(c => r[c] ?? ""))]); };
  const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", btn = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50";
  return (<div className="space-y-6"><h1 className="text-2xl font-semibold">Settings</h1>
    <section className={card}><h2 className="mb-1 font-semibold">Your login</h2><p className="mb-3 text-sm text-slate-500">{email}</p>
      <button className={btn} onClick={async () => { await supabase.auth.signOut({ scope: "global" }); router.push("/login"); }}>Sign out on all devices</button></section>
    <section className={card}><h2 className="mb-3 font-semibold">Export your data (CSV)</h2><div className="flex flex-wrap gap-2">
      <button className={btn} onClick={() => exp("people", "people.csv")}>People</button><button className={btn} onClick={() => exp("account_totals", "accounts.csv")}>Accounts</button>
      <button className={btn} onClick={() => exp("work_records", "work-history.csv")}>Work history</button><button className={btn} onClick={() => exp("payments", "payments.csv")}>Payments</button></div></section>
    <section className={card}><h2 className="mb-3 font-semibold">Change log (last 50)</h2>
      {log.length === 0 ? <p className="text-sm text-slate-500">No changes recorded yet.</p> : log.map(l => <div key={l.id} className="border-t border-slate-100 py-2 text-sm first:border-0">
        <div className="flex justify-between gap-3"><b>{l.action}</b><span className="shrink-0 text-xs text-slate-500">{new Date(l.at).toLocaleString()}</span></div>
        <div className="text-xs text-slate-500">{l.by_user}</div><div className="break-all text-xs text-slate-400">{l.detail}</div></div>)}</section>
  </div>);
}