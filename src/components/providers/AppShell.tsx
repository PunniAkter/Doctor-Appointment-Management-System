"use client";

import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import ReactQueryProvider from "@/components/providers/react-query-provider";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <ReactQueryProvider>{children}</ReactQueryProvider>
      {/* Always render Toaster so SSR and client match */}
      <Toaster position="top-right" />
    </>
  );
}
