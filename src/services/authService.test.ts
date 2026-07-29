import { afterEach, describe, expect, it, vi } from "vitest";
import { authService } from "./authService";

describe("authService demo login", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses a dedicated owner email and defaults others to admin", async () => {
    const owner = await authService.login({ email: "owner@gmail.com", password: "secret" });
    const admin = await authService.login({ email: "admin@gmail.com", password: "secret" });

    expect(owner.user.role).toBe("owner");
    expect(owner.user.name).toBe("Owner Apotek");
    expect(admin.user.role).toBe("admin");
    expect(admin.user.name).toBe("Admin Apotek");
  });

  it("registers through the server endpoint", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          requiresEmailConfirmation: false,
          session: null
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const result = await authService.register({
      namaLengkap: "Edo",
      email: "kasir@gmail.com",
      password: "secret"
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/register", expect.objectContaining({ method: "POST" }));
    expect(result.session).toBeNull();
  });
});
