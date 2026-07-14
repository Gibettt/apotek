import { kategoriObat } from "@/lib/mock-data";
import { delay, matchSearch, paginate, type ListParams } from "./serviceUtils";

export const kategoriService = {
  async list(params: ListParams = {}) {
    return delay(
      paginate(matchSearch(kategoriObat, params.search, ["nama", "deskripsi"]), params)
    );
  },

  async getById(id: number) {
    return delay(kategoriObat.find((item) => item.id === id) ?? null);
  }
};
