import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";

export const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export type Account = { id: string; person_id: string; email: string; rate: number; status: "Active"|"Inactive"; issue: string; notes: string|null; updated_at: string; total_work: number; earnings: number };

export const usd = (n: number) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(n);

// Type the new total an account has made. The difference is saved as an adjustment record, so earnings (total x rate) update automatically.
export async function editTotal(id: string, current: number, done: () => void) {
  const v = prompt("Total amount this account has made (USD)", String(current));
  if (v === null || v.trim() === "" || isNaN(Number(v))) return;
  const diff = Number(v) - current;
  if (diff === 0) return;
  const { error } = await supabase.from("work_records").insert({ account_id: id, work_date: new Date().toISOString().slice(0,10), amount_usd: diff, note: "Manual adjustment" });
  if (error) toast.error(error.message); else { toast.success("Amount updated"); done(); }
}