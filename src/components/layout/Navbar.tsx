// src/components/layout/Navbar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";                 // import Image from next/image
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/stores/authStore";
import { LogoutButton } from "@/components/auth/LogoutButton";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // avoid hydration mismatch by only reading storage after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { token, role } = useAuth();
  const tokenLS = mounted ? localStorage.getItem("token") : null;
  const roleLS = mounted ? (localStorage.getItem("role") || "").toUpperCase() : "";

  const isAuthed = mounted ? !!(token || tokenLS) : false;
  const currentRole = mounted ? (role || roleLS || "").toUpperCase() : "";

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const linkCls = (href: string) =>
    `rounded-md px-3 py-2 text-sm font-medium transition ${
      isActive(href)
        ? "bg-green-50 text-green-700"
        : "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
    }`;

  const links = useMemo(() => {
    if (!isAuthed) {
      return [
        { href: "/", label: "Home" },
        { href: "/#about", label: "About" },     // anchor to home sections
        { href: "/#contact", label: "Contact" },
        { href: "/auth/login", label: "Login" },
        { href: "/auth/register", label: "Register" },
      ];
    }
    if (currentRole === "DOCTOR") {
      return [
        { href: "/", label: "Home" },
        { href: "/doctors/appointments", label: "Appointments" },
        // remove Dashboard per your plan; keep About/Contact anchors
        { href: "/#about", label: "About" },
        { href: "/#contact", label: "Contact" },
      ];
    }
    // PATIENT
    return [
      { href: "/", label: "Home" },
      { href: "/patient/doctors", label: "Find Doctors" },
      { href: "/patient/appointments", label: "My Appointments" },
      { href: "/#about", label: "About" },
      { href: "/#contact", label: "Contact" },
    ];
  }, [isAuthed, currentRole]);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        {/* Logo + brand (no dot) */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/banners/bannerlogo.png"            // put your logo file in /public/logo.svg
            alt="MedBook logo"
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
            priority
          />
          <span className="text-lg font-bold text-slate-900">MedBook</span>
        </Link>

        {/* Mobile hamburger */}
        <button
          aria-label="Toggle menu"
          className="rounded-lg border border-slate-200 px-3 py-2 text-slate-700 md:hidden"
          onClick={() => setOpen((s) => !s)}
        >
          ☰
        </button>

        {/* Desktop links */}
        <ul className="hidden items-center gap-2 md:flex">
          {links.map(({ href, label }) => (
            <li key={href}>
              <Link href={href} className={linkCls(href)}>
                {label}
              </Link>
            </li>
          ))}
          {isAuthed && (
            <li>
              <LogoutButton redirectTo="/" />
            </li>
          )}
        </ul>
      </nav>

      {/* Mobile menu */}
      {open && (
        <ul className="border-t bg-white md:hidden">
          {links.map(({ href, label }) => (
            <li key={href} className="px-4 py-3">
              <Link
                href={href}
                className={linkCls(href)}
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            </li>
          ))}
          {isAuthed && (
            <li className="px-4 pb-4">
              <LogoutButton redirectTo="/" />
            </li>
          )}
        </ul>
      )}
    </header>
  );
}
