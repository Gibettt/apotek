import { describe, expect, it } from "vitest";
import { resolveEffectiveRole } from "./roles";

describe("resolveEffectiveRole", () => {
  it("only treats owner@gmail.com as owner", () => {
    expect(resolveEffectiveRole("owner", "owner@gmail.com")).toBe("owner");
    expect(resolveEffectiveRole("owner", "admin@gmail.com")).toBe("admin");
    expect(resolveEffectiveRole("kasir", "kasir@gmail.com")).toBe("kasir");
  });
});
