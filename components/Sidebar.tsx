"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LayoutDashboard, Users, Wallet, History, BarChart3, Settings, Menu, LogOut } from "lucide-react";
import { supabase, currency, setCurrency } from "@/lib/supabase";
import { ADMIN_NAME, USD_TO_KES } from "@/lib/config";

const nav = [["/", "Dashboard", LayoutDashboard], ["/people", "People", Users], ["/accounts", "Accounts", Wallet], ["/work", "Work History", History], ["/reports", "Reports", BarChart3], ["/settings", "Settings", Settings]] as const;

export default function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [viewer, setViewer] = useState(false);
  const [cur, setCur] = useState<"USD" | "KES">("USD");
  useEffect(() => {
    supabase.rpc("is_viewer").then(r => setViewer(r.data === true));
    setCur(currency());
  }, []);
  const choose = (c: "USD" | "KES") => {
    if (c === cur) return;
    setCurrency(c);
    window.location.reload();
  };

  return (
    <>
      <header className="flex items-center justify-between bg-slate-900 p-4 text-white lg:hidden">
        <b>AccountFlow</b>
        <button onClick={() => setOpen(!open)} aria-label="Menu"><Menu /></button>
      </header>
      <aside className={`${open ? "block" : "hidden"} w-full bg-slate-900 p-4 text-slate-300 lg:fixed lg:inset-y-0 lg:block lg:w-60`}>
        <div className="flex items-center gap-2 px-3 text-lg font-semibold text-white"><span className="h-3 w-3 rounded-full bg-blue-500" />AccountFlow</div>
        <div className="mb-4 mt-5 flex items-center gap-3 rounded-xl bg-slate-800 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500 text-sm font-semibold text-white">{viewer ? "V" : ADMIN_NAME[0]}</div>
          <div className="text-sm">
            <div className="font-medium text-white">{viewer ? "Viewer" : ADMIN_NAME}</div>
            <div className="text-xs text-slate-400">{viewer ? "View only" : "Admin"}</div>
          </div>
        </div>
        <div className="mb-6 rounded-xl bg-slate-800 p-1.5">
          <div className="grid grid-cols-2 gap-1 text-xs font-medium">
            {(["USD", "KES"] as const).map(c => (
              <button key={c} onClick={() => choose(c)} className={`rounded-lg py-2 ${cur === c ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"}`}>
                {c === "USD" ? "$ USD" : "KSh KES"}
              </button>
            ))}
          </div>
          <div className="mt-1.5 text-center text-[11px] text-slate-400">KSh {USD_TO_KES} = $1</div>
        </div>
        <nav className="space-y-1">
          {nav.filter(n => !viewer || n[0] === "/accounts").map(([href, label, Icon]) => {
            const on = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-lg border-l-4 px-3 py-3 text-sm ${on ? "border-blue-500 bg-slate-800 text-white" : "border-transparent hover:bg-slate-800/60"}`}>
                <Icon size={18} />{label}
              </Link>
            );
          })}
        </nav>
        <button onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }} className="mt-6 flex items-center gap-3 px-3 py-3 text-sm"><LogOut size={18} />Log out</button>
      </aside>
    </>
  );
}