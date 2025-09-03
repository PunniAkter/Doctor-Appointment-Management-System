"use client";

import { useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { api } from "@/lib/axios";
import toast from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

/* --- Types (UI model) --- */
type Status = "PENDING" | "COMPLETED" | "CANCELLED";
type StatusFilter = "" | Status;

interface Appointment {
  id: string;
  date: string; // ISO date
  status: Status;
  doctor: {
    id: string;
    name: string;
    specialization: string;
    photo_url?: string;
  };
}

/* --- Types (API model) --- */
interface AppointmentApi {
  id: string;
  date: string;
  status: string;
  doctor: {
    id: string;
    name: string;
    specialization: string;
    photo_url?: string;
  };
}
interface AppointmentsResponseApi {
  data?: AppointmentApi[];
  appointments?: AppointmentApi[];
  items?: AppointmentApi[];
  total?: number;
  meta?: { total?: number };
}

/* --- Utils --- */
function getErrorMessage(err: unknown) {
  const ax = err as AxiosError<{ message?: string }>;
  return ax?.response?.data?.message || (err as Error)?.message || "Something went wrong";
}

function normalizeAppointments(payload?: AppointmentsResponseApi): {
  list: Appointment[];
  total?: number;
} {
  const raw = payload?.appointments ?? payload?.data ?? payload?.items ?? [];
  const list: Appointment[] = raw.map((a) => ({
    id: a.id,
    date: a.date,
    status: a.status as Status,
    doctor: a.doctor,
  }));
  const total = payload?.meta?.total ?? payload?.total ?? undefined;
  return { list, total };
}

/* --- Page --- */
export default function PatientAppointmentsPage() {
  const [status, setStatus] = useState<StatusFilter>("");
  const [page, setPage] = useState(1);
  const limit = 6;

  const qc = useQueryClient();

  const { data: payload, isLoading, isError } = useQuery<AppointmentsResponseApi>({
    queryKey: ["appointments", "patient", { status, page }],
    queryFn: async () => {
      const res = await api.get<AppointmentsResponseApi>("/appointments/patient", {
        params: { status: status || undefined, page },
      });
      return res.data;
    },
    placeholderData: keepPreviousData,
  });

  const { list: appointments, total } = useMemo(
    () => normalizeAppointments(payload),
    [payload]
  );

  const totalPages = total ? Math.max(1, Math.ceil(total / limit)) : undefined;
  const hasNext = totalPages ? page < totalPages : appointments.length >= limit;
  const hasPrev = page > 1;

  const cancelMutation = useMutation({
    mutationFn: (input: { appointment_id: string }) =>
      api.patch("/appointments/update-status", {
        status: "CANCELLED",
        appointment_id: input.appointment_id,
      }),
    onMutate: async ({ appointment_id }) => {
      await qc.cancelQueries({ queryKey: ["appointments", "patient"] });
      const key = ["appointments", "patient", { status, page }];
      const prev = qc.getQueryData<AppointmentsResponseApi>(key);

      qc.setQueryData(
        key,
        (old: AppointmentsResponseApi | undefined): AppointmentsResponseApi => {
          const arr = (old?.appointments ?? old?.data ?? old?.items ?? []).map((a) =>
            a.id === appointment_id ? { ...a, status: "CANCELLED" } : a
          );
          return { ...(old ?? {}), appointments: arr, data: undefined, items: undefined };
        }
      );

      return { prev, key };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev && ctx.key) qc.setQueryData(ctx.key, ctx.prev);
      toast.error(getErrorMessage(err));
    },
    onSuccess: () => toast.success("Appointment cancelled"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["appointments", "patient"] }),
  });

  const filters: { label: string; value: StatusFilter }[] = [
    { label: "All", value: "" },
    { label: "Pending", value: "PENDING" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Cancelled", value: "CANCELLED" },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Header (softer gradient + nicer chips) */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-green-50 via-white to-sky-50" />
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Appointments</h1>
              <p className="mt-1 text-slate-600">
                Track, manage and cancel upcoming bookings.
              </p>
            </div>
            <div
              aria-hidden
              className="hidden h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700 md:flex"
              title="Appointments"
            >
              📅
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {filters.map((f) => {
              const active = status === f.value;
              return (
                <button
                  key={f.label}
                  onClick={() => {
                    setStatus(f.value);
                    setPage(1);
                  }}
                  className={`rounded-full px-4 py-1.5 text-sm transition
                    ${
                      active
                        ? "bg-slate-900 text-white shadow-sm shadow-slate-300/30"
                        : "border bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  aria-current={active}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* List */}
      <section className="mx-auto max-w-7xl px-4 pb-10 md:px-6">
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
          <div className="rounded-2xl border bg-red-50 p-4 text-red-700">
            Could not load appointments. Please try again.
          </div>
        ) : appointments.length === 0 ? (
          <div className="rounded-2xl border bg-white p-8 text-center text-slate-600">
            No appointments found.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {appointments.map((a) => (
              <AppointmentCard
                key={a.id}
                appt={a}
                onCancel={() => cancelMutation.mutate({ appointment_id: a.id })}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            disabled={!hasPrev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border px-4 py-2 disabled:opacity-50"
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
            className="rounded-lg border px-4 py-2 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </section>

      <Footer />
    </main>
  );
}

/* ========= Card ========= */
function AppointmentCard({
  appt,
  onCancel,
}: {
  appt: Appointment;
  onCancel: () => void;
}) {
  const statusBadge: Record<Status, { text: string; cls: string; icon: string; ring: string }> = {
    PENDING: {
      text: "Pending",
      icon: "⏳",
      cls: "bg-blue-100 text-blue-700",
      ring: "ring-blue-200",
    },
    COMPLETED: {
      text: "Completed",
      icon: "✓",
      cls: "bg-green-100 text-green-700",
      ring: "ring-green-200",
    },
    CANCELLED: {
      text: "Cancelled",
      icon: "✕",
      cls: "bg-red-100 text-red-700",
      ring: "ring-red-200",
    },
  };

  const s = statusBadge[appt.status];
  const dateText = new Date(appt.date).toLocaleDateString();

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm ring-1 transition
      hover:-translate-y-1 hover:shadow-lg ${s.ring}`}
    >
      {/* subtle corner glow */}
      <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-gradient-to-br from-green-100/40 to-transparent blur-2xl" />

      <div className="flex items-start gap-4">
        <div className="relative h-14 w-14 overflow-hidden rounded-full ring-2 ring-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={appt.doctor.name}
            src={appt.doctor.photo_url || "https://dummyimage.com/80x80/e2e8f0/475569&text=Dr"}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="truncate font-semibold text-slate-900">{appt.doctor.name}</h3>
              <p className="text-sm text-slate-500">{appt.doctor.specialization}</p>
            </div>

            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${s.cls}`}
              title={s.text}
            >
              <span aria-hidden>{s.icon}</span>
              {s.text}
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-700">{dateText}</p>

          {appt.status === "PENDING" && (
            <button
              onClick={onCancel}
              className="mt-3 rounded-lg border px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
