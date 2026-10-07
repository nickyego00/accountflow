// The next Wednesday after today: the next payday for balances.
export function nextPayday(): string {
  const d = new Date();
  d.setDate(d.getDate() + (((3 - d.getDay() + 7) % 7) || 7));
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

// Time left before a suspended account is deleted (24 hours after it was suspended).
export function deletesIn(suspendedAt: string | null): string {
  if (!suspendedAt) return "";
  const ms = new Date(suspendedAt).getTime() + 24 * 3600 * 1000 - Date.now();
  if (ms <= 0) return "Deleting soon";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `Deletes in ${h}h ${m}m` : `Deletes in ${m}m`;
}