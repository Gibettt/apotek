import { pelanggan } from "@/lib/mock-data";
import { delay, matchSearch, paginate, type ListParams } from "./serviceUtils";

export const pelangganService = {
  async list(params: ListParams = {}) {
    return delay(
      paginate(
        matchSearch(pelanggan, params.search, ["nama", "telepon", "alamat"]),
        params
      )
    );
  },

  async getById(id: number) {
    return delay(pelanggan.find((item) => item.id === id) ?? null);
  }
};
