"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/stores/authStore";

export function LogoutButton({ redirectTo = "/" }: { redirectTo?: string }) {
  const router = useRouter();
  const { clear } = useAuth();

  return (
    <button
      onClick={() => {
        clear();
        // also clear plain keys to be safe
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");
        router.replace(redirectTo);
      }}
      className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
    >
      Logout
    </button>
  );
}
