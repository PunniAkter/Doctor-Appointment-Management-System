import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "PATIENT" | "DOCTOR";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  photo_url?: string;
  specialization?: string;
};

type AuthState = {
  token: string | null;
  role: Role | null;
  user: User | null;
  setAuth: (v: { token: string; role: Role; user: User }) => void;
  clear: () => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      user: null,
      setAuth: ({ token, role, user }) => set({ token, role, user }),
      clear: () => set({ token: null, role: null, user: null }),
    }),
    { name: "auth-store" } // stored under this key in localStorage
  )
);
