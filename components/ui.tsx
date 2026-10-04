"use client";
import { useState } from "react";
import { X } from "lucide-react";
export const Badge = ({ tone, children }: { tone: "green"|"gray"|"amber"|"red"; children: React.ReactNode }) => {
  const c = { green:"bg-emerald-50 text-emerald-700", gray:"bg-slate-100 text-slate-600", amber:"bg-amber-50 text-amber-700", red:"bg-rose-50 text-rose-700" }[tone];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${c}`}>{children}</span>;
};
export const StatusBadge = ({ s }: { s: string }) => <Badge tone={s==="Active"?"green":"gray"}>{s}</Badge>;
export const IssueBadge = ({ i }: { i: string }) => <Badge tone={i==="No Issue"?"gray":i==="Account Suspended"?"amber":"red"}>{i}</Badge>;
export const Stat = ({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-sm text-slate-500">{label}</div>
  <div className={`mt-1 text-2xl font-semibold ${accent?"text-emerald-600":"text-slate-900"}`}>{value}</div></div>);
export function Modal({ title, trigger, children }: { title: string; trigger: string; children: (close: () => void) => React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (<>
    <button onClick={()=>setOpen(true)} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white">{trigger}</button>
    {open && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-6"><div className="mb-4 flex justify-between"><h2 className="font-semibold">{title}</h2>
      <button onClick={()=>setOpen(false)} aria-label="Close"><X size={18}/></button></div>{children(()=>setOpen(false))}</div></div>}
  </>);
}
export const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm";
