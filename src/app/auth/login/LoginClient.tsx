// src/app/auth/login/LoginClient.tsx
"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useAuth, type User, type Role } from "@/stores/authStore";
import type { AxiosError, AxiosResponse } from "axios";

/* ---------- schema ---------- */
const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Minimum 6 characters"),
  role: z.enum(["PATIENT", "DOCTOR"]),
});
type LoginForm = z.infer<typeof loginSchema>;

/* ---------- helpers (typed) ---------- */
function getErrorMessage(err: unknown) {
  const ax = err as AxiosError<{ message?: string }>;
  return ax?.response?.data?.message || (err as Error)?.message || "Login failed";
}

interface LoginPayload {
  token: string;
  user: unknown; // raw from API, we’ll normalize below
}

// Accepts { token,user } OR { data:{ token,user } }
function pickLoginPayload(res: AxiosResponse<unknown>): LoginPayload {
  const body = res.data as unknown;
  const inner =
    body && typeof body === "object" && "data" in body
      ? (body as { data: unknown }).data
      : body;

  if (inner && typeof inner === "object" && "token" in inner && "user" in inner) {
    const token = (inner as { token: unknown }).token;
    const user = (inner as { user: unknown }).user;
    if (typeof token === "string" && token && token !== "undefined" && token !== "null") {
      return { token, user };
    }
  }
  throw new Error("Unexpected login response shape (no valid token/user).");
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

// Normalize API user → our store's User type
function toUser(raw: unknown): User {
  if (!isRecord(raw)) throw new Error("Invalid user object");
  const id = String(raw.id ?? raw._id ?? "");
  const email = String(raw.email ?? "");
  const name = String(raw.name ?? raw.fullName ?? "");
  const role = String(raw.role ?? "").toUpperCase() as Role;

  const user: User = { id, name, email, role };
  if (typeof raw.photo_url === "string") user.photo_url = raw.photo_url;
  if (typeof raw.specialization === "string") user.specialization = raw.specialization;
  return user;
}

/* ---------- component ---------- */
export default function LoginClient({ redirect = "" }: { redirect?: string }) {
  const router = useRouter();
  const { setAuth } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await api.post("/auth/login", data);

      // typed extraction + normalization
      const { token, user: rawUser } = pickLoginPayload(res);
      const userObj = toUser(rawUser);

      const serverRole = userObj.role;
      if (serverRole !== data.role) {
        toast.error(`This account is ${serverRole}. Select "${serverRole}" in Role.`);
        return;
      }

      // persist to store and localStorage
      setAuth({ token, role: serverRole, user: userObj });
      localStorage.setItem("token", token);
      localStorage.setItem("role", serverRole);
      localStorage.setItem("user", JSON.stringify(userObj));

      toast.success("Logged in!");
      // Both roles go home unless a redirect was provided
      router.push(redirect || "/");
    } catch (err) {
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
            <input className="w-full rounded-lg border p-2" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input type="password" className="w-full rounded-lg border p-2" {...register("password")} />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Role</label>
            <select className="w-full rounded-lg border p-2" {...register("role")}>
              <option value="PATIENT">Login as Patient</option>
              <option value="DOCTOR">Login as Doctor</option>
            </select>
            {errors.role && (
              <p className="text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>

          <button
            disabled={isSubmitting}
            className="w-full rounded-lg bg-green-600 py-2 font-medium text-white"
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          Don’t have an account?{" "}
          <a href="/auth/register" className="text-green-700 underline">
            Register
          </a>
        </p>

        <p className="mt-2 text-center text-xs text-slate-500">
          Tip: If you came from a public page, we use <code>?redirect=...</code> to send you back after login.
        </p>
      </div>
    </div>
  );
}
