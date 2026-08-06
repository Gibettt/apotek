import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { KasirPelangganPicker } from "./KasirPelangganPicker";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  list: vi.fn()
}));

vi.mock("@/services/pelangganService", () => ({
  pelangganService: {
    create: mocks.create,
    list: mocks.list
  }
}));

describe("KasirPelangganPicker", () => {
  beforeEach(() => {
    mocks.create.mockReset();
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
    mocks.create.mockResolvedValue({
      id: "pel-new",
      kode: "PLG-NEW",
      nama: "Gita",
      member: false,
      aktif: true,
      createdAt: "",
      updatedAt: ""
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

  it("hides registered customers behind a toggle button", async () => {
    render(<KasirPelangganPicker onChange={vi.fn()} />);

    await screen.findByPlaceholderText("Cari nama pelanggan");

    expect(screen.queryByRole("button", { name: /Budi Santoso/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Pelanggan terdaftar/ }));

    expect(await screen.findByRole("button", { name: /Budi Santoso/ })).toBeInTheDocument();
  });

  it("creates a typed customer and selects it", async () => {
    const onChange = vi.fn();
    const onNameChange = vi.fn();

    render(
      <KasirPelangganPicker onChange={onChange} onNameChange={onNameChange} />
    );

    fireEvent.change(await screen.findByPlaceholderText("Cari nama pelanggan"), {
      target: { value: "Gita" }
    });

    expect(onNameChange).toHaveBeenCalledWith("Gita");

    fireEvent.click(
      screen.getByRole("button", { name: /Tambah Gita sebagai pelanggan/ })
    );

    await waitFor(() => {
      expect(mocks.create).toHaveBeenCalledWith({ nama: "Gita", aktif: true });
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ id: "pel-new", nama: "Gita" })
      );
      expect(onNameChange).toHaveBeenLastCalledWith("Gita");
    });
  });
});
