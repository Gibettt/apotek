"use client";

import { useEffect } from "react";
import { useAuth } from "./useAuth";
import { useCabangStore } from "@/store/cabangStore";

export function useCabang() {
  const { user } = useAuth();
  const store = useCabangStore();

  useEffect(() => {
    if (user) {
      store.loadForPengguna(user.id, { allowAllBranches: user.role === "owner" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return store;
}
