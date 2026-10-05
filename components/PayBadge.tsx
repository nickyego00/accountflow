export default function PayBadge({ s, issue }: { s: string; issue?: string }) {
  if (issue && issue !== "No Issue") return null;
  const c = s === "Paid" ? "bg-emerald-50 text-emerald-700" : s === "Pending" ? "bg-sky-50 text-sky-700" : "bg-amber-50 text-amber-700";
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${c}`}>{s}</span>;
}