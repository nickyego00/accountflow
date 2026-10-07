"use client";
import { motion, useReducedMotion, type Variants } from "motion/react";

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];
const container: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 12, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease } },
};

export type HeroStat = { label: string; value: string; Icon: any };

export default function PageHero({
  title, description, action, banner, stats,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  banner?: { label: string; value: string };
  stats: HeroStat[];
}) {
  const reduce = useReducedMotion();
  return (
    <motion.section variants={container} initial={reduce ? false : "hidden"} animate="visible" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl space-y-2">
          <motion.h1 variants={item} className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">{title}</motion.h1>
          <motion.p variants={item} className="text-sm text-slate-500 sm:text-base">{description}</motion.p>
        </div>
        {action && <motion.div variants={item}>{action}</motion.div>}
      </div>
      <motion.div variants={item} className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-600 to-violet-600 p-6 text-white shadow-lg sm:p-8">
        <div aria-hidden className="absolute -right-10 -top-10 -z-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        {banner && (
          <>
            <div className="text-sm text-blue-100">{banner.label}</div>
            <div className="mt-1 text-4xl font-semibold sm:text-5xl">{banner.value}</div>
          </>
        )}
        <div className={`grid grid-cols-2 gap-3 text-sm lg:grid-cols-4 ${banner ? "mt-6" : ""}`}>
          {stats.map(({ label, value, Icon }) => (
            <div key={label} className="rounded-2xl bg-white/15 p-3 backdrop-blur">
              <div className="flex items-center gap-1.5 text-xs text-blue-100"><Icon size={14} />{label}</div>
              <div className="mt-1 text-base font-semibold sm:text-lg">{value}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.section>
  );
}