"use client";

import { useEffect } from "react";
import { currentUser } from "@/lib/mock-data";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

export function useAuth() {
  const auth = useAuthStore();

  useEffect(() => {
    if (!auth.user && !isSupabaseConfigured) {
      auth.setUser(currentUser);
    }
  }, [auth]);

  return auth;
}
