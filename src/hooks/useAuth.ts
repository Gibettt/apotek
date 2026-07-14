"use client";

import { useEffect } from "react";
import { currentUser } from "@/lib/mock-data";
import { useAuthStore } from "@/store/authStore";

export function useAuth() {
  const auth = useAuthStore();

  useEffect(() => {
    if (!auth.user) {
      auth.setUser(currentUser);
    }
  }, [auth]);

  return auth;
}
