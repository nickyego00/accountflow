"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, useReducedMotion } from "motion/react";
import { Loader2, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";

const enter = (i: number): React.CSSProperties => ({ animationDelay: `${i * 80}ms` });

const jitter = (i: number) => {
  const value = Math.sin(i + 1) * 10000;
  return value - Math.floor(value);
};

const FloatingPaths = ({ position }: { position: number }) => {
  const reduceMotion = useReducedMotion();
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${152 - i * 5 * position} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${684 - i * 5 * position} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
  }));

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg className="h-full w-full text-blue-300" fill="none" viewBox="0 0 696 316">
        {paths.map(path => (
          <motion.path
            key={path.id}
            d={path.d}
            initial={{ pathLength: 0.3 }}
            animate={reduceMotion ? undefined : { pathLength: 1, pathOffset: [0, 1, 0] }}
            stroke="currentColor"
            className="opacity-60"
            strokeOpacity={0.1 + path.id * 0.03}
            strokeWidth={path.width}
            transition={{
              duration: 20 + jitter(path.id) * 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </div>
  );
};

const Brand = ({ dark }: { dark?: boolean }) => (
  <div className="flex items-center gap-2.5">
    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-bold text-white shadow-sm">A</div>
    <span className={`font-display text-lg font-semibold tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>AccountFlow</span>
  </div>
);

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  };

  const field =
    "w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";

  return (
    <section className="relative min-h-screen overflow-hidden bg-slate-50 lg:grid lg:grid-cols-2">
      <aside className="relative hidden h-full flex-col overflow-hidden bg-slate-900 p-10 lg:flex">
        <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-transparent to-violet-600/20" />
        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>

        <div className="rise-in relative z-10">
          <Brand dark />
        </div>

        <figure style={enter(3)} className="rise-in relative z-10 mt-auto flex flex-col gap-3">
          <blockquote className="font-display text-3xl font-semibold leading-tight tracking-tight text-white">
            Every account, every amount,{" "}
            <span className="bg-gradient-to-r from-blue-300 to-violet-300 bg-clip-text text-transparent">calculated for you.</span>
          </blockquote>
          <figcaption className="text-sm text-slate-300">
            People, accounts, work and earnings, all in one place.
          </figcaption>
        </figure>
      </aside>

      <div className="relative flex min-h-screen flex-col justify-center px-6 sm:px-8 lg:min-h-0">
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0 opacity-70">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-200/50 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-violet-200/50 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto w-full space-y-6 sm:max-w-sm">
          <div className="rise-in lg:hidden">
            <Brand />
          </div>

          <div className="flex flex-col gap-2">
            <h1 style={enter(1)} className="rise-in font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Welcome back.
            </h1>
            <p style={enter(2)} className="rise-in text-sm text-slate-500">
              Sign in with your email and password to continue.
            </p>
          </div>

          <form onSubmit={submit} style={enter(3)} className="rise-in space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Email</span>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={field}
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Password</span>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={show ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Your password"
                  className={field + " pr-11"}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-70"
            >
              {loading && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
              {loading ? "Signing in…" : "Sign in"}
            </button>
            <span role="status" className="sr-only">{loading ? "Signing in" : ""}</span>
          </form>

          <p style={enter(4)} className="rise-in text-xs text-slate-400">
            Private workspace. Access is by invitation only.
          </p>
        </div>
      </div>
    </section>
  );
}