"use client";

import { create } from "zustand";
import type { AuthUser, LoginCredentials } from "@/types";
import { authService } from "@/services/authService";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  async login(credentials) {
    set({ isLoading: true });
    const session = await authService.login(credentials);
    window.localStorage.setItem("apotek-token", session.accessToken);
    set({
      user: session.user,
      token: session.accessToken,
      isLoading: false
    });
  },
  async logout() {
    await authService.logout();
    window.localStorage.removeItem("apotek-token");
    set({ user: null, token: null });
  },
  setUser(user) {
    set({ user });
  }
}));
