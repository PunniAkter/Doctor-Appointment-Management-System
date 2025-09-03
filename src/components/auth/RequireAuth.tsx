"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/stores/authStore";

export default function RequireAuth({
  children, role,
}: { children: React.ReactNode; role?: "PATIENT" | "DOCTOR" }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, role: storeRole } = useAuth();

  const tokenLS = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const roleLS  = typeof window !== "undefined" ? (localStorage.getItem("role") || "").toUpperCase() : "";
  const isAuthed = !!(token || tokenLS);
  const currentRole = ((storeRole || roleLS) as "PATIENT" | "DOCTOR" | "");

  useEffect(() => {
    if (!isAuthed) {
      router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (role && currentRole && role !== currentRole) {
      router.replace(currentRole === "DOCTOR" ? "/doctors/dashboard" : "/patient/dashboard");
    }
  }, [isAuthed, role, currentRole, router, pathname]);

  if (!isAuthed) return null;
  if (role && currentRole && role !== currentRole) return null;
  return <>{children}</>;
}
