"use client";
import Link from "next/link"; import { usePathname, useRouter } from "next/navigation"; import { useState, useEffect } from "react";
import { LayoutDashboard, Users, Wallet, History, BarChart3, Settings, Menu, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
const nav = [["/","Dashboard",LayoutDashboard],["/people","People",Users],["/accounts","Accounts",Wallet],["/work","Work History",History],["/reports","Reports",BarChart3],["/settings","Settings",Settings]] as const;
export default function Sidebar() {
  const path = usePathname(), router = useRouter(), [open, setOpen] = useState(false), [viewer, setViewer] = useState(false);
  useEffect(()=>{ supabase.rpc("is_viewer").then(r=>setViewer(r.data===true)); },[]);
  return (<>
    <header className="flex items-center justify-between bg-slate-900 p-4 text-white lg:hidden"><b>AccountFlow</b><button onClick={()=>setOpen(!open)} aria-label="Menu"><Menu/></button></header>
    <aside className={`${open?"block":"hidden"} w-full bg-slate-900 p-4 text-slate-300 lg:fixed lg:inset-y-0 lg:block lg:w-60`}>
      <div className="px-3 text-lg font-semibold text-white">AccountFlow</div>
      <div className="mb-8 mt-3 flex items-center gap-3 px-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-sm font-semibold text-white">{viewer?"V":"N"}</div>
        <div className="text-sm"><div className="font-medium text-white">{viewer?"Viewer":"Nick"}</div><div className="text-xs text-slate-400">{viewer?"View only":"Admin"}</div></div></div>
      <nav className="space-y-1">{nav.filter(n=>!viewer||n[0]==="/accounts").map(([href,label,Icon])=>{ const on = href==="/"?path==="/":path.startsWith(href);
        return <Link key={href} href={href} onClick={()=>setOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm ${on?"bg-slate-800 text-white":"hover:bg-slate-800/60"}`}><Icon size={18}/>{label}</Link>;})}</nav>
      <button onClick={async()=>{await supabase.auth.signOut(); router.push("/login");}} className="mt-6 flex items-center gap-3 px-3 py-3 text-sm"><LogOut size={18}/>Log out</button>
    </aside></>);
}