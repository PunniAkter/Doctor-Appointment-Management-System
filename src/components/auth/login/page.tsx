"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/axios";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/stores/authStore";
import type { AxiosError } from "axios";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Minimum 6 characters"),
  role: z.enum(["PATIENT", "DOCTOR"]),
});
type LoginForm = z.infer<typeof loginSchema>;

function getErrorMessage(err: unknown) {
  const ax = err as AxiosError<{ message?: string }>;
  return ax?.response?.data?.message || (err as Error)?.message || "Login failed";
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "";

  const { setAuth } = useAuth();

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await api.post("/auth/login", data);
      const { token, user } = res.data;

      // Normalize role from API (fallback to selected role)
      const serverRole = (user?.role ?? data.role)?.toString().toUpperCase() as
        | "PATIENT"
        | "DOCTOR";

      // Optional: prevent logging in with the wrong role selected
      if (serverRole !== data.role) {
        toast.error(
          `This account is registered as ${serverRole}. Please choose "${serverRole}" in the Role dropdown.`
        );
        return;
      }

      // Persist auth
      setAuth({ token, role: serverRole, user });

      toast.success("Logged in successfully!");

      // ✅ Redirect using serverRole (NOT 'role')
      if (redirect) {
        router.push(redirect);
      } else {
        router.push(serverRole === "PATIENT" ? "/patient/dashboard" : "/doctors/dashboard");
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-slate-100">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow">
        <h1 className="mb-4 text-center text-2xl font-semibold">Login</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input className="w-full rounded-lg border p-2" placeholder="you@email.com" {...register("email")} />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input type="password" className="w-full rounded-lg border p-2" placeholder="******" {...register("password")} />
            {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Role</label>
            <select className="w-full rounded-lg border p-2" {...register("role")}>
              <option value="PATIENT">Login as Patient</option>
              <option value="DOCTOR">Login as Doctor</option>
            </select>
            {errors.role && <p className="text-sm text-red-600">{errors.role.message}</p>}
          </div>

          <button
            disabled={isSubmitting}
            className="w-full rounded-lg bg-green-600 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-70"
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          Don’t have an account?{" "}
          <a href="/auth/register" className="text-green-700 underline">Register</a>
        </p>
      </div>
    </div>
  );
}
