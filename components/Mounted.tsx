"use client";
import { useEffect, useState } from "react";

export default function Mounted({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  return ready ? <>{children}</> : null;
}