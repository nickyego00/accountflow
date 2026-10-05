"use client";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { ArrowRight, Users, BarChart3 } from "lucide-react";
import { Avatar } from "@/components/ui";
import { usd } from "@/lib/supabase";

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];
const container: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 12, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease } },
};
const media: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease } },
};

type P = { id: string; name: string; avatar_url?: string | null };

export default function DashboardHero({ name, people, accounts, earnings }: { name: string; people: P[]; accounts: number; earnings: number }) {
  const reduce = useReducedMotion();
  const shown = people.slice(0, 6);
  const cards = [
    { title: "People", subtitle: `${people.length} ${people.length === 1 ? "person" : "people"} · ${accounts} accounts`, href: "/people", cta: "View people", Icon: Users, bg: "from-blue-600 via-blue-600 to-violet-600" },
    { title: "Reports", subtitle: `${usd(earnings)} earned on paid accounts`, href: "/reports", cta: "Open reports", Icon: BarChart3, bg: "from-emerald-500 via-emerald-600 to-teal-600" },
  ];
  return (
    <motion.section variants={container} initial={reduce ? false : "hidden"} animate="visible" className="space-y-8">
      <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-2 lg:gap-16">
        <motion.h1 variants={item} className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl md:text-5xl">
          Welcome back, {name}
        </motion.h1>
        <div className="flex flex-col items-start gap-5">
          <motion.p variants={item} className="max-w-sm text-sm text-slate-500 sm:text-base">
            Your people, their accounts and everything they earn, all in one place.
          </motion.p>
          {shown.length > 0 && (
            <motion.div variants={item} className="flex flex-col items-start gap-3">
              <p className="text-sm font-semibold">You manage {people.length} {people.length === 1 ? "person" : "people"}</p>
              <div className="flex items-center">
                {shown.map(p => (
                  <div key={p.id} className="-ml-2.5 first:ml-0"><Avatar name={p.name} url={p.avatar_url} size={38} /></div>
                ))}
                {people.length > shown.length && (
                  <div className="-ml-2.5 flex h-[38px] w-[38px] items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600 ring-2 ring-white">+{people.length - shown.length}</div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
      <motion.div variants={media} className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {cards.map(({ title, subtitle, href, cta, Icon, bg }) => (
          <Link key={title} href={href} className={`relative isolate block aspect-[16/8] overflow-hidden rounded-2xl bg-gradient-to-br ${bg} p-6 text-white shadow-lg sm:p-8`}>
            <div aria-hidden className="absolute -right-10 -top-10 -z-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div aria-hidden className="absolute -bottom-16 left-1/3 -z-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
            <Icon aria-hidden className="absolute bottom-4 right-5 -z-10 h-24 w-24 text-white/15 sm:h-32 sm:w-32" />
            <div className="flex h-full flex-col items-start">
              <h3 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h3>
              <p className="mt-1 text-sm text-white/80">{subtitle}</p>
              <span className="mt-auto inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm">
                {cta} <ArrowRight size={15} />
              </span>
            </div>
          </Link>
        ))}
      </motion.div>
    </motion.section>
  );
}