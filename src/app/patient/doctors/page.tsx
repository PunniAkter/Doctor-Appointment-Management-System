"use client";

import { useEffect, useMemo, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { api } from "@/lib/axios";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import Footer from "@/components/layout/Footer";
import dynamic from "next/dynamic";
const Navbar = dynamic(() => import("@/components/layout/Navbar"), { ssr: false });

/* ========= Types ========= */
interface Doctor {
  id: string;
  name: string;
  email: string;
  specialization: string;
  photo_url?: string;
}
interface DoctorsResponse {
  data?: Doctor[];
  doctors?: Doctor[];
  items?: Doctor[];
  total?: number;
  meta?: { total?: number };
}

/* ========= Helpers ========= */
function getErrorMessage(err: unknown) {
  const ax = err as AxiosError<{ message?: string }>;
  return ax?.response?.data?.message || (err as Error)?.message || "Something went wrong";
}
function useDebounced<T>(value: T, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

/* ========= Page ========= */
export default function PatientDoctorsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();

  // read initial filters from URL
  const initialSearch = searchParams.get("search") ?? "";
  const initialSpec = searchParams.get("specialization") ?? "";

  const [page, setPage] = useState(1);
  const limit = 6;

  const [search, setSearch] = useState(initialSearch);
  const debouncedSearch = useDebounced(search);
  const [specialization, setSpecialization] = useState(initialSpec);

  // auth flags from localStorage
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const role = typeof window !== "undefined" ? localStorage.getItem("role")?.toUpperCase() : null;
  const isAuthedPatient = !!token && role === "PATIENT";

  // keep URL in sync
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (specialization) params.set("specialization", specialization);
    params.set("page", String(page));
    router.replace(`/patient/doctors?${params.toString()}`);
  }, [search, specialization, page, router]);

  /* --- Specializations (public) --- */
  const {
    data: specs,
    isLoading: specsLoading,
    isError: specsError,
  } = useQuery<string[]>({
    queryKey: ["specializations"],
    queryFn: async () => {
      const res = await api.get("/specializations");
      const d = res.data;
      const arr =
        (Array.isArray(d) && d) ||
        (Array.isArray(d?.data) && d.data) ||
        (Array.isArray(d?.items) && d.items) ||
        (Array.isArray(d?.specializations) && d.specializations) ||
        [];
      return arr.map(String);
    },
    staleTime: 60_000,
  });

  /* --- Doctors list (public) --- */
  const {
    data: doctorsPayload,
    isLoading: docsLoading,
    isError: docsError,
  } = useQuery<DoctorsResponse>({
    queryKey: ["doctors", { page, limit, search: debouncedSearch, specialization }],
    queryFn: async () =>
      (await api.get<DoctorsResponse>("/doctors", {
        params: {
          page,
          limit,
          search: debouncedSearch || undefined,
          specialization: specialization || undefined,
        },
      })).data,
    placeholderData: keepPreviousData,
  });

  const doctors: Doctor[] = useMemo(
    () => doctorsPayload?.doctors ?? doctorsPayload?.data ?? doctorsPayload?.items ?? [],
    [doctorsPayload]
  );

  // pagination helpers
  const total = doctorsPayload?.meta?.total ?? doctorsPayload?.total ?? undefined;
  const totalPages = total ? Math.max(1, Math.ceil(total / limit)) : undefined;
  const hasNext = totalPages ? page < totalPages : doctors.length >= limit;
  const hasPrev = page > 1;

  /* --- Book appointment (patient login required) --- */
  const [openModal, setOpenModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState("");

  const createAppointment = useMutation({
    mutationFn: async (input: { doctorId: string; date: string }) =>
      api.post("/appointments", input),
    onSuccess: () => {
      toast.success("Appointment booked!");
      setOpenModal(false);
      setSelectedDoctor(null);
      setSelectedDate("");
      qc.invalidateQueries({ queryKey: ["appointments", "patient"] });
    },
    onError: (err: unknown) => {
      const ax = err as AxiosError<{ message?: string }>;
      const status = ax.response?.status;
      if (status === 401 || status === 403) {
        toast.error("Please log in as a patient to book.");
        return;
      }
      toast.error(getErrorMessage(err));
    },
  });

  const openBooking = (doc: Doctor) => {
    if (!isAuthedPatient) {
      router.push("/auth/login?redirect=/patient/doctors");
      return;
    }
    setSelectedDoctor(doc);
    setSelectedDate("");
    setOpenModal(true);
  };

  const confirmBooking = () => {
    if (!selectedDoctor) return;
    if (!selectedDate) {
      toast.error("Please choose a date");
      return;
    }
    createAppointment.mutate({ doctorId: selectedDoctor.id, date: selectedDate });
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Header + Filters (sticky on scroll) */}
      <section className="sticky top-0 z-10 border-b bg-gradient-to-r from-white via-green-50/50 to-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-7xl px-4 py-4 md:px-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">Find Doctors</h1>
            <button
              onClick={() => {
                setSearch("");
                setSpecialization("");
                setPage(1);
              }}
              className="rounded-lg border px-4 py-2 text-sm text-slate-700 hover:bg-white"
            >
              Clear Filters
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_260px]">
            <input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Search doctor name…"
              className="w-full rounded-lg border bg-white px-3 py-2 outline-none ring-green-500/0 transition focus:ring-2 focus:ring-green-500"
            />

            <select
              value={specialization}
              onChange={(e) => {
                setPage(1);
                setSpecialization(e.target.value);
              }}
              className="w-full rounded-lg border bg-white px-3 py-2 outline-none ring-green-500/0 transition focus:ring-2 focus:ring-green-500"
            >
              <option value="">All specializations</option>
              {specsLoading && <option>Loading…</option>}
              {specsError && <option>Error loading</option>}
              {Array.isArray(specs) &&
                specs.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </section>

      {/* List */}
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        {docsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-white/70 ring-1 ring-slate-200" />
            ))}
          </div>
        ) : docsError ? (
          <div className="rounded-2xl border bg-red-50 p-4 text-red-700">
            Could not load doctors. Please try again.
          </div>
        ) : doctors.length === 0 ? (
          <div className="rounded-2xl border bg-white p-8 text-center text-slate-600">
            No doctors found. Try changing your search or filter.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((d) => (
              <DoctorCard
                key={d.id}
                doctor={d}
                onBook={() => openBooking(d)}
                isAuthed={isAuthedPatient}
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

      {/* Booking Modal */}
      {openModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Book with {selectedDoctor.name}</h3>
            <p className="mt-1 text-sm text-slate-600">{selectedDoctor.specialization}</p>

            <label className="mt-4 block text-sm font-medium">Choose date</label>
            <input
              type="date"
              className="mt-1 w-full rounded-lg border p-2 focus:ring-2 focus:ring-green-500"
              value={selectedDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
            />

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setOpenModal(false)}
                className="rounded-lg border px-4 py-2 text-slate-700 hover:bg-white"
              >
                Cancel
              </button>
              <button
                disabled={createAppointment.isPending}
                onClick={confirmBooking}
                className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-70"
              >
                {createAppointment.isPending ? "Booking..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}

/* ========= Card ========= */
function DoctorCard({
  doctor,
  onBook,
  isAuthed,
}: {
  doctor: Doctor;
  onBook: () => void;
  isAuthed: boolean;
}) {
  return (
    <div className="group rounded-2xl bg-gradient-to-br from-white to-green-50 p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center gap-4">
        <div className="relative h-14 w-14 overflow-hidden rounded-full ring-2 ring-green-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={doctor.name}
            src={doctor.photo_url || "https://dummyimage.com/80x80/e2e8f0/475569&text=Dr"}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-slate-900 group-hover:text-green-700">
            {doctor.name}
          </h3>
          <p className="text-sm font-medium text-green-600">{doctor.specialization}</p>
        </div>
      </div>

      <button
        onClick={onBook}
        className="mt-5 w-full rounded-lg bg-green-600 py-2 text-sm font-medium text-white transition hover:bg-green-700"
      >
        {isAuthed ? "Book Appointment" : "Login to Book"}
      </button>
    </div>
  );
}
