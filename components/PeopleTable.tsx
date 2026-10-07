"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Blobatar } from "@blobatar/react";
import { usd } from "@/lib/supabase";

export type PersonRow = {
  id: string;
  name: string;
  avatar_url?: string | null;
  n: number;
  act: number;
  work: number;
  earn: number;
  held: number;
  isNick?: boolean;
};

const cell = "px-4 py-3 align-middle";

export default function PeopleTable({ rows }: { rows: PersonRow[] }) {
  const router = useRouter();
  const total = (pick: (r: PersonRow) => number) => rows.reduce((s, r) => s + pick(r), 0);

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
        <caption className="sr-only">People</caption>
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <th scope="col" className={`${cell} font-medium`}>Person</th>
            <th scope="col" className={`${cell} font-medium`}>Accounts</th>
            <th scope="col" className={`${cell} text-right font-medium`}>Paid out</th>
            <th scope="col" className={`${cell} text-right font-medium`}>Earnings</th>
            <th scope="col" className={`${cell} text-right font-medium`}>Held</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr
              key={r.id}
              onClick={() => router.push(`/people/${r.id}`)}
              className="cursor-pointer border-b border-slate-100 transition-colors duration-150 last:border-0 hover:bg-blue-50/60"
            >
              <td className={cell}>
                <div className="flex items-center gap-3">
                  {r.avatar_url ? (
                    <img src={r.avatar_url} alt="" className="size-9 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <Blobatar name={r.id} background="squircle" alt="" className="size-9 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <Link
                      href={`/people/${r.id}`}
                      onClick={e => e.stopPropagation()}
                      className="block truncate font-medium hover:text-blue-600"
                    >
                      {r.name}
                    </Link>
                    {r.isNick && (
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700">Admin</span>
                    )}
                  </div>
                </div>
              </td>
              <td className={cell}>
                <div className="font-medium">{r.n}</div>
                <div className="text-xs text-slate-500">{r.act} active</div>
              </td>
              <td className={`${cell} text-right`}>{usd(r.work)}</td>
              <td className={`${cell} text-right font-semibold text-emerald-600`}>{usd(r.earn)}</td>
              <td className={`${cell} text-right`}>
                {r.held > 0 ? <span className="font-medium text-rose-600">{usd(r.held)}</span> : <span className="text-slate-300">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-slate-200 bg-slate-50 font-semibold">
            <td className={cell}>Total</td>
            <td className={cell}>{total(r => r.n)}</td>
            <td className={`${cell} text-right`}>{usd(total(r => r.work))}</td>
            <td className={`${cell} text-right text-emerald-600`}>{usd(total(r => r.earn))}</td>
            <td className={`${cell} text-right text-rose-600`}>{usd(total(r => r.held))}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}