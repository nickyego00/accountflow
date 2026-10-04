import Sidebar from "@/components/Sidebar";
export default function L({ children }: { children: React.ReactNode }) {
  return <div><Sidebar/><main className="mx-auto max-w-6xl p-4 sm:p-8 lg:ml-60">{children}</main></div>;
}
