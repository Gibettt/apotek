import { currentUser } from "@/lib/mock-data";
import type { AuthSession, LoginCredentials } from "@/types";

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    if (!credentials.email || !credentials.password) {
      throw new Error("Email dan password wajib diisi.");
    }

    return {
      accessToken: "mock-supabase-jwt",
      user: {
        ...currentUser,
        email: credentials.email
      }
    };
  },

  async logout() {
    return true;
  },

  async me() {
    return currentUser;
  }
};
