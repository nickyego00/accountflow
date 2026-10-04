"use client";
import { useState } from "react"; import { useRouter } from "next/navigation"; import { toast } from "sonner";
import { supabase, } from "@/lib/supabase"; import { inputCls } from "@/components/ui";
export default function Login() {
  const [email, setEmail] = useState(""), [password, setPw] = useState(""), router = useRouter();
  return (<main className="flex min-h-screen items-center justify-center p-4">
    <div className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-8">
      <h1 className="text-xl font-semibold">Sign in to AccountFlow</h1>
      <input className={inputCls} placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
      <input className={inputCls} type="password" placeholder="Password" value={password} onChange={e=>setPw(e.target.value)}/>
      <button className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white" onClick={async()=>{
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) toast.error(error.message); else { router.push("/"); router.refresh(); } }}>Sign in</button>
    </div></main>);
}
