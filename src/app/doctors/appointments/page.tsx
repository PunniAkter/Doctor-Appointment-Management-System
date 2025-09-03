"use client";

import { useEffect, useMemo, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { AxiosError } from "axios";
import Image from "next/image";
import { api } from "@/lib/axios";
import toast from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

/* ========= Types ========= */
type Status = "PENDING" | "COMPLETED" | "CANCELLED";

interface PatientMini {
  id: string;
  name: string;
  email: string;
  photo_url?: string;
}

interface Appointment {
  id: string;
  date: string; // ISO date
  status: Status;
  patient: PatientMini;
}

interface AppointmentsResponse {
  appointments?: Appointment[];
  data?: Appointment[];
  items?: Appointment[];
  total?: number;
  meta?: { total?: number };
}

/* ========= Helpers ========= */
function getErrorMessage(err: unknown) {
  const ax = err as AxiosError<{ message?: string }>;
  return ax?.response?.data?.message || (err as Error)?.message || "Something went wrong";
}

/* ========= Page ========= */
export default function DoctorAppointmentsPage() {
  // Route guard (doctor only)
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
    if (!token || role?.toUpperCase() !== "DOCTOR") {
      window.location.href = "/auth/login?redirect=/doctors/appointments";
    }
  }, []);

  const qc = useQueryClient();

  const [status, setStatus] = useState<"" | Status>("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);
  const limit = 8;

  const { data: payload, isLoading, isError } = useQuery<AppointmentsResponse>({
    queryKey: ["appointments", "doctor", { status, date, page }],
    queryFn: async () => {
      const res = await api.get<AppointmentsResponse>("/appointments/doctor", {
        params: { status: status || undefined, date: date || undefined, page },
      });
      return res.data;
    },
    placeholderData: keepPreviousData,
  });

  const appointments: Appointment[] = useMemo(
    () => payload?.appointments ?? payload?.data ?? payload?.items ?? [],
    [payload]
  );

  const total = payload?.meta?.total ?? payload?.total ?? undefined;
  const totalPages = total ? Math.max(1, Math.ceil(total / limit)) : undefined;
  const hasNext = totalPages ? page < totalPages : appointments.length >= limit;
  const hasPrev = page > 1;

  const patchStatus = useMutation({
    mutationFn: (input: { appointment_id: string; status: Exclude<Status, "PENDING"> }) =>
      api.patch("/appointments/update-status", input),
    onMutate: async ({ appointment_id, status }) => {
      await qc.cancelQueries({ queryKey: ["appointments", "doctor"] });
      const key = ["appointments", "doctor", { status, date, page }];
      const prev = qc.getQueryData<AppointmentsResponse>(key);
      qc.setQueryData<AppointmentsResponse>(key, (old) => {
        const list = old?.appointments ?? old?.data ?? old?.items ?? [];
        const updated = list.map((a) => (a.id === appointment_id ? { ...a, status } : a));
        return { ...old, appointments: updated, data: undefined, items: undefined };
      });
      return { prev, key };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev && ctx.key) qc.setQueryData(ctx.key, ctx.prev);
      toast.error(getErrorMessage(err));
    },
    onSuccess: () => toast.success("Appointment updated"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["appointments", "doctor"] }),
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50/30">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Doctor Appointments
          </h1>
          <p className="mt-1 text-slate-600">
            Filter by date/status and update appointment states.
          </p>
        </header>

        {/* Filters */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as "" | Status);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-0 transition focus:border-green-400 focus:ring-2 focus:ring-green-200 md:w-48"
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <div className="relative md:w-56 w-full">
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-0 transition focus:border-green-400 focus:ring-2 focus:ring-green-200"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              📅
            </span>
          </div>

          <button
            onClick={() => {
              setStatus("");
              setDate("");
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 px-4 py-2 text-slate-700 transition hover:bg-slate-50 md:ml-auto"
          >
            Clear Filters
          </button>
        </div>

        {/* List */}
        <section className="mt-6">
          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: limit }).map((_, i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-2xl bg-white/70 ring-1 ring-slate-200"
                />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
              Could not load appointments.
            </div>
          ) : appointments.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
              No appointments found.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {appointments.map((a) => (
                <AppointmentCard
                  key={a.id}
                  appt={a}
                  onComplete={() =>
                    patchStatus.mutate({ appointment_id: a.id, status: "COMPLETED" })
                  }
                  onCancel={() =>
                    patchStatus.mutate({ appointment_id: a.id, status: "CANCELLED" })
                  }
                  isBusy={patchStatus.isPending}
                />
              ))}
            </div>
          )}
        </section>

        {/* Pagination */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            disabled={!hasPrev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-xl border border-slate-200 px-4 py-2 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-2 text-sm text-slate-600">
            Page {page}
            {totalPages ? ` of ${totalPages}` : ""}
          </span>
          <button
            disabled={!hasNext}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl border border-slate-200 px-4 py-2 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <Footer />
    </main>
  );
}

/* ========= Card ========= */
function AppointmentCard({
  appt,
  onComplete,
  onCancel,
  isBusy,
}: {
  appt: Appointment;
  onComplete: () => void;
  onCancel: () => void;
  isBusy: boolean;
}) {
  const statusStyles: Record<Status, string> = {
    PENDING: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
  };
  const borderTint: Record<Status, string> = {
    PENDING: "ring-blue-200",
    COMPLETED: "ring-green-200",
    CANCELLED: "ring-red-200",
  };

  const dateText = new Date(appt.date).toLocaleDateString();

  return (
    <div
      className={`group rounded-2xl bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm ring-1 transition hover:-translate-y-1 hover:shadow-lg ${borderTint[appt.status]}`}
    >
      <div className="flex items-start gap-4">
        <div className="relative h-14 w-14 overflow-hidden rounded-full ring-2 ring-slate-200">
          <Image
            alt={appt.patient.name}
            src={
              appt.patient.photo_url ||
              "https://dummyimage.com/80x80/e2e8f0/475569&text=P"
            }
            width={56}
            height={56}
            className="h-14 w-14 object-cover"
            unoptimized
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate font-semibold text-slate-900">
              {appt.patient.name}
            </h3>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[appt.status]}`}>
              {appt.status.toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
            </span>
          </div>

          <p className="text-sm text-slate-500">{appt.patient.email}</p>
          <p className="mt-2 text-sm text-slate-700">{dateText}</p>

          {appt.status === "PENDING" && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={onComplete}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white transition hover:bg-green-700 disabled:opacity-70"
                disabled={isBusy}
              >
                Mark Complete
              </button>
              <button
                onClick={onCancel}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-70"
                disabled={isBusy}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
