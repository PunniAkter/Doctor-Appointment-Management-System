// src/components/layout/Footer.tsx
"use client";

import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-200">
      <div className="mx-auto max-w-7xl px-4 py-10 md:flex md:items-start md:justify-between md:px-6">
        {/* Left side: Logo + tagline */}
        <div className="flex items-start gap-3">
          <Image
            src="/banners/bannerlogo.png"  // ✅ place your file at /public/banners/banner.jpg
            alt="MedBook Logo"
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
          />
          <div>
            <h2 className="text-lg font-bold text-white">MedBook</h2>
            <p className="mt-1 text-sm text-slate-400">
              Connecting patients with trusted doctors quickly and securely.
            </p>
          </div>
        </div>

        {/* Right side: Contact */}
        <div className="mt-8 md:mt-0">
          <h3 className="text-md font-semibold text-white">Contact Us</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>📧 <a href="mailto:punniakter@gmail.com" className="hover:underline">punniakter@gmail.com</a></li>
            <li>📞 017xxxxxxxx</li>
            <li>🏠 House no, A/12, Rupgonj, Narayonganj</li>
          </ul>
        </div>
      </div>

      {/* Bottom copyright */}
      <div className="border-t border-slate-700 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} MedBook. All rights reserved.
      </div>
    </footer>
  );
}
