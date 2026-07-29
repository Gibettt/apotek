"use client";

import { create } from "zustand";
import type { AuthUser, LoginCredentials, RegisterPayload, RegisterResult } from "@/types";
import { authService } from "@/services/authService";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

function readStoredSession() {
  if (typeof window === "undefined") {
    return { user: null, token: null };
  }

  const token = window.localStorage.getItem("apotek-token");
  const rawUser = window.localStorage.getItem("apotek-user");

  if (!token || !rawUser) {
    return { user: null, token: null };
  }

  try {
    return { user: JSON.parse(rawUser) as AuthUser, token };
  } catch {
    window.localStorage.removeItem("apotek-token");
    window.localStorage.removeItem("apotek-user");
    return { user: null, token: null };
  }
}

const storedSession = readStoredSession();

export const useAuthStore = create<AuthState>((set) => ({
  user: storedSession.user,
  token: storedSession.token,
  isLoading: false,
  async login(credentials) {
    set({ isLoading: true });
    try {
      const session = await authService.login(credentials);
      window.localStorage.setItem("apotek-token", session.accessToken);
      window.localStorage.setItem("apotek-user", JSON.stringify(session.user));
      set({
        user: session.user,
        token: session.accessToken,
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  async register(payload) {
    set({ isLoading: true });

    try {
      const result = await authService.register(payload);

      if (result.session) {
        window.localStorage.setItem("apotek-token", result.session.accessToken);
        window.localStorage.setItem("apotek-user", JSON.stringify(result.session.user));
        set({ user: result.session.user, token: result.session.accessToken, isLoading: false });
      } else {
        set({ isLoading: false });
      }

      return result;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  async logout() {
    await authService.logout();
    window.localStorage.removeItem("apotek-token");
    window.localStorage.removeItem("apotek-user");
    set({ user: null, token: null });
  },
  setUser(user) {
    if (user) {
      window.localStorage.setItem("apotek-user", JSON.stringify(user));
    } else {
      window.localStorage.removeItem("apotek-user");
    }
    set({ user });
  }
}));
