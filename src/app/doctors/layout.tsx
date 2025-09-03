import RequireAuth from "@/components/auth/RequireAuth";
export default function DoctorsLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth role="DOCTOR">{children}</RequireAuth>;
}
