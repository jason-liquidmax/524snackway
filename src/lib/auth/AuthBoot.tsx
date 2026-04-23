"use client";

import { useEffect } from "react";
import { useAuth } from "./store";

// Mounted once at the layout root. Rehydrates the persisted UX cache, then
// revalidates against /api/auth/me so the cached user can't outlive the cookie.
export default function AuthBoot() {
  useEffect(() => {
    void useAuth.persist.rehydrate();
    void useAuth.getState().refresh();
  }, []);
  return null;
}
