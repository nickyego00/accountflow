  export function downloadCsv(name: string, rows: (string | number)[][]) {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const blob = new Blob([rows.map(r => r.map(esc).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click();
  }