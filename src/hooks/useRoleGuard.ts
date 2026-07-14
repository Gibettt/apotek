"use client";

import type { RoleName } from "@/types";
import { useAuth } from "./useAuth";

export function useRoleGuard(allowedRoles: RoleName[]) {
  const { user } = useAuth();

  return {
    allowed: Boolean(user && allowedRoles.includes(user.role)),
    user
  };
}
