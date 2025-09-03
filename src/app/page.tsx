// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/layout/Footer";
import dynamic from "next/dynamic";
const Navbar = dynamic(() => import("@/components/layout/Navbar"), { ssr: false });

export default function Home() {
  const [authed, setAuthed] = useState(false);
  useEffect(() => setAuthed(!!localStorage.getItem("token")), []);

  // Slideshow (make sure these exist in /public/banners)
  const banners = ["/banners/banner1.jpg", "/banners/banner2.jpg", "/banners/banner3.jpg"];
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((p) => (p + 1) % banners.length), 5000);
    return () => clearInterval(id);
  }, [banners.length]);

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-green-50 via-white to-slate-50" />
        <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-green-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-72 w-72 rounded-full bg-emerald-100/60 blur-3xl" />

        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 pb-16 pt-14 md:grid-cols-2 md:px-6 md:pb-24 md:pt-20">
          {/* Left content */}
          <div>
            <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium text-slate-600">
              New · Book with trusted doctors
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight text-slate-900 md:text-5xl">
              Book appointments in <span className="text-green-600">seconds</span> — fast, simple, secure.
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Search specialists, pick a date, and confirm instantly. No phone calls, no waiting rooms.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/patient/doctors"
                className="rounded-lg bg-green-600 px-6 py-3 text-white shadow hover:bg-green-700 active:translate-y-px"
              >
                Browse Doctors
              </Link>
              {!authed && (
                <Link
                  href="/auth/register"
                  className="rounded-lg border px-6 py-3 text-slate-700 hover:bg-white"
                >
                  Register Now
                </Link>
              )}
            </div>

            {/* Trust bar */}
            <div className="mt-8 flex items-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 font-semibold text-green-700">
                  ✓
                </span>
                Verified Doctors
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 font-semibold text-green-700">
                  ✓
                </span>
                Secure Booking
              </div>
            </div>
          </div>

          {/* Right slideshow banner */}
          <div className="relative">
            <div className="relative h-72 w-full overflow-hidden rounded-2xl border bg-white shadow-2xl md:h-96">
              {banners.map((src, i) => (
                <Image
                  key={src}
                  src={src}
                  alt={`Healthcare banner ${i + 1}`}
                  fill
                  sizes="(min-width: 768px) 560px, 100vw"
                  priority={i === index}
                  className={`absolute inset-0 object-cover transition-opacity duration-1000 ${
                    i === index ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
            </div>
            {/* Dots */}
            <div className="mt-3 flex justify-center gap-2">
              {banners.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`h-2.5 w-2.5 rounded-full transition ${
                    i === index ? "bg-green-600" : "bg-slate-300 hover:bg-slate-400"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* QUICK SEARCH (public → /patient/doctors) */}
      <section className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="rounded-2xl border bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <h2 className="text-xl font-semibold text-slate-900">Find Doctors</h2>

            <form action="/patient/doctors" className="flex w-full max-w-xl gap-3 md:w-auto">
              <input
                name="search"
                className="w-full rounded-lg border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Search doctor name..."
                aria-label="Search doctor name"
              />
              <select
                name="specialization"
                className="rounded-lg border bg-white px-3 py-2"
                aria-label="Filter by specialization"
                defaultValue=""
              >
                <option value="">All specializations</option>
                <option value="Cardiologist">Cardiologist</option>
                <option value="Dentist">Dentist</option>
                <option value="Neurologist">Neurologist</option>
              </select>
              <button className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700">
                Search
              </button>
            </form>
          </div>

          {/* Featured doctors (with images from /public/doctors) */}
          {/* Featured doctors (styled preview) */}
<div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
  {[
    { name: "Dr. Ayesha Karim", spec: "Cardiologist", photo: "/banners/banner4.jpg" },
    { name: "Dr. Kamal Uddin", spec: "Dentist", photo: "/banners/banner5.jpg" },
    { name: "Dr. Nabila Rahman", spec: "Neurologist", photo: "/banners/banner6.jpg" },
  ].map((d) => (
    <div
      key={d.name}
      className="group rounded-2xl bg-gradient-to-br from-green-50 to-white p-6 shadow-md transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-full ring-2 ring-green-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={d.name}
            src={d.photo || "https://dummyimage.com/80x80/e2e8f0/475569&text=Dr"}
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 group-hover:text-green-700">
            {d.name}
          </h3>
          <p className="text-sm font-medium text-green-600">{d.spec}</p>
        </div>
      </div>

      <Link
        href="/patient/doctors"
        className="mt-6 block w-full rounded-lg bg-green-600 py-2 text-center text-sm font-medium text-white transition hover:bg-green-700"
      >
        Browse Doctors
      </Link>
    </div>
  ))}
</div>

        </div>
      </section>

      {/* ABOUT (centered, anchor) */}
      <section id="about" className="mx-auto mt-16 max-w-5xl px-4 md:px-6">
        <h2 className="text-center text-2xl font-bold text-slate-900">About Us</h2>
        <p className="mx-auto mt-4 max-w-3xl text-center leading-relaxed text-slate-600">
          MedBook is a simple and secure platform that connects patients with trusted doctors.
          Our mission is to make healthcare more accessible by providing an easy-to-use booking
          system that saves time and reduces hassle.
        </p>
      </section>

      {/* STATS (soft gradient cards) */}
      <section className="mx-auto mt-12 max-w-7xl px-4 md:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { k: "25k+", v: "Appointments booked" },
            { k: "1.2k+", v: "Verified doctors" },
            { k: "99.9%", v: "Uptime this month" },
          ].map((s) => (
            <div
              key={s.v}
              className="rounded-2xl bg-gradient-to-br from-white to-green-50 p-6 text-center shadow-sm ring-1 ring-slate-200"
            >
              <div className="text-3xl font-extrabold text-slate-900">{s.k}</div>
              <div className="mt-1 text-sm text-slate-600">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS (minimal list) */}
      <section className="mx-auto mt-12 max-w-7xl px-4 md:px-6">
        <h2 className="text-xl font-semibold text-slate-900">How It Works</h2>
        <ol className="mt-6 grid gap-8 sm:grid-cols-3">
          {[
            { title: "Find a Doctor", desc: "Search by name or specialization." },
            { title: "Book Appointment", desc: "Pick a date and confirm instantly." },
            { title: "Meet Doctor", desc: "Visit at your scheduled time." },
          ].map((s, i) => (
            <li key={s.title} className="relative pl-10">
              <span className="absolute left-0 top-0 inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-700">
                {i + 1}
              </span>
              <div className="text-base font-semibold text-slate-900">{s.title}</div>
              <div className="mt-1 text-sm text-slate-600">{s.desc}</div>
            </li>
          ))}
        </ol>
      </section>

      {/* TESTIMONIALS (polished) */}
<section className="mx-auto mt-16 max-w-7xl px-4 md:px-6">
  <h2 className="text-xl font-semibold text-slate-900">What patients say</h2>

  <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {[
      {
        quote:
          "So easy to use — booked my cardiology visit in under 2 minutes. Highly recommend!",
        name: "Rafi A.",
        initials: "RA",
      },
      {
        quote:
          "I love the clean design. Finding the right specialist was super fast.",
        name: "Nabila R.",
        initials: "NR",
      },
      {
        quote:
          "Instant confirmation and reminders. No more calling clinics — this is the future.",
        name: "Sami K.",
        initials: "SK",
      },
    ].map((t) => (
      <figure
        key={t.name}
        className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm ring-1 ring-slate-200 transition
                   hover:-translate-y-1 hover:shadow-lg"
      >
        {/* Decorative quote icon */}
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="absolute -top-3 -left-3 h-16 w-16 text-green-100"
        >
          <path
            fill="currentColor"
            d="M7.8 10.2C6.2 10.2 5 11.5 5 13.1c0 1.6 1.2 2.9 2.8 2.9s2.9-1.3 2.9-2.9c0-3.2-2.2-5.4-5.6-6.1l-.7 2.2c1.9.4 3.4 1.7 3.4 3.9zM17.4 10.2c-1.6 0-2.8 1.3-2.8 2.9 0 1.6 1.2 2.9 2.8 2.9s2.9-1.3 2.9-2.9c0-3.2-2.2-5.4-5.6-6.1l-.7 2.2c1.9.4 3.4 1.7 3.4 3.9z"
          />
        </svg>

        <blockquote className="relative z-10 text-slate-700">
          <span className="block text-[15.5px] leading-7">
            “{t.quote}”
          </span>
        </blockquote>

        <figcaption className="relative z-10 mt-5 flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-[12px] font-semibold text-green-700">
            {t.initials}
          </span>
          <span className="text-sm font-medium text-slate-900">{t.name}</span>
        </figcaption>

        {/* subtle gradient glow on hover */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
             style={{
               background:
                 "radial-gradient(600px circle at var(--x,50%) var(--y,50%), rgba(16,185,129,.06), transparent 40%)",
             }}
             onMouseMove={(e) => {
               const el = e.currentTarget as HTMLDivElement;
               const rect = el.getBoundingClientRect();
               el.style.setProperty("--x", `${e.clientX - rect.left}px`);
               el.style.setProperty("--y", `${e.clientY - rect.top}px`);
             }}
        />
      </figure>
    ))}
  </div>
</section>


      {/* Hidden contact anchor so /#contact scrolls to footer */}
      <section id="contact" className="sr-only" aria-hidden="true" />

      <Footer />
    </main>
  );
}
