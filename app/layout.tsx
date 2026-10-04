import "./globals.css"; import { Toaster } from "sonner";
export const metadata = { title: "AccountFlow" };
export default function Root({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className="bg-slate-50 text-slate-900 antialiased">{children}<Toaster richColors position="top-right"/></body></html>;
}
