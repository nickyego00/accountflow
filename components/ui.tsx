"use client";
import { useState } from "react";
import { X } from "lucide-react";
const palette = ["bg-blue-600","bg-emerald-600","bg-amber-500","bg-rose-500","bg-sky-600","bg-violet-600","bg-teal-600"];
export const Avatar = ({ name, url, size = 48 }: { name: string; url?: string|null; size?: number }) => {
  const bg = palette[[...name].reduce((s,c)=>s+c.charCodeAt(0),0) % palette.length], style = { width: size, height: size };
  return url
    ? <img src={url} alt={name} style={style} className="shrink-0 rounded-full object-cover shadow-sm ring-2 ring-white"/>
    : <div style={{ ...style, fontSize: size/2.8 }} className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-sm ring-2 ring-white ${bg}`}>{name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}</div>;
};
export const Badge = ({ tone, children }: { tone: "green"|"gray"|"amber"|"red"; children: React.ReactNode }) => {
  const c = { green:"bg-emerald-50 text-emerald-700", gray:"bg-slate-100 text-slate-600", amber:"bg-amber-50 text-amber-700", red:"bg-rose-50 text-rose-700" }[tone];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${c}`}>{children}</span>;
};
export const StatusBadge = ({ s }: { s: string }) => <Badge tone={s==="Active"?"green":"gray"}>{s}</Badge>;
export const IssueBadge = ({ i }: { i: string }) => <Badge tone={i==="No Issue"?"gray":i==="Account Suspended"?"amber":"red"}>{i}</Badge>;
export const Stat = ({ label, value, accent, gold }: { label: string; value: React.ReactNode; accent?: boolean; gold?: boolean }) => (
  <div className={`rounded-2xl border p-4 shadow-sm ${gold?"border-violet-200 bg-gradient-to-br from-violet-50 to-white":accent?"border-emerald-200 bg-gradient-to-br from-emerald-50 to-white":"border-slate-200 bg-white"}`}>
    <div className={`text-sm ${gold?"text-violet-700":"text-slate-500"}`}>{label}</div>
    <div className={`mt-1 text-2xl font-semibold ${gold?"text-violet-600":accent?"text-emerald-600":"text-slate-900"}`}>{value}</div></div>);
export function Modal({ title, trigger, children }: { title: string; trigger: string; children: (close: () => void) => React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (<>
    <button onClick={()=>setOpen(true)} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700">{trigger}</button>
    {open && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><div className="mb-4 flex justify-between"><h2 className="font-semibold">{title}</h2>
      <button onClick={()=>setOpen(false)} aria-label="Close"><X size={18}/></button></div>{children(()=>setOpen(false))}</div></div>}
  </>);
}
export const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";