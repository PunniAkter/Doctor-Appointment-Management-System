"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/axios";
import toast from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { AxiosError } from "axios";

type Tab = "PATIENT" | "DOCTOR";

/* ========= Schemas ========= */
const patientSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Minimum 6 characters"),
  photo_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});
type PatientForm = z.infer<typeof patientSchema>;

const doctorSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Minimum 6 characters"),
  specialization: z.string().min(1, "Select a specialization"),
  photo_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});
type DoctorForm = z.infer<typeof doctorSchema>;

/* ========= Helpers ========= */
function getErrorMessage(err: unknown): string {
  const ax = err as AxiosError<{ message?: string }>;
  return ax?.response?.data?.message || (err as Error)?.message || "Something went wrong";
}

// type guard
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function pickArray(obj: Record<string, unknown>, key: string): unknown[] | null {
  const val = obj[key];
  return Array.isArray(val) ? val : null;
}
/** Normalize /specializations response into string[] */
function normalizeSpecializations(d: unknown): string[] {
  if (Array.isArray(d)) return d.map(String);
  if (isRecord(d)) {
    const arr =
      pickArray(d, "data") ??
      pickArray(d, "items") ??
      pickArray(d, "specializations") ??
      [];
    return arr.map(String);
  }
  return [];
}

/* ========= Component ========= */
export default function RegisterPage() {
  const [tab, setTab] = useState<Tab>("PATIENT");
  const router = useRouter();

  // Load specializations
  const {
    data: specializations = [],
    isLoading: loadingSpecs,
    isError,
  } = useQuery<string[]>({
    queryKey: ["specializations"],
    queryFn: async (): Promise<string[]> => {
      const res = await api.get("/specializations");
      return normalizeSpecializations(res.data);
    },
    staleTime: 60_000,
  });

  // Patient form
  const {
    register: pRegister,
    handleSubmit: pHandleSubmit,
    formState: { errors: pErrors, isSubmitting: pSubmitting },
  } = useForm<PatientForm>({ resolver: zodResolver(patientSchema) });

  // Doctor form
  const {
    register: dRegister,
    handleSubmit: dHandleSubmit,
    formState: { errors: dErrors, isSubmitting: dSubmitting },
  } = useForm<DoctorForm>({ resolver: zodResolver(doctorSchema) });

  /* --- Submitters --- */
  const submitPatient = async (data: PatientForm) => {
    try {
      await api.post("/auth/register/patient", {
        name: data.name,
        email: data.email,
        password: data.password,
        photo_url: data.photo_url || undefined,
      });
      toast.success("Patient registered! Please login.");
      router.push("/auth/login");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    }
  };

  const submitDoctor = async (data: DoctorForm) => {
    try {
      await api.post("/auth/register/doctor", {
        name: data.name,
        email: data.email,
        password: data.password,
        specialization: data.specialization,
        photo_url: data.photo_url || undefined,
      });
      toast.success("Doctor registered! Please login.");
      router.push("/auth/login");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-slate-100">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow">
        <h1 className="mb-4 text-center text-2xl font-semibold">Create Account</h1>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => setTab("PATIENT")}
            className={`rounded-lg px-4 py-2 text-sm font-medium border ${
              tab === "PATIENT" ? "bg-slate-900 text-white" : "bg-white text-slate-700"
            }`}
          >
            Patient
          </button>
          <button
            type="button"
            onClick={() => setTab("DOCTOR")}
            className={`rounded-lg px-4 py-2 text-sm font-medium border ${
              tab === "DOCTOR" ? "bg-slate-900 text-white" : "bg-white text-slate-700"
            }`}
          >
            Doctor
          </button>
        </div>

        {/* Patient Form */}
        {tab === "PATIENT" ? (
          <form
            onSubmit={pHandleSubmit(submitPatient)}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input
                className="w-full rounded-lg border p-2"
                placeholder="Jane Doe"
                {...pRegister("name")}
              />
              {pErrors.name && <p className="text-sm text-red-600">{pErrors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                className="w-full rounded-lg border p-2"
                placeholder="jane@email.com"
                {...pRegister("email")}
              />
              {pErrors.email && <p className="text-sm text-red-600">{pErrors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Password</label>
              <input
                type="password"
                className="w-full rounded-lg border p-2"
                placeholder="******"
                {...pRegister("password")}
              />
              {pErrors.password && <p className="text-sm text-red-600">{pErrors.password.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Photo URL (optional)</label>
              <input
                className="w-full rounded-lg border p-2"
                placeholder="https://..."
                {...pRegister("photo_url")}
              />
              {pErrors.photo_url && (
                <p className="text-sm text-red-600">{pErrors.photo_url.message}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <button
                disabled={pSubmitting}
                className="w-full rounded-lg bg-green-600 py-2 text-white disabled:opacity-70"
              >
                {pSubmitting ? "Creating..." : "Create Patient Account"}
              </button>
            </div>
          </form>
        ) : (
          /* Doctor Form */
          <form
            onSubmit={dHandleSubmit(submitDoctor)}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input
                className="w-full rounded-lg border p-2"
                placeholder="Dr. John"
                {...dRegister("name")}
              />
              {dErrors.name && <p className="text-sm text-red-600">{dErrors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                className="w-full rounded-lg border p-2"
                placeholder="drjohn@email.com"
                {...dRegister("email")}
              />
              {dErrors.email && <p className="text-sm text-red-600">{dErrors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Password</label>
              <input
                type="password"
                className="w-full rounded-lg border p-2"
                placeholder="******"
                {...dRegister("password")}
              />
              {dErrors.password && (
                <p className="text-sm text-red-600">{dErrors.password.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">Specialization</label>
              <select className="w-full rounded-lg border p-2" {...dRegister("specialization")}>
                <option value="">Select specialization</option>
                {loadingSpecs && <option>Loading...</option>}
                {isError && <option>Error loading</option>}
                {specializations.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {dErrors.specialization && (
                <p className="text-sm text-red-600">{dErrors.specialization.message}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">Photo URL (optional)</label>
              <input
                className="w-full rounded-lg border p-2"
                placeholder="https://..."
                {...dRegister("photo_url")}
              />
              {dErrors.photo_url && (
                <p className="text-sm text-red-600">{dErrors.photo_url.message}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <button
                disabled={dSubmitting}
                className="w-full rounded-lg bg-green-600 py-2 text-white disabled:opacity-70"
              >
                {dSubmitting ? "Creating..." : "Create Doctor Account"}
              </button>
            </div>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <a href="/auth/login" className="text-green-700 underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
