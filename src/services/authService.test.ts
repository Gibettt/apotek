import { describe, expect, it } from "vitest";
import { authService } from "./authService";

describe("authService demo login", () => {
  it("uses a dedicated owner email and defaults others to admin", async () => {
    const owner = await authService.login({ email: "owner@gmail.com", password: "secret" });
    const admin = await authService.login({ email: "admin@gmail.com", password: "secret" });

    expect(owner.user.role).toBe("owner");
    expect(owner.user.name).toBe("Owner Apotek");
    expect(admin.user.role).toBe("admin");
    expect(admin.user.name).toBe("Admin Apotek");
  });
});
