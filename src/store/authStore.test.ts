import { beforeEach, describe, expect, it, vi } from "vitest";
import { authService } from "@/services/authService";
import { useAuthStore } from "./authStore";

vi.mock("@/services/authService", () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn()
  }
}));

describe("authStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null, isLoading: false });
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("resets loading when login fails", async () => {
    vi.mocked(authService.login).mockRejectedValueOnce(new Error("Login gagal"));

    await expect(
      useAuthStore.getState().login({ email: "admin@gmail.com", password: "secret" })
    ).rejects.toThrow("Login gagal");

    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});
