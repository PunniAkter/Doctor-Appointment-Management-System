"use client";
import { useEffect, useState } from "react";

export default function Test() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null; // avoid server render → no mismatch

  return <div className="p-5">Doctors/Test route works ✅</div>;
}
