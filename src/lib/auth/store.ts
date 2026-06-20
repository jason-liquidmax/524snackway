"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// UX cache only — never store the session token here. The HttpOnly session
// cookie is the credential; this exists so the UI can render the signed-in
// state without flashing on hard reloads.
export type AuthUser = {
  id: number;
  displayName: string | null;
  telegramUsername: string | null;
  photoUrl: string | null;
};

type AuthState = {
  hydrated: boolean;
  status: "unknown" | "anon" | "authed";
  user: AuthUser | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (u: AuthUser) => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      hydrated: false,
      status: "unknown",
      user: null,
      setUser: (u) => set({ status: "authed", user: u }),
      refresh: async () => {
        try {
          const r = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
          if (!r.ok) {
            set({ status: "anon", user: null });
            return;
          }
          const data = (await r.json()) as { user: AuthUser | null };
          if (data.user) set({ status: "authed", user: data.user });
          else set({ status: "anon", user: null });
        } catch {
          set({ status: "anon", user: null });
        }
      },
      signOut: async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
        } finally {
          set({ status: "anon", user: null });
        }
      },
    }),
    {
      name: "snackway.auth",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ user: s.user, status: s.status }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
