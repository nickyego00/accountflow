import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";

export const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export type Account = { id: string; person_id: string; email: string; rate: number; status: "Active"|"Inactive"; issue: string; notes: string|null; updated_at: string; total_work: number; earnings: number; admin_share: number; payment_status: "Paid"|"Pending"|"Unpaid" };

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

// Upload a profile photo and save its link on the person.
export async function uploadAvatar(personId: string, file: File) {
  const path = `${personId}-${Date.now()}.${(file.name.split(".").pop() || "jpg").toLowerCase()}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file);
  if (error) { toast.error(error.message); return null; }
  const url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  await supabase.from("people").update({ avatar_url: url }).eq("id", personId);
  return url;
}