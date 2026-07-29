import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { KasirPelangganPicker } from "./KasirPelangganPicker";

const mocks = vi.hoisted(() => ({
  list: vi.fn()
}));

vi.mock("@/services/pelangganService", () => ({
  pelangganService: {
    list: mocks.list
  }
}));

describe("KasirPelangganPicker", () => {
  beforeEach(() => {
    mocks.list.mockReset();
    mocks.list.mockResolvedValue({
      data: [
        {
          id: "pel-1",
          kode: "PLG-1",
          nama: "Budi Santoso",
          telepon: "0812",
          member: false,
          aktif: true,
          createdAt: "",
          updatedAt: ""
        }
      ],
      total: 1,
      page: 1,
      perPage: 1000
    });
  });

  it("selects a customer from search results", async () => {
    const onChange = vi.fn();

    render(<KasirPelangganPicker onChange={onChange} />);

    fireEvent.change(await screen.findByPlaceholderText("Cari nama pelanggan"), {
      target: { value: "budi" }
    });
    fireEvent.click(await screen.findByRole("button", { name: /Budi Santoso/ }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ id: "pel-1", nama: "Budi Santoso" })
    );
  });

  it("emits typed customer name for automatic creation", async () => {
    const onNameChange = vi.fn();

    render(
      <KasirPelangganPicker onChange={vi.fn()} onNameChange={onNameChange} />
    );

    fireEvent.change(await screen.findByPlaceholderText("Cari nama pelanggan"), {
      target: { value: "Gita" }
    });

    expect(onNameChange).toHaveBeenCalledWith("Gita");
    expect(
      screen.getByText("Pelanggan baru akan otomatis dibuat saat pembayaran.")
    ).toBeInTheDocument();
  });
});
