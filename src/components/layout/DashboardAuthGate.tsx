"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export function DashboardAuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !user) {
      router.replace("/login");
    }
  }, [mounted, router, user]);

  return mounted && user ? <>{children}</> : null;
}
