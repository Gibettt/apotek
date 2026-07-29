import { describe, expect, it, vi } from "vitest";
import { notifikasiService } from "./notifikasiService";

vi.mock("./stokService", () => ({
  stokService: {
    lowStock: vi.fn().mockResolvedValue([
      {
        id: "obat-low-1",
        nama: "Susu Notif",
        stokMinimum: 30,
        stokTersedia: 30
      }
    ]),
    expiredSoon: vi.fn().mockResolvedValue([])
  }
}));

describe("notifikasiService", () => {
  it("generates a bell notification for low stock items", async () => {
    const alerts = await notifikasiService.generateAlerts();

    expect(alerts).toContainEqual(
      expect.objectContaining({
        tipe: "stok_menipis",
        judul: "Stok menipis: Susu Notif",
        pesan: "Sisa stok 30, batas menipis 30. Segera lakukan restock.",
        referensiId: "obat-low-1"
      })
    );
  });
});
