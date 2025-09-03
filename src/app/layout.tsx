import "./globals.css";
import type { ReactNode } from "react";
import ReactQueryProvider from "@/components/providers/react-query-provider";
import { Toaster } from "react-hot-toast";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <ReactQueryProvider>
          {children}
          {/* Single global toaster only */}
          <Toaster position="top-center" />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
