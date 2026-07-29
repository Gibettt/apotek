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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  async login(credentials) {
    set({ isLoading: true });
    try {
      const session = await authService.login(credentials);
      window.localStorage.setItem("apotek-token", session.accessToken);
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
    set({ user: null, token: null });
  },
  setUser(user) {
    set({ user });
  }
}));
